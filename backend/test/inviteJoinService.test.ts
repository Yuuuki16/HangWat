import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  InviteJoinError,
  InviteJoinService,
} from "../src/application/services/inviteJoinService.js";
import {
  ApplicationError,
  type ApplicationErrorCode,
} from "../src/application/errors/applicationError.js";
import type {
  InviteJoinEventMemberRecord,
  InviteJoinMemberSessionRecord,
  InviteJoinRepository,
  InviteJoinTokenRecord,
} from "../src/domain/repositories/inviteJoinRepository.js";

class FakeInviteJoinRepository implements InviteJoinRepository {
  readonly tokens = new Map<string, InviteJoinTokenRecord>();
  readonly members = new Map<string, InviteJoinEventMemberRecord>();
  readonly sessions = new Map<string, InviteJoinMemberSessionRecord>();
  lastUsedSessionHashes: string[] = [];
  private nextMemberId = 10n;

  async findInviteToken(inviteToken: string) {
    return this.tokens.get(inviteToken) ?? null;
  }

  async isDisplayNameTaken(eventId: bigint, displayName: string) {
    for (const member of this.members.values()) {
      if (member.eventId === eventId && member.displayName === displayName) {
        return true;
      }
    }
    return false;
  }

  async createGuestMemberWithSession(input: {
    eventId: bigint;
    displayName: string;
    sessionTokenHash: string;
    sessionExpiresAt: Date;
  }) {
    for (const member of this.members.values()) {
      if (
        member.eventId === input.eventId &&
        member.displayName === input.displayName
      ) {
        throw new ApplicationError(
          "CONFLICT",
          "同じイベント内で同じ表示名が既に使われています",
        );
      }
    }
    const now = new Date("2026-07-31T10:00:00.000Z");
    const eventMember: InviteJoinEventMemberRecord = {
      id: this.nextMemberId++,
      eventId: input.eventId,
      userId: null,
      displayName: input.displayName,
      role: "MEMBER",
      createdAt: now,
      updatedAt: now,
    };
    this.members.set(eventMember.id.toString(), eventMember);
    this.sessions.set(input.sessionTokenHash, {
      eventMember,
      expiresAt: input.sessionExpiresAt,
      revokedAt: null,
    });

    return {
      eventMember,
      memberSession: { expiresAt: input.sessionExpiresAt },
    };
  }

  async findMemberSessionByTokenHash(sessionTokenHash: string) {
    return this.sessions.get(sessionTokenHash) ?? null;
  }

  async updateMemberSessionLastUsedAt(sessionTokenHash: string) {
    this.lastUsedSessionHashes.push(sessionTokenHash);
  }
}

function createRepository() {
  const repo = new FakeInviteJoinRepository();
  repo.tokens.set("active-token", {
    inviteToken: "active-token",
    eventId: 1n,
    expiresAt: new Date("2026-08-01T00:00:00.000Z"),
    revokedAt: null,
    event: {
      id: 1n,
      title: "梅田で昼ごはん",
      eventDate: new Date("2026-07-31T00:00:00.000Z"),
      description: "昼ごはん候補を決める",
      location: {
        name: "大阪駅",
        address: "大阪府大阪市北区梅田3丁目1-1",
        googlePlaceId: "ChIJxxxxxxxxxxxx",
        latitude: 34.702485,
        longitude: 135.495951,
        googleMapsUrl: "https://www.google.com/maps/place/...",
      },
    },
  });
  repo.tokens.set("expired-token", {
    ...repo.tokens.get("active-token")!,
    inviteToken: "expired-token",
    expiresAt: new Date("2020-01-01T00:00:00.000Z"),
  });
  repo.tokens.set("revoked-token", {
    ...repo.tokens.get("active-token")!,
    inviteToken: "revoked-token",
    revokedAt: new Date("2026-07-01T00:00:00.000Z"),
  });
  repo.members.set("1", {
    id: 1n,
    eventId: 1n,
    userId: null,
    displayName: "既存メンバー",
    role: "MEMBER",
    createdAt: new Date("2026-07-01T00:00:00.000Z"),
    updatedAt: new Date("2026-07-01T00:00:00.000Z"),
  });
  return repo;
}

