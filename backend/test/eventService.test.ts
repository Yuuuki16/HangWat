import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  ApplicationError,
  type ApplicationErrorCode,
} from "../src/application/errors/applicationError.js";
import { EventService } from "../src/application/services/eventService.js";
import type {
  EventListRecord,
  EventRepository,
} from "../src/domain/repositories/eventRepository.js";

class FakeEventRepository implements EventRepository {
  readonly users = new Map<string, { id: bigint }>();
  readonly eventsByUserId = new Map<string, EventListRecord[]>();

  async findUserById(userId: bigint) {
    return this.users.get(String(userId)) ?? null;
  }

  async findEventsByUserId(userId: bigint) {
    return this.eventsByUserId.get(String(userId)) ?? [];
  }
}

const sampleEvent: EventListRecord = {
  id: 1n,
  title: "梅田で昼ごはん",
  eventDate: new Date("2026-07-31"),
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

function createRepository(): FakeEventRepository {
  const repo = new FakeEventRepository();
  repo.users.set("1", { id: 1n });
  repo.eventsByUserId.set("1", [sampleEvent]);
  return repo;
}

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

      await assert.rejects(
        () => service.listEvents({ userId: 999n }),
        (error: unknown) => {
          assert.ok(error instanceof ApplicationError);
          assert.equal(error.code satisfies ApplicationErrorCode, "UNAUTHORIZED");
          return true;
        },
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
});
