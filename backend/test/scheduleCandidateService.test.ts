import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  ApplicationError,
  type ApplicationErrorCode,
} from "../src/application/errors/applicationError.js";
import { ScheduleCandidateService } from "../src/application/services/scheduleCandidateService.js";
import type {
  ScheduleCandidateEvent,
  ScheduleCandidateEventMember,
  ScheduleCandidateLocationInput,
  ScheduleCandidateRecord,
  ScheduleCandidateRepository,
} from "../src/domain/repositories/scheduleCandidateRepository.js";

class FakeScheduleCandidateRepository
  implements ScheduleCandidateRepository
{
  readonly eventMembers = new Map<string, ScheduleCandidateEventMember>();
  readonly events = new Map<string, ScheduleCandidateEvent>();
  readonly candidates = new Map<string, ScheduleCandidateRecord>();
  readonly locations = new Map<string, ScheduleCandidateLocationInput>();
  readonly deletedCandidateIds: bigint[] = [];
  nextCandidateId = 10n;
  nextLocationId = 20n;

  async findEventMemberById(eventMemberId: bigint) {
    return this.eventMembers.get(key(eventMemberId)) ?? null;
  }

  async findEventById(eventId: bigint) {
    return this.events.get(key(eventId)) ?? null;
  }

  async findScheduleCandidateById(candidateId: bigint) {
    return this.candidates.get(key(candidateId)) ?? null;
  }

  async createScheduleCandidate(input: {
    eventId: bigint;
    createdByMemberId: bigint;
    title: string;
    startsAt: Date;
    endsAt: Date | null;
    location: ScheduleCandidateLocationInput | null;
    description: string | null;
  }) {
    const id = this.nextCandidateId;
    this.nextCandidateId += 1n;
    const locationId = input.location === null ? null : this.nextLocationId;
    if (input.location !== null && locationId !== null) {
      this.nextLocationId += 1n;
      this.locations.set(key(locationId), input.location);
    }

    const createdByMember = this.eventMembers.get(
      key(input.createdByMemberId),
    );
    assert.ok(createdByMember);

    const now = new Date("2026-07-31T10:00:00.000Z");
    const candidate: ScheduleCandidateRecord = {
      id,
      eventId: input.eventId,
      createdByMemberId: input.createdByMemberId,
      title: input.title,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      location:
        input.location === null || locationId === null
          ? null
          : {
              id: locationId,
              ...input.location,
            },
      description: input.description,
      status: "PROPOSED",
      createdByMember: {
        id: createdByMember.id,
        userId: createdByMember.userId,
        displayName: createdByMember.displayName,
      },
      commentCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    this.candidates.set(key(id), candidate);
    return candidate;
  }

  async updateScheduleCandidate(input: {
    candidateId: bigint;
    title: string;
    startsAt: Date;
    endsAt: Date | null;
    location: ScheduleCandidateLocationInput | null;
    description: string | null;
  }) {
    const existingCandidate = this.candidates.get(key(input.candidateId));
    assert.ok(existingCandidate);

    const locationId = input.location === null ? null : this.nextLocationId;
    if (input.location !== null && locationId !== null) {
      this.nextLocationId += 1n;
      this.locations.set(key(locationId), input.location);
    }

    const updatedCandidate: ScheduleCandidateRecord = {
      ...existingCandidate,
      title: input.title,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      location:
        input.location === null || locationId === null
          ? null
          : {
              id: locationId,
              ...input.location,
            },
      description: input.description,
      updatedAt: new Date("2026-07-31T10:30:00.000Z"),
    };

    this.candidates.set(key(input.candidateId), updatedCandidate);
    return updatedCandidate;
  }

  async deleteScheduleCandidateById(candidateId: bigint) {
    this.deletedCandidateIds.push(candidateId);
    this.candidates.delete(key(candidateId));
  }
}

describe("ScheduleCandidateService", () => {
  it("creates a schedule candidate by event participant", async () => {
    const repository = createRepository();
    const service = new ScheduleCandidateService(repository);

    const candidate = await service.createScheduleCandidate({
      eventId: 1n,
      currentMemberId: 5n,
      title: "  一蘭で昼ごはん  ",
      startAt: new Date("2026-07-31T13:00:00+09:00"),
      endAt: new Date("2026-07-31T14:00:00+09:00"),
      location: {
        name: "一蘭 梅田店",
        address: "大阪府大阪市北区...",
        googlePlaceId: "ChIJyyyyyyyyyyyy",
        latitude: 34.701111,
        longitude: 135.500111,
        googleMapsUrl: "https://www.google.com/maps/place/...",
      },
      description: "  梅田の一蘭に行く案  ",
    });

    assert.equal(repository.candidates.get("10")?.title, "一蘭で昼ごはん");
    assert.equal(repository.candidates.get("10")?.description, "梅田の一蘭に行く案");
    assert.deepEqual(candidate, {
      id: "10",
      eventId: "1",
      title: "一蘭で昼ごはん",
      startAt: "2026-07-31T04:00:00.000Z",
      endAt: "2026-07-31T05:00:00.000Z",
      location: {
        name: "一蘭 梅田店",
        address: "大阪府大阪市北区...",
        googlePlaceId: "ChIJyyyyyyyyyyyy",
        latitude: 34.701111,
        longitude: 135.500111,
        googleMapsUrl: "https://www.google.com/maps/place/...",
      },
      description: "梅田の一蘭に行く案",
      status: "pending",
      createdByMember: {
        id: "5",
        displayName: "たくや",
        memberType: "guest",
      },
      commentCount: 0,
      likeCount: 0,
      createdAt: "2026-07-31T10:00:00.000Z",
      updatedAt: "2026-07-31T10:00:00.000Z",
    });
  });

  it("creates Location and ScheduleCandidate with location", async () => {
    const repository = createRepository();
    const service = new ScheduleCandidateService(repository);

    await service.createScheduleCandidate({
      eventId: 1n,
      currentMemberId: 5n,
      title: "一蘭で昼ごはん",
      startAt: new Date("2026-07-31T13:00:00+09:00"),
      endAt: null,
      location: {
        name: "一蘭 梅田店",
        address: "大阪府大阪市北区...",
        googlePlaceId: null,
        latitude: null,
        longitude: null,
        googleMapsUrl: null,
      },
      description: null,
    });

    assert.deepEqual(repository.locations.get("20"), {
      name: "一蘭 梅田店",
      address: "大阪府大阪市北区...",
      googlePlaceId: null,
      latitude: null,
      longitude: null,
      googleMapsUrl: null,
    });
    assert.equal(repository.candidates.get("10")?.location?.id, 20n);
  });

  it("creates ScheduleCandidate without location", async () => {
    const repository = createRepository();
    const service = new ScheduleCandidateService(repository);

    const candidate = await service.createScheduleCandidate({
      eventId: 1n,
      currentMemberId: 6n,
      title: "駅前集合",
      startAt: new Date("2026-07-31T13:00:00+09:00"),
      endAt: null,
      location: null,
      description: "",
    });

    assert.equal(repository.locations.size, 0);
    assert.equal(repository.candidates.get("10")?.location, null);
    assert.equal(candidate.location, null);
    assert.equal(candidate.description, null);
    assert.deepEqual(candidate.createdByMember, {
      id: "6",
      displayName: "ゆい",
      memberType: "user",
    });
  });

  it("rejects unknown current event member as unauthorized", async () => {
    const repository = createRepository();
    const service = new ScheduleCandidateService(repository);

    await assertRejectsWithCode(
      () =>
        service.createScheduleCandidate({
          eventId: 1n,
          currentMemberId: 999n,
          title: "一蘭で昼ごはん",
          startAt: new Date("2026-07-31T13:00:00+09:00"),
          endAt: null,
          location: null,
          description: null,
        }),
      "UNAUTHORIZED",
    );
  });

  it("rejects non participant as forbidden", async () => {
    const repository = createRepository();
    const service = new ScheduleCandidateService(repository);

    await assertRejectsWithCode(
      () =>
        service.createScheduleCandidate({
          eventId: 1n,
          currentMemberId: 7n,
          title: "一蘭で昼ごはん",
          startAt: new Date("2026-07-31T13:00:00+09:00"),
          endAt: null,
          location: null,
          description: null,
        }),
      "FORBIDDEN",
    );
    assert.equal(repository.candidates.size, 0);
  });

  it("returns not found when event does not exist", async () => {
    const repository = createRepository();
    const service = new ScheduleCandidateService(repository);

    await assertRejectsWithCode(
      () =>
        service.createScheduleCandidate({
          eventId: 999n,
          currentMemberId: 5n,
          title: "一蘭で昼ごはん",
          startAt: new Date("2026-07-31T13:00:00+09:00"),
          endAt: null,
          location: null,
          description: null,
        }),
      "NOT_FOUND",
    );
    assert.equal(repository.candidates.size, 0);
  });

  it("updates a schedule candidate by creator", async () => {
    const repository = createRepository();
    await createExistingCandidate(repository);
    const service = new ScheduleCandidateService(repository);

    const candidate = await service.updateScheduleCandidate({
      eventId: 1n,
      candidateId: 10n,
      currentMemberId: 5n,
      title: "  一蘭で昼ごはん  ",
      startAt: new Date("2026-07-31T13:30:00+09:00"),
      endAt: new Date("2026-07-31T14:30:00+09:00"),
      location: null,
      description: "  開始時間を変更  ",
    });

    assert.equal(repository.candidates.get("10")?.title, "一蘭で昼ごはん");
    assert.equal(repository.candidates.get("10")?.description, "開始時間を変更");
    assert.equal(candidate.startAt, "2026-07-31T04:30:00.000Z");
    assert.equal(candidate.endAt, "2026-07-31T05:30:00.000Z");
    assert.equal(candidate.location, null);
    assert.equal(candidate.updatedAt, "2026-07-31T10:30:00.000Z");
  });

  it("updates a schedule candidate by owner", async () => {
    const repository = createRepository();
    await createExistingCandidate(repository);
    const service = new ScheduleCandidateService(repository);

    const candidate = await service.updateScheduleCandidate({
      eventId: 1n,
      candidateId: 10n,
      currentMemberId: 8n,
      title: "owner更新",
      startAt: new Date("2026-07-31T13:30:00+09:00"),
      endAt: null,
      location: null,
      description: null,
    });

    assert.equal(candidate.title, "owner更新");
  });

  it("replaces location when updating a schedule candidate", async () => {
    const repository = createRepository();
    await createExistingCandidate(repository);
    const service = new ScheduleCandidateService(repository);

    const candidate = await service.updateScheduleCandidate({
      eventId: 1n,
      candidateId: 10n,
      currentMemberId: 5n,
      title: "一蘭で昼ごはん",
      startAt: new Date("2026-07-31T13:30:00+09:00"),
      endAt: null,
      location: {
        name: "一蘭 新店舗",
        address: "大阪府大阪市北区...",
        googlePlaceId: null,
        latitude: null,
        longitude: null,
        googleMapsUrl: null,
      },
      description: null,
    });

    assert.deepEqual(repository.locations.get("21"), {
      name: "一蘭 新店舗",
      address: "大阪府大阪市北区...",
      googlePlaceId: null,
      latitude: null,
      longitude: null,
      googleMapsUrl: null,
    });
    assert.equal(repository.candidates.get("10")?.location?.id, 21n);
    assert.equal(candidate.location?.name, "一蘭 新店舗");
  });

  it("clears location when updating with null location", async () => {
    const repository = createRepository();
    await createExistingCandidate(repository);
    const service = new ScheduleCandidateService(repository);

    const candidate = await service.updateScheduleCandidate({
      eventId: 1n,
      candidateId: 10n,
      currentMemberId: 5n,
      title: "駅前集合",
      startAt: new Date("2026-07-31T13:30:00+09:00"),
      endAt: null,
      location: null,
      description: null,
    });

    assert.equal(repository.candidates.get("10")?.location, null);
    assert.equal(candidate.location, null);
  });

  it("rejects unknown current event member on update as unauthorized", async () => {
    const repository = createRepository();
    await createExistingCandidate(repository);
    const service = new ScheduleCandidateService(repository);

    await assertRejectsWithCode(
      () =>
        service.updateScheduleCandidate({
          eventId: 1n,
          candidateId: 10n,
          currentMemberId: 999n,
          title: "一蘭で昼ごはん",
          startAt: new Date("2026-07-31T13:30:00+09:00"),
          endAt: null,
          location: null,
          description: null,
        }),
      "UNAUTHORIZED",
    );
  });

  it("rejects non participant on update as forbidden", async () => {
    const repository = createRepository();
    await createExistingCandidate(repository);
    const service = new ScheduleCandidateService(repository);

    await assertRejectsWithCode(
      () =>
        service.updateScheduleCandidate({
          eventId: 1n,
          candidateId: 10n,
          currentMemberId: 7n,
          title: "一蘭で昼ごはん",
          startAt: new Date("2026-07-31T13:30:00+09:00"),
          endAt: null,
          location: null,
          description: null,
        }),
      "FORBIDDEN",
    );
  });

  it("rejects third party on update as forbidden", async () => {
    const repository = createRepository();
    await createExistingCandidate(repository);
    const service = new ScheduleCandidateService(repository);

    await assertRejectsWithCode(
      () =>
        service.updateScheduleCandidate({
          eventId: 1n,
          candidateId: 10n,
          currentMemberId: 6n,
          title: "一蘭で昼ごはん",
          startAt: new Date("2026-07-31T13:30:00+09:00"),
          endAt: null,
          location: null,
          description: null,
        }),
      "FORBIDDEN",
    );
  });

  it("returns not found when updating candidate for unknown event", async () => {
    const repository = createRepository();
    await createExistingCandidate(repository);
    const service = new ScheduleCandidateService(repository);

    await assertRejectsWithCode(
      () =>
        service.updateScheduleCandidate({
          eventId: 999n,
          candidateId: 10n,
          currentMemberId: 5n,
          title: "一蘭で昼ごはん",
          startAt: new Date("2026-07-31T13:30:00+09:00"),
          endAt: null,
          location: null,
          description: null,
        }),
      "NOT_FOUND",
    );
  });

  it("returns not found when updating unknown candidate", async () => {
    const repository = createRepository();
    const service = new ScheduleCandidateService(repository);

    await assertRejectsWithCode(
      () =>
        service.updateScheduleCandidate({
          eventId: 1n,
          candidateId: 999n,
          currentMemberId: 5n,
          title: "一蘭で昼ごはん",
          startAt: new Date("2026-07-31T13:30:00+09:00"),
          endAt: null,
          location: null,
          description: null,
        }),
      "NOT_FOUND",
    );
  });

  it("returns not found when updating candidate from another event", async () => {
    const repository = createRepository();
    await createExistingCandidate(repository, { eventId: 2n });
    const service = new ScheduleCandidateService(repository);

    await assertRejectsWithCode(
      () =>
        service.updateScheduleCandidate({
          eventId: 1n,
          candidateId: 10n,
          currentMemberId: 5n,
          title: "一蘭で昼ごはん",
          startAt: new Date("2026-07-31T13:30:00+09:00"),
          endAt: null,
          location: null,
          description: null,
        }),
      "NOT_FOUND",
    );
  });

  it("deletes a schedule candidate by creator", async () => {
    const repository = createRepository();
    await createExistingCandidate(repository);
    const service = new ScheduleCandidateService(repository);

    await service.deleteScheduleCandidate({
      eventId: 1n,
      candidateId: 10n,
      currentMemberId: 5n,
    });

    assert.deepEqual(repository.deletedCandidateIds, [10n]);
    assert.equal(repository.candidates.has("10"), false);
  });

  it("deletes a schedule candidate by owner", async () => {
    const repository = createRepository();
    await createExistingCandidate(repository);
    const service = new ScheduleCandidateService(repository);

    await service.deleteScheduleCandidate({
      eventId: 1n,
      candidateId: 10n,
      currentMemberId: 8n,
    });

    assert.deepEqual(repository.deletedCandidateIds, [10n]);
    assert.equal(repository.candidates.has("10"), false);
  });

  it("rejects unknown current event member on delete as unauthorized", async () => {
    const repository = createRepository();
    await createExistingCandidate(repository);
    const service = new ScheduleCandidateService(repository);

    await assertRejectsWithCode(
      () =>
        service.deleteScheduleCandidate({
          eventId: 1n,
          candidateId: 10n,
          currentMemberId: 999n,
        }),
      "UNAUTHORIZED",
    );
    assert.deepEqual(repository.deletedCandidateIds, []);
  });

  it("rejects non participant on delete as forbidden", async () => {
    const repository = createRepository();
    await createExistingCandidate(repository);
    const service = new ScheduleCandidateService(repository);

    await assertRejectsWithCode(
      () =>
        service.deleteScheduleCandidate({
          eventId: 1n,
          candidateId: 10n,
          currentMemberId: 7n,
        }),
      "FORBIDDEN",
    );
    assert.deepEqual(repository.deletedCandidateIds, []);
  });

  it("rejects third party on delete as forbidden", async () => {
    const repository = createRepository();
    await createExistingCandidate(repository);
    const service = new ScheduleCandidateService(repository);

    await assertRejectsWithCode(
      () =>
        service.deleteScheduleCandidate({
          eventId: 1n,
          candidateId: 10n,
          currentMemberId: 6n,
        }),
      "FORBIDDEN",
    );
    assert.deepEqual(repository.deletedCandidateIds, []);
  });

  it("returns not found when deleting candidate for unknown event", async () => {
    const repository = createRepository();
    await createExistingCandidate(repository);
    const service = new ScheduleCandidateService(repository);

    await assertRejectsWithCode(
      () =>
        service.deleteScheduleCandidate({
          eventId: 999n,
          candidateId: 10n,
          currentMemberId: 5n,
        }),
      "NOT_FOUND",
    );
    assert.deepEqual(repository.deletedCandidateIds, []);
  });

  it("returns not found when deleting unknown candidate", async () => {
    const repository = createRepository();
    const service = new ScheduleCandidateService(repository);

    await assertRejectsWithCode(
      () =>
        service.deleteScheduleCandidate({
          eventId: 1n,
          candidateId: 999n,
          currentMemberId: 5n,
        }),
      "NOT_FOUND",
    );
    assert.deepEqual(repository.deletedCandidateIds, []);
  });

  it("returns not found when deleting candidate from another event", async () => {
    const repository = createRepository();
    await createExistingCandidate(repository, { eventId: 2n });
    const service = new ScheduleCandidateService(repository);

    await assertRejectsWithCode(
      () =>
        service.deleteScheduleCandidate({
          eventId: 1n,
          candidateId: 10n,
          currentMemberId: 5n,
        }),
      "NOT_FOUND",
    );
    assert.deepEqual(repository.deletedCandidateIds, []);
  });

  it("rejects confirmed candidate on delete as conflict", async () => {
    const repository = createRepository();
    await createExistingCandidate(repository, { status: "CONFIRMED" });
    const service = new ScheduleCandidateService(repository);

    await assert.rejects(
      () =>
        service.deleteScheduleCandidate({
          eventId: 1n,
          candidateId: 10n,
          currentMemberId: 5n,
        }),
      (error) =>
        error instanceof ApplicationError &&
        error.code === "CONFLICT" &&
        error.message === "確定済みの予定候補のため削除できません",
    );
    assert.deepEqual(repository.deletedCandidateIds, []);
  });

  it("rejects event confirmed candidate on delete as conflict", async () => {
    const repository = createRepository();
    await createExistingCandidate(repository);
    repository.events.set("1", { id: 1n, confirmedCandidateId: 10n });
    const service = new ScheduleCandidateService(repository);

    await assertRejectsWithCode(
      () =>
        service.deleteScheduleCandidate({
          eventId: 1n,
          candidateId: 10n,
          currentMemberId: 5n,
        }),
      "CONFLICT",
    );
    assert.deepEqual(repository.deletedCandidateIds, []);
  });
});

function createRepository() {
  const repository = new FakeScheduleCandidateRepository();
  repository.events.set("1", { id: 1n, confirmedCandidateId: null });
  repository.events.set("2", { id: 2n, confirmedCandidateId: null });
  repository.eventMembers.set("5", {
    id: 5n,
    eventId: 1n,
    userId: null,
    displayName: "たくや",
    role: "MEMBER",
  });
  repository.eventMembers.set("6", {
    id: 6n,
    eventId: 1n,
    userId: 1n,
    displayName: "ゆい",
    role: "MEMBER",
  });
  repository.eventMembers.set("7", {
    id: 7n,
    eventId: 2n,
    userId: null,
    displayName: "別イベント",
    role: "MEMBER",
  });
  repository.eventMembers.set("8", {
    id: 8n,
    eventId: 1n,
    userId: 2n,
    displayName: "owner",
    role: "OWNER",
  });

  return repository;
}

async function createExistingCandidate(
  repository: FakeScheduleCandidateRepository,
  options: {
    eventId?: bigint;
    createdByMemberId?: bigint;
    status?: ScheduleCandidateRecord["status"];
  } = {},
) {
  const candidate = await repository.createScheduleCandidate({
    eventId: options.eventId ?? 1n,
    createdByMemberId: options.createdByMemberId ?? 5n,
    title: "一蘭で昼ごはん",
    startsAt: new Date("2026-07-31T13:00:00+09:00"),
    endsAt: null,
    location: {
      name: "一蘭 梅田店",
      address: "大阪府大阪市北区...",
      googlePlaceId: null,
      latitude: null,
      longitude: null,
      googleMapsUrl: null,
    },
    description: null,
  });

  if (options.status !== undefined) {
    const updatedCandidate = { ...candidate, status: options.status };
    repository.candidates.set(key(candidate.id), updatedCandidate);
    return updatedCandidate;
  }

  return candidate;
}

function key(id: bigint) {
  return id.toString();
}

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
