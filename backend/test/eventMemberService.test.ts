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
  EventMemberTarget,
} from "../src/domain/repositories/eventMemberRepository.js";

class FakeEventMemberRepository implements EventMemberRepository {
  readonly eventMembers = new Map<string, CurrentEventMember>();
  readonly events = new Map<string, { id: bigint }>();
  readonly memberRecords = new Map<string, EventMemberRecord[]>();
  readonly targets = new Map<string, EventMemberTarget>();
  deletedMemberIds: bigint[] = [];

  async findEventMemberById(eventMemberId: bigint) {
    return this.eventMembers.get(eventMemberId.toString()) ?? null;
  }

  async findEventById(eventId: bigint) {
    return this.events.get(eventId.toString()) ?? null;
  }

  async findMembersByEventId(eventId: bigint) {
    return this.memberRecords.get(eventId.toString()) ?? [];
  }

  async findMemberInEvent(eventId: bigint, memberId: bigint) {
    const target = this.targets.get(memberId.toString());
    if (target === undefined || target.eventId !== eventId) return null;
    return target;
  }

  async isDisplayNameTaken(
    eventId: bigint,
    displayName: string,
    excludeMemberId: bigint,
  ) {
    for (const target of this.targets.values()) {
      if (
        target.eventId === eventId &&
        target.displayName === displayName &&
        target.id !== excludeMemberId
      ) {
        return true;
      }
    }
    return false;
  }

  async updateDisplayName(
    memberId: bigint,
    displayName: string,
  ): Promise<EventMemberTarget> {
    const target = this.targets.get(memberId.toString());
    if (target === undefined) throw new Error("not found");
    const updated = { ...target, displayName, updatedAt: new Date() };
    this.targets.set(memberId.toString(), updated);
    return updated;
  }

  async deleteEventMember(memberId: bigint): Promise<void> {
    this.deletedMemberIds.push(memberId);
    this.targets.delete(memberId.toString());
  }
}

