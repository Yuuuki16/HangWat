import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  ApplicationError,
  type ApplicationErrorCode,
} from "../src/application/errors/applicationError.js";
import { EventService } from "../src/application/services/eventService.js";
import {
  EventUserNotFoundError,
} from "../src/domain/repositories/eventRepository.js";
import type {
  EventCreateInput,
  EventCreatedRecord,
  EventDetailRecord,
  EventListRecord,
  EventMemberRecord,
  EventRepository,
} from "../src/domain/repositories/eventRepository.js";

class FakeEventRepository implements EventRepository {
  readonly users = new Map<string, { id: bigint; name: string }>();
  readonly eventsByUserId = new Map<string, EventListRecord[]>();
  readonly eventMembers = new Map<string, EventMemberRecord>();
  readonly events = new Map<string, EventDetailRecord>();
  readonly createdEvents: EventCreatedRecord[] = [];

  async findUserById(userId: bigint) {
    return this.users.get(key(userId)) ?? null;
  }

  async findEventsByUserId(userId: bigint) {
    return this.eventsByUserId.get(key(userId)) ?? [];
  }


  async findEventMemberById(eventMemberId: bigint) {
    return this.eventMembers.get(key(eventMemberId)) ?? null;
  }

  async findEventDetailById(eventId: bigint) {
    return this.events.get(key(eventId)) ?? null;
  }

  async createEvent(input: EventCreateInput): Promise<EventCreatedRecord> {
    const user = this.users.get(key(input.userId));
    if (user === undefined) {
      throw new EventUserNotFoundError();
    }

    const eventId = BigInt(this.createdEvents.length + 100);
    const memberId = BigInt(this.createdEvents.length + 200);
    const now = new Date("2026-07-31T01:00:00.000Z");

    const myMember: EventMemberRecord = {
      id: memberId,
      eventId,
      userId: input.userId,
      displayName: user.name,
      role: "OWNER",
      user: { id: user.id, name: user.name, avatarUrl: null },
    };

    const record: EventCreatedRecord = {
      id: eventId,
      title: input.title,
      eventDate: input.eventDate,
      location: input.location,
      description: input.description,
      inviteUrl: null,
      confirmedCandidateId: null,
      myMember,
      createdAt: now,
      updatedAt: now,
    };

    this.createdEvents.push(record);
    return record;
  }
}

const sampleEvent: EventListRecord = {
  id: 1n,
  title: "梅田で昼ごはん",
  eventDate: new Date("2026-07-31T00:00:00.000Z"),
  location: {
    name: "大阪駅",
    address: "大阪府大阪市北区梅田3丁目1-1",
    googlePlaceId: "ChIJxxxxxxxxxxxx",
    latitude: 34.702485,
    longitude: 135.495951,
    googleMapsUrl: "https://www.google.com/maps/place/osaka",
  },
  memberCount: 2,
  confirmedCandidateId: null,
};

describe("EventService.createEvent", () => {
  it("creates event and returns dto", async () => {
    const repository = new FakeEventRepository();
    repository.users.set("1", { id: 1n, name: "はせたく" });
    const service = new EventService(repository);

    const result = await service.createEvent({
      userId: 1n,
      title: "梅田で昼ごはん",
      date: "2026-07-31",
      location: {
        name: "大阪駅",
        address: "大阪府大阪市北区梅田3丁目1-1",
        googlePlaceId: "ChIJxxxxxxxxxxxx",
        latitude: 34.702485,
        longitude: 135.495951,
        googleMapsUrl: "https://www.google.com/maps/place/osaka",
      },
      description: "昼ごはん候補を決める",
    });

    assert.equal(result.event.title, "梅田で昼ごはん");
    assert.equal(result.event.date, "2026-07-31");
    assert.equal(result.event.description, "昼ごはん候補を決める");
    assert.equal(result.event.inviteUrl, null);
    assert.equal(result.event.confirmedCandidateId, null);
    assert.equal(result.event.myMember.role, "owner");
    assert.equal(result.event.myMember.displayName, "はせたく");
    assert.equal(result.event.myMember.userId, "1");
    assert.deepEqual(result.event.location, {
      name: "大阪駅",
      address: "大阪府大阪市北区梅田3丁目1-1",
      googlePlaceId: "ChIJxxxxxxxxxxxx",
      latitude: 34.702485,
      longitude: 135.495951,
      googleMapsUrl: "https://www.google.com/maps/place/osaka",
    });
  });

  it("creates event with optional fields omitted", async () => {
    const repository = new FakeEventRepository();
    repository.users.set("1", { id: 1n, name: "はせたく" });
    const service = new EventService(repository);

    const result = await service.createEvent({
      userId: 1n,
      title: "ミーティング",
      date: null,
      location: null,
      description: null,
    });

    assert.equal(result.event.title, "ミーティング");
    assert.equal(result.event.date, null);
    assert.equal(result.event.location, null);
    assert.equal(result.event.description, null);
  });

  it("rejects unknown user as unauthorized", async () => {
    const repository = new FakeEventRepository();
    const service = new EventService(repository);

    await assertRejectsWithCode(
      () =>
        service.createEvent({
          userId: 999n,
          title: "テスト",
          date: null,
          location: null,
          description: null,
        }),
      "UNAUTHORIZED",
    );
  });
});

