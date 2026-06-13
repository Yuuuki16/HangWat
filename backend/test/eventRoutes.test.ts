import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ApplicationError } from "../src/application/errors/applicationError.js";
import type {
  EventDetailDto,
  EventListItemDto,
  EventService,
} from "../src/application/services/eventService.js";
import { createEventRoutes } from "../src/presentation/routes/eventRoutes.js";

type EventRouteService = Pick<EventService, "listEvents" | "getEventDetail">;

const sampleEvent: EventListItemDto = {
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
};

const sampleEventDetail: EventDetailDto = {
  event: {
    id: "1",
    title: "梅田で昼ごはん",
    date: "2026-07-31",
    location: null,
    description: null,
    inviteUrl: null,
    createdBy: {
      id: "1",
      name: "はせたく",
      avatarUrl: null,
    },
    members: [],
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
    updatedAt: "2026-07-31T01:00:00.000Z",
  },
  candidates: [],
};

function createRouteService(
  overrides: Partial<EventRouteService> = {},
): EventRouteService {
  return {
    async listEvents() {
      return { events: [sampleEvent] };
    },
    async getEventDetail() {
      return sampleEventDetail;
    },
    ...overrides,
  };
}

describe("eventRoutes", () => {
  it("returns events", async () => {
    const app = createEventRoutes(createRouteService());
    const response = await app.request("/events", {
      headers: { "x-user-id": "1" },
    });

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { events: [sampleEvent] });
  });

  it("returns 401 without x-user-id", async () => {
    const app = createEventRoutes(createRouteService());
    const response = await app.request("/events");

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), {
      error: {
        code: "UNAUTHORIZED",
        message: "認証が必要です",
      },
    });
  });

  it("returns 401 with invalid x-user-id", async () => {
    const app = createEventRoutes(createRouteService());
    const response = await app.request("/events", {
      headers: { "x-user-id": "invalid" },
    });

    assert.equal(response.status, 401);
  });

  it("maps list service errors to common error response", async () => {
    const app = createEventRoutes(
      createRouteService({
        async listEvents() {
          throw new ApplicationError("UNAUTHORIZED", "認証が必要です");
        },
      }),
    );

    const response = await app.request("/events", {
      headers: { "x-user-id": "999" },
    });

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), {
      error: {
        code: "UNAUTHORIZED",
        message: "認証が必要です",
      },
    });
  });

  it("returns event detail", async () => {
    let receivedInput:
      | Parameters<EventRouteService["getEventDetail"]>[0]
      | undefined;
    const app = createEventRoutes(
      createRouteService({
        async getEventDetail(input) {
          receivedInput = input;
          return sampleEventDetail;
        },
      }),
    );

    const response = await app.request("/events/1", {
      headers: { "x-event-member-id": "5" },
    });

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), sampleEventDetail);
    assert.deepEqual(receivedInput, {
      eventId: 1n,
      currentMemberId: 5n,
    });
  });

  it("returns 401 without x-event-member-id", async () => {
    const app = createEventRoutes(createRouteService());
    const response = await app.request("/events/1");

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), {
      error: {
        code: "UNAUTHORIZED",
        message: "認証が必要です",
      },
    });
  });

  it("returns 400 with invalid event id", async () => {
    const app = createEventRoutes(createRouteService());
    const response = await app.request("/events/abc", {
      headers: { "x-event-member-id": "5" },
    });

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      error: {
        code: "VALIDATION_ERROR",
        message: "入力内容が正しくありません",
        details: [{ field: "eventId", message: "eventId が不正です" }],
      },
    });
  });

  it("returns 400 with out-of-range event id", async () => {
    const app = createEventRoutes(createRouteService());
    const response = await app.request("/events/9223372036854775808", {
      headers: { "x-event-member-id": "5" },
    });

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      error: {
        code: "VALIDATION_ERROR",
        message: "入力内容が正しくありません",
        details: [{ field: "eventId", message: "eventId が不正です" }],
      },
    });
  });

  it("maps detail service errors to common error response", async () => {
    const app = createEventRoutes(
      createRouteService({
        async getEventDetail() {
          throw new ApplicationError(
            "FORBIDDEN",
            "このイベントを参照する権限がありません",
          );
        },
      }),
    );

    const response = await app.request("/events/1", {
      headers: { "x-event-member-id": "5" },
    });

    assert.equal(response.status, 403);
    assert.deepEqual(await response.json(), {
      error: {
        code: "FORBIDDEN",
        message: "このイベントを参照する権限がありません",
      },
    });
  });
});
