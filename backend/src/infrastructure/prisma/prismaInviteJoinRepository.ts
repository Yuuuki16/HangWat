import { Prisma } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";

import { ApplicationError } from "../../application/errors/applicationError.js";

import type {
  InviteJoinEventMemberRecord,
  InviteJoinLocationRecord,
  InviteJoinRepository,
  InviteJoinTokenRecord,
} from "../../domain/repositories/inviteJoinRepository.js";

type DecimalLike = {
  toNumber(): number;
};

type PrismaLocation = {
  name: string;
  address: string | null;
  googlePlaceId: string | null;
  latitude: DecimalLike | null;
  longitude: DecimalLike | null;
  googleMapsUrl: string | null;
};

export class PrismaInviteJoinRepository implements InviteJoinRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findInviteToken(
    inviteToken: string,
  ): Promise<InviteJoinTokenRecord | null> {
    const token = await this.prisma.eventInviteToken.findUnique({
      where: { inviteToken },
      select: {
        inviteToken: true,
        eventId: true,
        expiresAt: true,
        revokedAt: true,
        event: {
          select: {
            id: true,
            title: true,
            eventDate: true,
            description: true,
            location: {
              select: this.locationSelect(),
            },
          },
        },
      },
    });

    if (token === null) return null;

    return {
      inviteToken: token.inviteToken,
      eventId: token.eventId,
      expiresAt: token.expiresAt,
      revokedAt: token.revokedAt,
      event: {
        ...token.event,
        location: this.toLocationRecord(token.event.location),
      },
    };
  }

  async isDisplayNameTaken(eventId: bigint, displayName: string) {
    const member = await this.prisma.eventMember.findFirst({
      where: { eventId, displayName },
      select: { id: true },
    });

    return member !== null;
  }

  async createGuestMemberWithSession(input: {
    eventId: bigint;
    displayName: string;
    sessionTokenHash: string;
    sessionExpiresAt: Date;
  }) {
    try {
    return await this.prisma.$transaction(async (tx) => {
      const eventMember = await tx.eventMember.create({
        data: {
          eventId: input.eventId,
          userId: null,
          displayName: input.displayName,
          role: "MEMBER",
        },
        select: this.eventMemberSelect(),
      });

      const memberSession = await tx.eventMemberSession.create({
        data: {
          eventMemberId: eventMember.id,
          sessionTokenHash: input.sessionTokenHash,
          expiresAt: input.sessionExpiresAt,
          lastUsedAt: new Date(),
        },
        select: { expiresAt: true },
      });

      return { eventMember, memberSession };
    });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ApplicationError(
          "CONFLICT",
          "同じイベント内で同じ表示名が既に使われています",
        );
      }
      throw error;
    }
  }

  async findMemberSessionByTokenHash(sessionTokenHash: string) {
    const memberSession = await this.prisma.eventMemberSession.findUnique({
      where: { sessionTokenHash },
      select: {
        expiresAt: true,
        revokedAt: true,
        eventMember: {
          select: this.eventMemberSelect(),
        },
      },
    });

    return memberSession;
  }

  async updateMemberSessionLastUsedAt(
    sessionTokenHash: string,
    lastUsedAt: Date,
  ): Promise<void> {
    await this.prisma.eventMemberSession.update({
      where: { sessionTokenHash },
      data: { lastUsedAt },
    });
  }

  private locationSelect() {
    return {
      name: true,
      address: true,
      googlePlaceId: true,
      latitude: true,
      longitude: true,
      googleMapsUrl: true,
    } satisfies Record<keyof PrismaLocation, true>;
  }

  private eventMemberSelect() {
    return {
      id: true,
      eventId: true,
      userId: true,
      displayName: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    } satisfies Record<keyof InviteJoinEventMemberRecord, true>;
  }

  private toLocationRecord(
    location: PrismaLocation | null,
  ): InviteJoinLocationRecord | null {
    if (location === null) return null;

    return {
      name: location.name,
      address: location.address,
      googlePlaceId: location.googlePlaceId,
      latitude: location.latitude?.toNumber() ?? null,
      longitude: location.longitude?.toNumber() ?? null,
      googleMapsUrl: location.googleMapsUrl,
    };
  }
}
