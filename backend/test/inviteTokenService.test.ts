import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  ApplicationError,
  type ApplicationErrorCode,
} from "../src/application/errors/applicationError.js";
import { InviteTokenService } from "../src/application/services/inviteTokenService.js";
import type {
  InviteTokenEventMember,
  InviteTokenRecord,
  InviteTokenRepository,
} from "../src/domain/repositories/inviteTokenRepository.js";

const FRONTEND_ORIGIN = "http://localhost:3000";

class FakeInviteTokenRepository implements InviteTokenRepository {
  readonly eventMembers = new Map<string, InviteTokenEventMember>();
  readonly events = new Map<string, { id: bigint }>();
  readonly tokens = new Map<string, InviteTokenRecord>();
  private nextId = 1n;

  async findEventMemberById(id: bigint) {
    return this.eventMembers.get(id.toString()) ?? null;
  }

  async findEventById(id: bigint) {
    return this.events.get(id.toString()) ?? null;
  }

  async createInviteToken(input: {
    eventId: bigint;
    inviteToken: string;
    expiresAt: Date;
  }): Promise<InviteTokenRecord> {
    const record: InviteTokenRecord = {
      id: this.nextId++,
      eventId: input.eventId,
      inviteToken: input.inviteToken,
      expiresAt: input.expiresAt,
      revokedAt: null,
      createdAt: new Date("2026-07-31T10:00:00.000Z"),
    };
    this.tokens.set(record.id.toString(), record);
    return record;
  }

  async findInviteTokenById(id: bigint) {
    return this.tokens.get(id.toString()) ?? null;
  }

  async revokeInviteToken(id: bigint, revokedAt: Date): Promise<void> {
    const token = this.tokens.get(id.toString());
    if (token !== undefined) {
      this.tokens.set(id.toString(), { ...token, revokedAt });
    }
  }
}

function createRepository() {
  const repo = new FakeInviteTokenRepository();
  repo.events.set("1", { id: 1n });
  repo.events.set("2", { id: 2n });

  repo.eventMembers.set("5", { id: 5n, eventId: 1n, role: "OWNER" });
  repo.eventMembers.set("6", { id: 6n, eventId: 1n, role: "MEMBER" });
  repo.eventMembers.set("7", { id: 7n, eventId: 2n, role: "OWNER" });

  return repo;
}

const expiresAt = new Date("2026-08-01T00:00:00.000Z");

