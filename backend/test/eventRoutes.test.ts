import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { serializeSigned } from "hono/utils/cookie";

import { ApplicationError } from "../src/application/errors/applicationError.js";
import type {
  EventCreatedDto,
  EventDetailDto,
  EventListItemDto,
  EventService,
  EventUpdatedDto,
} from "../src/application/services/eventService.js";
import { createEventRoutes } from "../src/presentation/routes/eventRoutes.js";

type EventRouteService = Pick<
  EventService,
  "listEvents" | "createEvent" | "getEventDetail" | "updateEvent" | "deleteEvent"
>;

const testSessionSecret = "test-secret";

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

const sampleUpdatedEvent: EventUpdatedDto = {
  event: {
    id: "1",
    title: "梅田で夜ごはん",
    date: "2026-08-01",
    location: null,
    description: null,
    updatedAt: "2026-07-31T10:30:00.000Z",
  },
};

const sampleCreatedEvent: EventCreatedDto = {
  event: {
    id: "100",
    title: "梅田で昼ごはん",
    date: "2026-07-31",
    location: null,
    description: null,
    inviteUrl: null,
    confirmedCandidateId: null,
    myMember: {
      id: "200",
      eventId: "100",
      userId: "1",
      displayName: "はせたく",
      role: "owner",
      memberType: "user",
      user: { id: "1", name: "はせたく", avatarUrl: null },
    },
    createdAt: "2026-07-31T01:00:00.000Z",
    updatedAt: "2026-07-31T01:00:00.000Z",
  },
};

function createRouteService(
  overrides: Partial<EventRouteService> = {},
): EventRouteService {
  return {
    async listEvents() {
      return { events: [sampleEvent] };
    },
    async createEvent() {
      return sampleCreatedEvent;
    },
    async getEventDetail() {
      return sampleEventDetail;
    },
    async updateEvent() {
      return sampleUpdatedEvent;
    },
    async deleteEvent() {
      return;
    },
    ...overrides,
  };
}

async function makeSessionCookie(userId: string) {
  return serializeSigned("session_token", userId, testSessionSecret);
}

describe("eventRoutes GET /events", () => {
  it("returns events", async () => {
    const app = createEventRoutes(createRouteService(), testSessionSecret);
    const response = await app.request("/events", {
      headers: { "x-user-id": "1" },
    });

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { events: [sampleEvent] });
  });

  it("returns 401 without x-user-id", async () => {
    const app = createEventRoutes(createRouteService(), testSessionSecret);
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
    const app = createEventRoutes(createRouteService(), testSessionSecret);
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
      testSessionSecret,
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
});

describe("eventRoutes POST /events", () => {
  it("creates event and returns 201", async () => {
    let receivedInput:
      | Parameters<EventRouteService["createEvent"]>[0]
      | undefined;
    const app = createEventRoutes(
      createRouteService({
        async createEvent(input) {
          receivedInput = input;
          return sampleCreatedEvent;
        },
      }),
      testSessionSecret,
    );

    const cookie = await makeSessionCookie("1");
    const response = await app.request("/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
      body: JSON.stringify({ title: "梅田で昼ごはん", date: "2026-07-31" }),
    });

    assert.equal(response.status, 201);
    assert.deepEqual(await response.json(), sampleCreatedEvent);
    assert.equal(receivedInput?.userId, 1n);
    assert.equal(receivedInput?.title, "梅田で昼ごはん");
    assert.equal(receivedInput?.date, "2026-07-31");
  });

  it("returns 401 without session cookie", async () => {
    const app = createEventRoutes(createRouteService(), testSessionSecret);
    const response = await app.request("/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "テスト" }),
    });

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), {
      error: { code: "UNAUTHORIZED", message: "認証が必要です" },
    });
  });

  it("returns 400 when title is missing", async () => {
    const app = createEventRoutes(createRouteService(), testSessionSecret);
    const cookie = await makeSessionCookie("1");
    const response = await app.request("/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
      body: JSON.stringify({}),
    });

    assert.equal(response.status, 400);
    const body = await response.json();
    assert.equal(body.error.code, "VALIDATION_ERROR");
    assert.ok(
      body.error.details.some(
        (d: { field: string }) => d.field === "title",
      ),
    );
  });

  it("returns 400 when date format is invalid", async () => {
    const app = createEventRoutes(createRouteService(), testSessionSecret);
    const cookie = await makeSessionCookie("1");
    const response = await app.request("/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
      body: JSON.stringify({ title: "テスト", date: "2026/07/31" }),
    });

    assert.equal(response.status, 400);
    const body = await response.json();
    assert.equal(body.error.code, "VALIDATION_ERROR");
    assert.ok(body.error.details.some((d: { field: string }) => d.field === "date"));
  });

  it("returns 400 when date is a nonexistent calendar date", async () => {
    const app = createEventRoutes(createRouteService(), testSessionSecret);
    const cookie = await makeSessionCookie("1");
    const response = await app.request("/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
      body: JSON.stringify({ title: "テスト", date: "2026-02-30" }),
    });

    assert.equal(response.status, 400);
    const body = await response.json();
    assert.equal(body.error.code, "VALIDATION_ERROR");
    assert.ok(body.error.details.some((d: { field: string }) => d.field === "date"));
  });

  it("maps service UNAUTHORIZED to 401", async () => {
    const app = createEventRoutes(
      createRouteService({
        async createEvent() {
          throw new ApplicationError("UNAUTHORIZED", "認証が必要です");
        },
      }),
      testSessionSecret,
    );

    const cookie = await makeSessionCookie("1");
    const response = await app.request("/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
      body: JSON.stringify({ title: "テスト" }),
    });

    assert.equal(response.status, 401);
  });
});

