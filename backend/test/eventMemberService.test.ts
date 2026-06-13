import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  ApplicationError,
  type ApplicationErrorCode,
} from "../src/application/errors/applicationError.js";
import { EventMemberService } from "../src/application/services/eventMemberService.js";
import type {
  CurrentEventMember,
  EventMemberRecord,
  EventMemberRepository,
} from "../src/domain/repositories/eventMemberRepository.js";

class FakeEventMemberRepository implements EventMemberRepository {
  readonly eventMembers = new Map<string, CurrentEventMember>();
  readonly events = new Map<string, { id: bigint }>();
  readonly memberRecords = new Map<string, EventMemberRecord[]>();

  async findEventMemberById(eventMemberId: bigint) {
    return this.eventMembers.get(eventMemberId.toString()) ?? null;
  }

  async findEventById(eventId: bigint) {
    return this.events.get(eventId.toString()) ?? null;
  }

  async findMembersByEventId(eventId: bigint) {
    return this.memberRecords.get(eventId.toString()) ?? [];
  }
}

function createRepository() {
  const repo = new FakeEventMemberRepository();
  repo.events.set("1", { id: 1n });
  repo.events.set("2", { id: 2n });

  // event 1 members
  repo.eventMembers.set("5", {
    id: 5n,
    eventId: 1n,
    userId: 1n,
    displayName: "はせたく",
    role: "OWNER",
  });
  repo.eventMembers.set("6", {
    id: 6n,
    eventId: 1n,
    userId: null,
    displayName: "たくや",
    role: "MEMBER",
  });
  // event 2 member
  repo.eventMembers.set("7", {
    id: 7n,
    eventId: 2n,
    userId: null,
    displayName: "別イベント",
    role: "MEMBER",
  });

  repo.memberRecords.set("1", [
    {
      id: 5n,
      eventId: 1n,
      userId: 1n,
      displayName: "はせたく",
      role: "OWNER",
      user: { id: 1n, name: "はせたく", avatarUrl: null },
    },
    {
      id: 6n,
      eventId: 1n,
      userId: null,
      displayName: "たくや",
      role: "MEMBER",
      user: null,
    },
  ]);

  return repo;
}

describe("EventMemberService", () => {
  describe("listMembers", () => {
    it("returns members for the event", async () => {
      const repo = createRepository();
      const service = new EventMemberService(repo);

      const members = await service.listMembers({
        eventId: 1n,
        currentMemberId: 5n,
      });

      assert.equal(members.length, 2);
      assert.deepEqual(members[0], {
        id: "5",
        eventId: "1",
        userId: "1",
        displayName: "はせたく",
        role: "owner",
        memberType: "user",
        user: { id: "1", name: "はせたく", avatarUrl: null },
      });
      assert.deepEqual(members[1], {
        id: "6",
        eventId: "1",
        userId: null,
        displayName: "たくや",
        role: "member",
        memberType: "guest",
        user: null,
      });
    });

    it("rejects unknown member as unauthorized", async () => {
      const repo = createRepository();
      const service = new EventMemberService(repo);

      await assertRejectsWithCode(
        () => service.listMembers({ eventId: 1n, currentMemberId: 999n }),
        "UNAUTHORIZED",
      );
    });

    it("rejects non-participant as forbidden", async () => {
      const repo = createRepository();
      const service = new EventMemberService(repo);

      await assertRejectsWithCode(
        () => service.listMembers({ eventId: 1n, currentMemberId: 7n }),
        "FORBIDDEN",
      );
    });

    it("returns not found when event does not exist", async () => {
      const repo = createRepository();
      const service = new EventMemberService(repo);

      await assertRejectsWithCode(
        () => service.listMembers({ eventId: 999n, currentMemberId: 5n }),
        "NOT_FOUND",
      );
    });
  });

  describe("getMyMember", () => {
    it("returns current member info", async () => {
      const repo = createRepository();
      const service = new EventMemberService(repo);

      const eventMember = await service.getMyMember({
        eventId: 1n,
        currentMemberId: 6n,
      });

      assert.deepEqual(eventMember, {
        id: "6",
        eventId: "1",
        userId: null,
        displayName: "たくや",
        role: "member",
        memberType: "guest",
      });
    });

    it("returns owner role correctly", async () => {
      const repo = createRepository();
      const service = new EventMemberService(repo);

      const eventMember = await service.getMyMember({
        eventId: 1n,
        currentMemberId: 5n,
      });

      assert.equal(eventMember.role, "owner");
      assert.equal(eventMember.memberType, "user");
      assert.equal(eventMember.userId, "1");
    });

    it("rejects unknown member as unauthorized", async () => {
      const repo = createRepository();
      const service = new EventMemberService(repo);

      await assertRejectsWithCode(
        () => service.getMyMember({ eventId: 1n, currentMemberId: 999n }),
        "UNAUTHORIZED",
      );
    });

    it("rejects non-participant as forbidden", async () => {
      const repo = createRepository();
      const service = new EventMemberService(repo);

      await assertRejectsWithCode(
        () => service.getMyMember({ eventId: 1n, currentMemberId: 7n }),
        "FORBIDDEN",
      );
    });

    it("returns not found when event does not exist", async () => {
      const repo = createRepository();
      const service = new EventMemberService(repo);

      await assertRejectsWithCode(
        () => service.getMyMember({ eventId: 999n, currentMemberId: 5n }),
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