describe("EventService", () => {
  describe("listEvents", () => {
    it("ログインユーザーのイベント一覧を返す", async () => {
      const repo = createRepository();
      const service = new EventService(repo);

      const result = await service.listEvents({ userId: 1n });

      assert.deepEqual(result, {
        events: [
          {
            id: "1",
            title: "梅田で昼ごはん",
            date: "2026-07-31",
            location: {
              name: "大阪駅",
              address: "大阪府大阪市北区梅田3丁目1-1",
              googlePlaceId: "ChIJxxxxxxxxxxxx",
              latitude: 34.702485,
              longitude: 135.495951,
              googleMapsUrl: "https://www.google.com/maps/place/osaka",
            },
            memberCount: 2,
            isConfirmed: false,
          },
        ],
      });
    });

    it("予定確定済みイベントは isConfirmed: true を返す", async () => {
      const repo = createRepository();
      repo.eventsByUserId.set("1", [
        { ...sampleEvent, confirmedCandidateId: 10n },
      ]);
      const service = new EventService(repo);

      const result = await service.listEvents({ userId: 1n });

      assert.equal(result.events[0].isConfirmed, true);
    });

    it("eventDate が null の場合 date: null を返す", async () => {
      const repo = createRepository();
      repo.eventsByUserId.set("1", [{ ...sampleEvent, eventDate: null }]);
      const service = new EventService(repo);

      const result = await service.listEvents({ userId: 1n });

      assert.equal(result.events[0].date, null);
    });

    it("location が null の場合 location: null を返す", async () => {
      const repo = createRepository();
      repo.eventsByUserId.set("1", [{ ...sampleEvent, location: null }]);
      const service = new EventService(repo);

      const result = await service.listEvents({ userId: 1n });

      assert.equal(result.events[0].location, null);
    });

    it("ユーザーが存在しない場合 UNAUTHORIZED を投げる", async () => {
      const repo = createRepository();
      const service = new EventService(repo);

      await assertRejectsWithCode(
        () => service.listEvents({ userId: 999n }),
        "UNAUTHORIZED",
      );
    });

    it("イベントが0件の場合は空配列を返す", async () => {
      const repo = createRepository();
      repo.eventsByUserId.set("1", []);
      const service = new EventService(repo);

      const result = await service.listEvents({ userId: 1n });

      assert.deepEqual(result, { events: [] });
    });
  });

  describe("getEventDetail", () => {
    it("returns event detail with candidates", async () => {
      const repository = createRepository();
      const service = new EventService(repository);

      const result = await service.getEventDetail({
        eventId: 1n,
        currentMemberId: 5n,
      });

      assert.deepEqual(result, {
        event: {
          id: "1",
          title: "梅田で昼ごはん",
          date: "2026-07-31",
          location: {
            name: "大阪駅",
            address: "大阪府大阪市北区梅田3丁目1-1",
            googlePlaceId: "ChIJxxxxxxxxxxxx",
            latitude: 34.702485,
            longitude: 135.495951,
            googleMapsUrl: "https://www.google.com/maps/place/osaka",
          },
          description: "昼ごはん候補を決める",
          inviteUrl: "http://localhost:3000/invite/abc123",
          createdBy: {
            id: "1",
            name: "はせたく",
            avatarUrl: null,
          },
          members: [
            {
              id: "5",
              eventId: "1",
              userId: null,
              displayName: "たくや",
              role: "member",
              memberType: "guest",
              user: null,
            },
            {
              id: "6",
              eventId: "1",
              userId: "1",
              displayName: "はせたく",
              role: "owner",
              memberType: "user",
              user: {
                id: "1",
                name: "はせたく",
                avatarUrl: null,
              },
            },
          ],
          myMember: {
            id: "5",
            eventId: "1",
            userId: null,
            displayName: "たくや",
            role: "member",
            memberType: "guest",
            user: null,
          },
          confirmedCandidateId: null,
          createdAt: "2026-07-31T01:00:00.000Z",
          updatedAt: "2026-07-31T01:05:00.000Z",
        },
        candidates: [
          {
            id: "10",
            eventId: "1",
            title: "一蘭で昼ごはん",
            startAt: "2026-07-31T04:00:00.000Z",
            endAt: "2026-07-31T05:00:00.000Z",
            location: null,
            description: null,
            status: "pending",
            createdByMember: {
              id: "5",
              eventId: "1",
              userId: null,
              displayName: "たくや",
              role: "member",
              memberType: "guest",
              user: null,
            },
            commentCount: 3,
            likeCount: 0,
            createdAt: "2026-07-31T01:10:00.000Z",
            updatedAt: "2026-07-31T01:10:00.000Z",
          },
        ],
      });
    });

    it("rejects unknown current event member as unauthorized", async () => {
      const repository = createRepository();
      const service = new EventService(repository);

      await assertRejectsWithCode(
        () =>
          service.getEventDetail({
            eventId: 1n,
            currentMemberId: 999n,
          }),
        "UNAUTHORIZED",
      );
    });

    it("returns not found when event does not exist", async () => {
      const repository = createRepository();
      const service = new EventService(repository);

      await assertRejectsWithCode(
        () =>
          service.getEventDetail({
            eventId: 999n,
            currentMemberId: 5n,
          }),
        "NOT_FOUND",
      );
    });

    it("rejects non participant as forbidden", async () => {
      const repository = createRepository();
      const service = new EventService(repository);

      await assertRejectsWithCode(
        () =>
          service.getEventDetail({
            eventId: 1n,
            currentMemberId: 7n,
          }),
        "FORBIDDEN",
      );
    });
  });
});