describe("eventRoutes PATCH /events/:eventId", () => {
  it("updates event and returns 200", async () => {
    let receivedInput:
      | Parameters<EventRouteService["updateEvent"]>[0]
      | undefined;
    const app = createEventRoutes(
      createRouteService({
        async updateEvent(input) {
          receivedInput = input;
          return sampleUpdatedEvent;
        },
      }),
      testSessionSecret,
    );

    const cookie = await makeSessionCookie("1");
    const response = await app.request("/events/1", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
      body: JSON.stringify({ title: "梅田で夜ごはん", date: "2026-08-01" }),
    });

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), sampleUpdatedEvent);
    assert.equal(receivedInput?.userId, 1n);
    assert.equal(receivedInput?.eventId, 1n);
    assert.equal(receivedInput?.title, "梅田で夜ごはん");
    assert.equal(receivedInput?.date, "2026-08-01");
  });

  it("returns 401 without session cookie", async () => {
    const app = createEventRoutes(createRouteService(), testSessionSecret);
    const response = await app.request("/events/1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "テスト" }),
    });

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), {
      error: { code: "UNAUTHORIZED", message: "認証が必要です" },
    });
  });

  it("returns 400 with invalid eventId", async () => {
    const app = createEventRoutes(createRouteService(), testSessionSecret);
    const cookie = await makeSessionCookie("1");
    const response = await app.request("/events/abc", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
      body: JSON.stringify({ title: "テスト" }),
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

  it("returns 400 when title is missing", async () => {
    const app = createEventRoutes(createRouteService(), testSessionSecret);
    const cookie = await makeSessionCookie("1");
    const response = await app.request("/events/1", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
      body: JSON.stringify({}),
    });

    assert.equal(response.status, 400);
    const body = await response.json();
    assert.equal(body.error.code, "VALIDATION_ERROR");
    assert.ok(
      body.error.details.some((d: { field: string }) => d.field === "title"),
    );
  });

  it("maps service FORBIDDEN to 403", async () => {
    const app = createEventRoutes(
      createRouteService({
        async updateEvent() {
          throw new ApplicationError("FORBIDDEN", "編集権限がありません");
        },
      }),
      testSessionSecret,
    );

    const cookie = await makeSessionCookie("1");
    const response = await app.request("/events/1", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
      body: JSON.stringify({ title: "テスト" }),
    });

    assert.equal(response.status, 403);
    assert.deepEqual(await response.json(), {
      error: { code: "FORBIDDEN", message: "編集権限がありません" },
    });
  });

  it("maps service NOT_FOUND to 404", async () => {
    const app = createEventRoutes(
      createRouteService({
        async updateEvent() {
          throw new ApplicationError("NOT_FOUND", "イベントが存在しません");
        },
      }),
      testSessionSecret,
    );

    const cookie = await makeSessionCookie("1");
    const response = await app.request("/events/1", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
      body: JSON.stringify({ title: "テスト" }),
    });

    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), {
      error: { code: "NOT_FOUND", message: "イベントが存在しません" },
    });
  });
});

describe("eventRoutes GET /events/:eventId", () => {
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
      testSessionSecret,
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
    const app = createEventRoutes(createRouteService(), testSessionSecret);
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
    const app = createEventRoutes(createRouteService(), testSessionSecret);
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
    const app = createEventRoutes(createRouteService(), testSessionSecret);
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
      testSessionSecret,
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

describe("eventRoutes DELETE /events/:eventId", () => {
  it("deletes event and returns 200", async () => {
    let receivedInput:
      | Parameters<EventRouteService["deleteEvent"]>[0]
      | undefined;
    const app = createEventRoutes(
      createRouteService({
        async deleteEvent(input) {
          receivedInput = input;
        },
      }),
      testSessionSecret,
    );

    const cookie = await makeSessionCookie("1");
    const response = await app.request("/events/1", {
      method: "DELETE",
      headers: { Cookie: cookie },
    });

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      message: "イベントを削除しました",
    });
    assert.equal(receivedInput?.userId, 1n);
    assert.equal(receivedInput?.eventId, 1n);
  });

  it("returns 401 without session cookie", async () => {
    const app = createEventRoutes(createRouteService(), testSessionSecret);
    const response = await app.request("/events/1", { method: "DELETE" });

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), {
      error: { code: "UNAUTHORIZED", message: "認証が必要です" },
    });
  });

  it("returns 400 with invalid event id", async () => {
    const app = createEventRoutes(createRouteService(), testSessionSecret);
    const cookie = await makeSessionCookie("1");
    const response = await app.request("/events/abc", {
      method: "DELETE",
      headers: { Cookie: cookie },
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

  it("maps service NOT_FOUND to 404", async () => {
    const app = createEventRoutes(
      createRouteService({
        async deleteEvent() {
          throw new ApplicationError("NOT_FOUND", "イベントが存在しません");
        },
      }),
      testSessionSecret,
    );

    const cookie = await makeSessionCookie("1");
    const response = await app.request("/events/999", {
      method: "DELETE",
      headers: { Cookie: cookie },
    });

    assert.equal(response.status, 404);
  });

  it("maps service FORBIDDEN to 403", async () => {
    const app = createEventRoutes(
      createRouteService({
        async deleteEvent() {
          throw new ApplicationError("FORBIDDEN", "削除権限がありません");
        },
      }),
      testSessionSecret,
    );

    const cookie = await makeSessionCookie("1");
    const response = await app.request("/events/1", {
      method: "DELETE",
      headers: { Cookie: cookie },
    });

    assert.equal(response.status, 403);
  });
});
