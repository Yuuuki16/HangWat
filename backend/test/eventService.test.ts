import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  ApplicationError,
  type ApplicationErrorCode,
} from "../src/application/errors/applicationError.js";
import { EventService } from "../src/application/services/eventService.js";
import type {
  EventDetailRecord,
  EventMemberRecord,
  EventRepository,
} from "../src/domain/repositories/eventRepository.js";

class FakeEventRepository implements EventRepository {
  readonly eventMembers = new Map<string, EventMemberRecord>();
  readonly events = new Map<string, EventDetailRecord>();

  async findEventMemberById(eventMemberId: bigint) {
    return this.eventMembers.get(key(eventMemberId)) ?? null;
  }

  async findEventDetailById(eventId: bigint) {
    return this.events.get(key(eventId)) ?? null;
  }
}

describe("EventService", () => {
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

function createRepository() {
  const repository = new FakeEventRepository();
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