function createRepository(): FakeEventRepository {
  const repository = new FakeEventRepository();
  repository.users.set("1", { id: 1n, name: "はせたく" });

  const guestMember: EventMemberRecord = {
    id: 5n,
    eventId: 1n,
    userId: null,
    displayName: "たくや",
    role: "MEMBER",
    user: null,
  };
  const ownerMember: EventMemberRecord = {
    id: 6n,
    eventId: 1n,
    userId: 1n,
    displayName: "はせたく",
    role: "OWNER",
    user: {
      id: 1n,
      name: "はせたく",
      avatarUrl: null,
    },
  };

  repository.users.set("1", { id: 1n });
  repository.eventsByUserId.set("1", [sampleEvent]);
  repository.eventMembers.set("5", guestMember);
  repository.eventMembers.set("6", ownerMember);
  repository.eventMembers.set("7", {
    id: 7n,
    eventId: 2n,
    userId: null,
    displayName: "別イベント",
    role: "MEMBER",
    user: null,
  });
  repository.events.set("1", {
    id: 1n,
    title: "梅田で昼ごはん",
    eventDate: new Date("2026-07-31T00:00:00.000Z"),
    location: {
      name: "大阪駅",
      address: "大阪府大阪市北区梅田3丁目1-1",
      googlePlaceId: "ChIJxxxxxxxxxxxx",
      latitude: 34.702485,
      longitude: 135.495951,
      googleMapsUrl: "https://www.google.com/maps/place/osaka",
    },
    description: "昼ごはん候補を決める",
    inviteUrl: "http://localhost:3000/invite/abc123",
    createdBy: {
      id: 1n,
      name: "はせたく",
      avatarUrl: null,
    },
    members: [guestMember, ownerMember],
    confirmedCandidateId: null,
    candidates: [
      {
        id: 10n,
        eventId: 1n,
        title: "一蘭で昼ごはん",
        startsAt: new Date("2026-07-31T04:00:00.000Z"),
        endsAt: new Date("2026-07-31T05:00:00.000Z"),
        location: null,
        description: null,
        status: "PROPOSED",
        createdByMember: guestMember,
        commentCount: 3,
        likeCount: 0,
        createdAt: new Date("2026-07-31T01:10:00.000Z"),
        updatedAt: new Date("2026-07-31T01:10:00.000Z"),
      },
    ],
    createdAt: new Date("2026-07-31T01:00:00.000Z"),
    updatedAt: new Date("2026-07-31T01:05:00.000Z"),
  });

  return repository;
}

function key(id: bigint) {
  return id.toString();
}

async function assertRejectsWithCode(
  action: () => Promise<unknown>,
  code: ApplicationErrorCode,
) {
  await assert.rejects(action, (error: unknown) => {
    assert.ok(error instanceof ApplicationError);
    assert.equal(error.code, code);
    return true;
  });
}