describe("InviteTokenService", () => {
  describe("createInviteToken", () => {
    it("creates a token and returns dto", async () => {
      const repo = createRepository();
      const service = new InviteTokenService(repo, FRONTEND_ORIGIN);

      const result = await service.createInviteToken({
        eventId: 1n,
        currentMemberId: 5n,
        expiresAt,
      });

      assert.ok(result.inviteToken.id);
      assert.equal(result.inviteToken.eventId, "1");
      assert.ok(result.inviteToken.inviteToken);
      assert.ok(
        result.inviteToken.url.startsWith(`${FRONTEND_ORIGIN}/invite/`),
      );
      assert.equal(result.inviteToken.expiresAt, expiresAt.toISOString());
      assert.equal(result.inviteToken.revokedAt, null);
      assert.equal(
        new Date(result.inviteToken.createdAt).toISOString(),
        result.inviteToken.createdAt,
      );
    });

    it("rejects invalid expiresAt as conflict", async () => {
      const repo = createRepository();
      const service = new InviteTokenService(repo, FRONTEND_ORIGIN);

      await assertRejectsWithCode(
        () =>
          service.createInviteToken({
            eventId: 1n,
            currentMemberId: 5n,
            expiresAt: new Date("not-a-date"),
          }),
        "CONFLICT",
      );
    });

    it("rejects past expiresAt as conflict", async () => {
      const repo = createRepository();
      const service = new InviteTokenService(repo, FRONTEND_ORIGIN);

      await assertRejectsWithCode(
        () =>
          service.createInviteToken({
            eventId: 1n,
            currentMemberId: 5n,
            expiresAt: new Date("2020-01-01T00:00:00.000Z"),
          }),
        "CONFLICT",
      );
    });

    it("rejects unknown member as unauthorized", async () => {
      const repo = createRepository();
      const service = new InviteTokenService(repo, FRONTEND_ORIGIN);

      await assertRejectsWithCode(
        () =>
          service.createInviteToken({
            eventId: 1n,
            currentMemberId: 999n,
            expiresAt,
          }),
        "UNAUTHORIZED",
      );
    });

    it("rejects non-owner member as forbidden", async () => {
      const repo = createRepository();
      const service = new InviteTokenService(repo, FRONTEND_ORIGIN);

      await assertRejectsWithCode(
        () =>
          service.createInviteToken({
            eventId: 1n,
            currentMemberId: 6n,
            expiresAt,
          }),
        "FORBIDDEN",
      );
    });

    it("rejects member from different event as forbidden", async () => {
      const repo = createRepository();
      const service = new InviteTokenService(repo, FRONTEND_ORIGIN);

      await assertRejectsWithCode(
        () =>
          service.createInviteToken({
            eventId: 1n,
            currentMemberId: 7n,
            expiresAt,
          }),
        "FORBIDDEN",
      );
    });

    it("returns not found when event does not exist", async () => {
      const repo = createRepository();
      const service = new InviteTokenService(repo, FRONTEND_ORIGIN);

      await assertRejectsWithCode(
        () =>
          service.createInviteToken({
            eventId: 999n,
            currentMemberId: 5n,
            expiresAt,
          }),
        "NOT_FOUND",
      );
    });
  });

  describe("revokeInviteToken", () => {
    it("revokes a token", async () => {
      const repo = createRepository();
      const service = new InviteTokenService(repo, FRONTEND_ORIGIN);

      const { inviteToken } = await service.createInviteToken({
        eventId: 1n,
        currentMemberId: 5n,
        expiresAt,
      });

      await assert.doesNotReject(() =>
        service.revokeInviteToken({
          eventId: 1n,
          tokenId: BigInt(inviteToken.id),
          currentMemberId: 5n,
        }),
      );

      const stored = repo.tokens.get(inviteToken.id);
      assert.ok(stored?.revokedAt instanceof Date);
    });

    it("rejects unknown member as unauthorized", async () => {
      const repo = createRepository();
      const service = new InviteTokenService(repo, FRONTEND_ORIGIN);

      const { inviteToken } = await service.createInviteToken({
        eventId: 1n,
        currentMemberId: 5n,
        expiresAt,
      });

      await assertRejectsWithCode(
        () =>
          service.revokeInviteToken({
            eventId: 1n,
            tokenId: BigInt(inviteToken.id),
            currentMemberId: 999n,
          }),
        "UNAUTHORIZED",
      );
    });

    it("rejects non-owner member as forbidden", async () => {
      const repo = createRepository();
      const service = new InviteTokenService(repo, FRONTEND_ORIGIN);

      const { inviteToken } = await service.createInviteToken({
        eventId: 1n,
        currentMemberId: 5n,
        expiresAt,
      });

      await assertRejectsWithCode(
        () =>
          service.revokeInviteToken({
            eventId: 1n,
            tokenId: BigInt(inviteToken.id),
            currentMemberId: 6n,
          }),
        "FORBIDDEN",
      );
    });

    it("rejects member from different event as forbidden", async () => {
      const repo = createRepository();
      const service = new InviteTokenService(repo, FRONTEND_ORIGIN);

      const { inviteToken } = await service.createInviteToken({
        eventId: 1n,
        currentMemberId: 5n,
        expiresAt,
      });

      await assertRejectsWithCode(
        () =>
          service.revokeInviteToken({
            eventId: 1n,
            tokenId: BigInt(inviteToken.id),
            currentMemberId: 7n,
          }),
        "FORBIDDEN",
      );
    });

    it("returns not found when event does not exist", async () => {
      const repo = createRepository();
      const service = new InviteTokenService(repo, FRONTEND_ORIGIN);

      await assertRejectsWithCode(
        () =>
          service.revokeInviteToken({
            eventId: 999n,
            tokenId: 1n,
            currentMemberId: 5n,
          }),
        "NOT_FOUND",
      );
    });

    it("returns not found when token does not exist", async () => {
      const repo = createRepository();
      const service = new InviteTokenService(repo, FRONTEND_ORIGIN);

      await assertRejectsWithCode(
        () =>
          service.revokeInviteToken({
            eventId: 1n,
            tokenId: 999n,
            currentMemberId: 5n,
          }),
        "NOT_FOUND",
      );
    });

    it("returns not found when token belongs to different event", async () => {
      const repo = createRepository();
      const service = new InviteTokenService(repo, FRONTEND_ORIGIN);

      const { inviteToken } = await service.createInviteToken({
        eventId: 2n,
        currentMemberId: 7n,
        expiresAt,
      });

      await assertRejectsWithCode(
        () =>
          service.revokeInviteToken({
            eventId: 1n,
            tokenId: BigInt(inviteToken.id),
            currentMemberId: 5n,
          }),
        "NOT_FOUND",
      );
    });
  });
});

async function assertRejectsWithCode(
  action: () => Promise<unknown>,
  code: ApplicationErrorCode,
) {
  await assert.rejects(
    action,
    (error) =>
      error instanceof ApplicationError &&
      error.code === code &&
      typeof error.message === "string",
  );
}
