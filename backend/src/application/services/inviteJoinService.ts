import { createHash, randomBytes } from "node:crypto";

import { ApplicationError } from "../errors/applicationError.js";
import type {
  InviteJoinEventMemberRecord,
  InviteJoinLocationRecord,
  InviteJoinRepository,
  InviteJoinTokenRecord,
} from "../../domain/repositories/inviteJoinRepository.js";

const memberSessionTtlMs = 1000 * 60 * 60 * 24 * 30;

export type InviteJoinErrorCode =
  | "INVITE_TOKEN_EXPIRED"
  | "INVITE_TOKEN_REVOKED"
  | "MEMBER_SESSION_EXPIRED";

export class InviteJoinError extends Error {
  constructor(
    readonly code: InviteJoinErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "InviteJoinError";
  }
}

type LocationDto = {
  name: string;
  address: string | null;
  googlePlaceId: string | null;
  latitude: number | null;
  longitude: number | null;
  googleMapsUrl: string | null;
};

export type InviteEventPreviewDto = {
  event: {
    id: string;
    title: string;
    date: string | null;
    description: string | null;
    location: LocationDto | null;
  };
  requiresDisplayName: true;
};

export type InviteEventMemberDto = {
  id: string;
  eventId: string;
  userId: string | null;
  displayName: string;
  role: "owner" | "member";
  memberType: "user" | "guest";
  createdAt: string;
  updatedAt: string;
};

export type MemberSessionDto = {
  token: string;
  expiresAt: string;
};

export class InviteJoinService {
  constructor(private readonly inviteJoinRepository: InviteJoinRepository) {}

  async getInviteEvent(input: {
    inviteToken: string;
  }): Promise<InviteEventPreviewDto> {
    const inviteToken = await this.resolveActiveInviteToken(input.inviteToken);

    return {
      event: {
        id: inviteToken.event.id.toString(),
        title: inviteToken.event.title,
        date:
          inviteToken.event.eventDate === null
            ? null
            : formatDate(inviteToken.event.eventDate),
        description: inviteToken.event.description,
        location: toLocationDto(inviteToken.event.location),
      },
      requiresDisplayName: true,
    };
  }

  async joinByInviteToken(input: {
    inviteToken: string;
    displayName: string;
  }): Promise<{
    eventMember: InviteEventMemberDto;
    memberSession: MemberSessionDto;
  }> {
    const inviteToken = await this.resolveActiveInviteToken(input.inviteToken);
    const displayName = input.displayName.trim();

    const sessionToken = generateSessionToken();
    const sessionExpiresAt = new Date(Date.now() + memberSessionTtlMs);
    const result =
      await this.inviteJoinRepository.createGuestMemberWithSession({
        eventId: inviteToken.eventId,
        displayName,
        sessionTokenHash: hashSessionToken(sessionToken),
        sessionExpiresAt,
      });

    return {
      eventMember: toEventMemberDto(result.eventMember),
      memberSession: {
        token: sessionToken,
        expiresAt: result.memberSession.expiresAt.toISOString(),
      },
    };
  }

  async rejoinByMemberSession(input: {
    inviteToken: string;
    memberSessionToken: string;
  }): Promise<{ eventMember: InviteEventMemberDto }> {
    const inviteToken = await this.inviteJoinRepository.findInviteToken(
      input.inviteToken,
    );
    if (inviteToken === null) {
      throw new ApplicationError("NOT_FOUND", "招待URLが存在しません");
    }

    const memberSession =
      await this.inviteJoinRepository.findMemberSessionByTokenHash(
        hashSessionToken(input.memberSessionToken),
      );
    if (
      memberSession === null ||
      memberSession.eventMember.eventId !== inviteToken.eventId
    ) {
      throw new ApplicationError("UNAUTHORIZED", "ローカルトークンが不正です");
    }
    if (memberSession.revokedAt !== null) {
      throw new ApplicationError("UNAUTHORIZED", "ローカルトークンが不正です");
    }
    if (memberSession.expiresAt <= new Date()) {
      throw new InviteJoinError(
        "MEMBER_SESSION_EXPIRED",
        "ローカルトークンの有効期限が切れています",
      );
    }

    await this.inviteJoinRepository.updateMemberSessionLastUsedAt(
      hashSessionToken(input.memberSessionToken),
      new Date(),
    );

    return { eventMember: toEventMemberDto(memberSession.eventMember) };
  }

  private async resolveActiveInviteToken(inviteTokenText: string) {
    const inviteToken =
      await this.inviteJoinRepository.findInviteToken(inviteTokenText);
    if (inviteToken === null) {
      throw new ApplicationError("NOT_FOUND", "招待URLが存在しません");
    }
    assertInviteTokenActive(inviteToken);
    return inviteToken;
  }
}

function assertInviteTokenActive(inviteToken: InviteJoinTokenRecord) {
  if (inviteToken.revokedAt !== null) {
    throw new InviteJoinError(
      "INVITE_TOKEN_REVOKED",
      "招待URLが無効化されています",
    );
  }
  if (inviteToken.expiresAt <= new Date()) {
    throw new InviteJoinError(
      "INVITE_TOKEN_EXPIRED",
      "招待URLの有効期限が切れています",
    );
  }
}

function toLocationDto(
  location: InviteJoinLocationRecord | null,
): LocationDto | null {
  if (location === null) return null;
  return {
    name: location.name,
    address: location.address,
    googlePlaceId: location.googlePlaceId,
    latitude: location.latitude,
    longitude: location.longitude,
    googleMapsUrl: location.googleMapsUrl,
  };
}

function toEventMemberDto(
  eventMember: InviteJoinEventMemberRecord,
): InviteEventMemberDto {
  return {
    id: eventMember.id.toString(),
    eventId: eventMember.eventId.toString(),
    userId: eventMember.userId?.toString() ?? null,
    displayName: eventMember.displayName,
    role: eventMember.role === "OWNER" ? "owner" : "member",
    memberType: eventMember.userId === null ? "guest" : "user",
    createdAt: eventMember.createdAt.toISOString(),
    updatedAt: eventMember.updatedAt.toISOString(),
  };
}

function generateSessionToken() {
  return randomBytes(32).toString("base64url");
}

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}