const baseDate = new Date("2026-01-01T00:00:00.000Z");

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

  // targets for event 1
  repo.targets.set("5", {
    id: 5n,
    eventId: 1n,
    userId: 1n,
    displayName: "はせたく",
    role: "OWNER",
    updatedAt: baseDate,
  });
  repo.targets.set("6", {
    id: 6n,
    eventId: 1n,
    userId: null,
    displayName: "たくや",
    role: "MEMBER",
    updatedAt: baseDate,
  });
  // target for event 2
  repo.targets.set("7", {
    id: 7n,
    eventId: 2n,
    userId: null,
    displayName: "別イベント",
    role: "MEMBER",
    updatedAt: baseDate,
  });

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

  describe("updateDisplayName", () => {
    it("owner can update own display name", async () => {
      const repo = createRepository();
      const service = new EventMemberService(repo);

      const result = await service.updateDisplayName({
        eventId: 1n,
        memberId: 5n,
        currentMemberId: 5n,
        displayName: "新しい名前",
      });

      assert.equal(result.id, "5");
      assert.equal(result.displayName, "新しい名前");
      assert.equal(result.role, "owner");
      assert.equal(typeof result.updatedAt, "string");
    });

    it("owner can update other member display name", async () => {
      const repo = createRepository();
      const service = new EventMemberService(repo);

      const result = await service.updateDisplayName({
        eventId: 1n,
        memberId: 6n,
        currentMemberId: 5n,
        displayName: "変更後",
      });

      assert.equal(result.id, "6");
      assert.equal(result.displayName, "変更後");
    });

    it("member can update own display name", async () => {
      const repo = createRepository();
      const service = new EventMemberService(repo);

      const result = await service.updateDisplayName({
        eventId: 1n,
        memberId: 6n,
        currentMemberId: 6n,
        displayName: "変更後",
      });

      assert.equal(result.displayName, "変更後");
    });

    it("member cannot update other member display name", async () => {
      const repo = createRepository();
      const service = new EventMemberService(repo);

      await assertRejectsWithCode(
        () =>
          service.updateDisplayName({
            eventId: 1n,
            memberId: 5n,
            currentMemberId: 6n,
            displayName: "ハック",
          }),
        "FORBIDDEN",
      );
    });

    it("returns conflict when display name is already taken", async () => {
      const repo = createRepository();
      const service = new EventMemberService(repo);

      await assertRejectsWithCode(
        () =>
          service.updateDisplayName({
            eventId: 1n,
            memberId: 6n,
            currentMemberId: 5n,
            displayName: "はせたく",
          }),
        "CONFLICT",
      );
    });

    it("allows same display name for self update", async () => {
      const repo = createRepository();
      const service = new EventMemberService(repo);

      const result = await service.updateDisplayName({
        eventId: 1n,
        memberId: 6n,
        currentMemberId: 6n,
        displayName: "たくや",
      });

      assert.equal(result.displayName, "たくや");
    });

    it("returns not found when event does not exist", async () => {
      const repo = createRepository();
      const service = new EventMemberService(repo);

      await assertRejectsWithCode(
        () =>
          service.updateDisplayName({
            eventId: 999n,
            memberId: 5n,
            currentMemberId: 5n,
            displayName: "新しい名前",
          }),
        "NOT_FOUND",
      );
    });

    it("returns not found when target member does not exist", async () => {
      const repo = createRepository();
      const service = new EventMemberService(repo);

      await assertRejectsWithCode(
        () =>
          service.updateDisplayName({
            eventId: 1n,
            memberId: 999n,
            currentMemberId: 5n,
            displayName: "新しい名前",
          }),
        "NOT_FOUND",
      );
    });

    it("returns unauthorized when current member is unknown", async () => {
      const repo = createRepository();
      const service = new EventMemberService(repo);

      await assertRejectsWithCode(
        () =>
          service.updateDisplayName({
            eventId: 1n,
            memberId: 6n,
            currentMemberId: 999n,
            displayName: "新しい名前",
          }),
        "UNAUTHORIZED",
      );
    });
  });

  describe("deleteMember", () => {
    it("owner can delete member", async () => {
      const repo = createRepository();
      const service = new EventMemberService(repo);

      await service.deleteMember({
        eventId: 1n,
        memberId: 6n,
        currentMemberId: 5n,
      });

      assert.ok(repo.deletedMemberIds.includes(6n));
    });

    it("member can delete (leave) themselves", async () => {
      const repo = createRepository();
      const service = new EventMemberService(repo);

      await service.deleteMember({
        eventId: 1n,
        memberId: 6n,
        currentMemberId: 6n,
      });

      assert.ok(repo.deletedMemberIds.includes(6n));
    });

    it("member cannot delete other members", async () => {
      const repo = createRepository();
      const service = new EventMemberService(repo);

      await assertRejectsWithCode(
        () =>
          service.deleteMember({
            eventId: 1n,
            memberId: 5n,
            currentMemberId: 6n,
          }),
        "FORBIDDEN",
      );
    });

    it("owner cannot leave (delete themselves)", async () => {
      const repo = createRepository();
      const service = new EventMemberService(repo);

      await assertRejectsWithCode(
        () =>
          service.deleteMember({
            eventId: 1n,
            memberId: 5n,
            currentMemberId: 5n,
          }),
        "CONFLICT",
      );
    });

    it("non-owner trying to delete owner gets forbidden not conflict", async () => {
      const repo = createRepository();
      const service = new EventMemberService(repo);

      await assertRejectsWithCode(
        () =>
          service.deleteMember({
            eventId: 1n,
            memberId: 5n,
            currentMemberId: 6n,
          }),
        "FORBIDDEN",
      );
    });

    it("returns not found when event does not exist", async () => {
      const repo = createRepository();
      const service = new EventMemberService(repo);

      await assertRejectsWithCode(
        () =>
          service.deleteMember({
            eventId: 999n,
            memberId: 6n,
            currentMemberId: 5n,
          }),
        "NOT_FOUND",
      );
    });

    it("returns not found when target member does not exist in event", async () => {
      const repo = createRepository();
      const service = new EventMemberService(repo);

      await assertRejectsWithCode(
        () =>
          service.deleteMember({
            eventId: 1n,
            memberId: 999n,
            currentMemberId: 5n,
          }),
        "NOT_FOUND",
      );
    });

    it("returns unauthorized when current member is unknown", async () => {
      const repo = createRepository();
      const service = new EventMemberService(repo);

      await assertRejectsWithCode(
        () =>
          service.deleteMember({
            eventId: 1n,
            memberId: 6n,
            currentMemberId: 999n,
          }),
        "UNAUTHORIZED",
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