describe("InviteJoinService", () => {
  describe("getInviteEvent", () => {
    it("returns event preview for active invite token", async () => {
      const service = new InviteJoinService(createRepository());

      const result = await service.getInviteEvent({
        inviteToken: "active-token",
      });

      assert.deepEqual(result, {
        event: {
          id: "1",
          title: "梅田で昼ごはん",
          date: "2026-07-31",
          description: "昼ごはん候補を決める",
          location: {
            name: "大阪駅",
            address: "大阪府大阪市北区梅田3丁目1-1",
            googlePlaceId: "ChIJxxxxxxxxxxxx",
            latitude: 34.702485,
            longitude: 135.495951,
            googleMapsUrl: "https://www.google.com/maps/place/...",
          },
        },
        requiresDisplayName: true,
      });
    });

    it("returns not found for unknown invite token", async () => {
      const service = new InviteJoinService(createRepository());

      await assertApplicationError(
        () => service.getInviteEvent({ inviteToken: "unknown" }),
        "NOT_FOUND",
      );
    });

    it("rejects expired invite token", async () => {
      const service = new InviteJoinService(createRepository());

      await assertInviteJoinError(
        () => service.getInviteEvent({ inviteToken: "expired-token" }),
        "INVITE_TOKEN_EXPIRED",
      );
    });

    it("rejects revoked invite token", async () => {
      const service = new InviteJoinService(createRepository());

      await assertInviteJoinError(
        () => service.getInviteEvent({ inviteToken: "revoked-token" }),
        "INVITE_TOKEN_REVOKED",
      );
    });
  });

  describe("joinByInviteToken", () => {
    it("creates guest member and member session", async () => {
      const service = new InviteJoinService(createRepository());

      const result = await service.joinByInviteToken({
        inviteToken: "active-token",
        displayName: "  たくや  ",
      });

      assert.equal(result.eventMember.eventId, "1");
      assert.equal(result.eventMember.userId, null);
      assert.equal(result.eventMember.displayName, "たくや");
      assert.equal(result.eventMember.role, "member");
      assert.equal(result.eventMember.memberType, "guest");
      assert.ok(result.memberSession.token.length > 0);
      assert.equal(
        new Date(result.memberSession.expiresAt).toISOString(),
        result.memberSession.expiresAt,
      );
    });

    it("rejects duplicated display name", async () => {
      const service = new InviteJoinService(createRepository());

      await assertApplicationError(
        () =>
          service.joinByInviteToken({
            inviteToken: "active-token",
            displayName: "既存メンバー",
          }),
        "CONFLICT",
      );
    });
  });

  describe("rejoinByMemberSession", () => {
    it("returns same event member with member session token", async () => {
      const repo = createRepository();
      const service = new InviteJoinService(repo);
      const joined = await service.joinByInviteToken({
        inviteToken: "active-token",
        displayName: "たくや",
      });

      const result = await service.rejoinByMemberSession({
        inviteToken: "active-token",
        memberSessionToken: joined.memberSession.token,
      });

      assert.equal(result.eventMember.id, joined.eventMember.id);
      assert.equal(result.eventMember.displayName, "たくや");
      assert.equal(repo.lastUsedSessionHashes.length, 1);
    });

    it("rejects invalid member session token", async () => {
      const service = new InviteJoinService(createRepository());

      await assertApplicationError(
        () =>
          service.rejoinByMemberSession({
            inviteToken: "active-token",
            memberSessionToken: "invalid",
          }),
        "UNAUTHORIZED",
      );
    });

    it("rejects expired member session token", async () => {
      const repo = createRepository();
      const service = new InviteJoinService(repo);
      const joined = await service.joinByInviteToken({
        inviteToken: "active-token",
        displayName: "たくや",
      });
      for (const [hash, session] of repo.sessions) {
        repo.sessions.set(hash, {
          ...session,
          expiresAt: new Date("2020-01-01T00:00:00.000Z"),
        });
      }

      await assertInviteJoinError(
        () =>
          service.rejoinByMemberSession({
            inviteToken: "active-token",
            memberSessionToken: joined.memberSession.token,
          }),
        "MEMBER_SESSION_EXPIRED",
      );
    });
  });
});

async function assertApplicationError(
  action: () => Promise<unknown>,
  code: ApplicationErrorCode,
) {
  await assert.rejects(
    action,
    (error) => error instanceof ApplicationError && error.code === code,
  );
}

async function assertInviteJoinError(
  action: () => Promise<unknown>,
  code: "INVITE_TOKEN_EXPIRED" | "INVITE_TOKEN_REVOKED" | "MEMBER_SESSION_EXPIRED",
) {
  await assert.rejects(
    action,
    (error) => error instanceof InviteJoinError && error.code === code,
  );
}
