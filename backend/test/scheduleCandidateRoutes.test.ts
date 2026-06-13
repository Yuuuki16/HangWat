import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ApplicationError } from "../src/application/errors/applicationError.js";
import type {
  ScheduleCandidateDto,
  ScheduleCandidateService,
} from "../src/application/services/scheduleCandidateService.js";
import { createScheduleCandidateRoutes } from "../src/presentation/routes/scheduleCandidateRoutes.js";

type ScheduleCandidateRouteService = Pick<
  ScheduleCandidateService,
  "createScheduleCandidate"
>;

const sampleCandidate: ScheduleCandidateDto = {
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
};

function createRouteService(
  overrides: Partial<ScheduleCandidateRouteService> = {},
): ScheduleCandidateRouteService {
  return {
    async createScheduleCandidate() {
      return sampleCandidate;
    },
    ...overrides,
  };
}

describe("scheduleCandidateRoutes", () => {
  it("creates a schedule candidate with location", async () => {
    let receivedInput:
      | Parameters<ScheduleCandidateRouteService["createScheduleCandidate"]>[0]
      | undefined;
    const app = createScheduleCandidateRoutes(
      createRouteService({
        async createScheduleCandidate(input) {
          receivedInput = input;
          return sampleCandidate;
        },
      }),
    );

    const response = await app.request("/events/1/candidates", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-event-member-id": "5",
      },
      body: JSON.stringify({
        title: "  一蘭で昼ごはん  ",
        startAt: "2026-07-31T13:00:00+09:00",
        endAt: "2026-07-31T14:00:00+09:00",
        location: {
          name: "  一蘭 梅田店  ",
          address: "大阪府大阪市北区...",
          googlePlaceId: "ChIJyyyyyyyyyyyy",
          latitude: 34.701111,
          longitude: 135.500111,
          googleMapsUrl: "https://www.google.com/maps/place/...",
        },
        description: "  梅田の一蘭に行く案  ",
      }),
    });

    assert.equal(response.status, 201);
    assert.deepEqual(await response.json(), { candidate: sampleCandidate });
    assert.deepEqual(receivedInput, {
      eventId: 1n,
      currentMemberId: 5n,
      title: "一蘭で昼ごはん",
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
      description: "梅田の一蘭に行く案",
    });
  });

  it("creates a schedule candidate without optional fields", async () => {
    let receivedInput:
      | Parameters<ScheduleCandidateRouteService["createScheduleCandidate"]>[0]
      | undefined;
    const app = createScheduleCandidateRoutes(
      createRouteService({
        async createScheduleCandidate(input) {
          receivedInput = input;
          return {
            ...sampleCandidate,
            endAt: null,
            location: null,
            description: null,
          };
        },
      }),
    );

    const response = await app.request("/events/1/candidates", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-event-member-id": "5",
      },
      body: JSON.stringify({
        title: "駅前集合",
        startAt: "2026-07-31T13:00:00+09:00",
      }),
    });

    assert.equal(response.status, 201);
    assert.deepEqual(await response.json(), {
      candidate: {
        ...sampleCandidate,
        endAt: null,
        location: null,
        description: null,
      },
    });
    assert.deepEqual(receivedInput, {
      eventId: 1n,
      currentMemberId: 5n,
      title: "駅前集合",
      startAt: new Date("2026-07-31T13:00:00+09:00"),
      endAt: null,
      location: null,
      description: null,
    });
  });

  it("returns 401 without x-event-member-id", async () => {
    const app = createScheduleCandidateRoutes(createRouteService());
    const response = await app.request("/events/1/candidates", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: "一蘭で昼ごはん",
        startAt: "2026-07-31T13:00:00+09:00",
      }),
    });

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), {
      error: {
        code: "UNAUTHORIZED",
        message: "認証が必要です",
      },
    });
  });

  it("returns 400 with invalid event id", async () => {
    const app = createScheduleCandidateRoutes(createRouteService());
    const response = await app.request("/events/abc/candidates", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-event-member-id": "5",
      },
      body: JSON.stringify({
        title: "一蘭で昼ごはん",
        startAt: "2026-07-31T13:00:00+09:00",
      }),
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

  it("returns 400 with empty title", async () => {
    const app = createScheduleCandidateRoutes(createRouteService());
    const response = await app.request("/events/1/candidates", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-event-member-id": "5",
      },
      body: JSON.stringify({
        title: "   ",
        startAt: "2026-07-31T13:00:00+09:00",
      }),
    });

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      error: {
        code: "VALIDATION_ERROR",
        message: "入力内容が正しくありません",
        details: [{ field: "title", message: "タイトルは必須です" }],
      },
    });
  });

  it("returns 400 with invalid date", async () => {
    const app = createScheduleCandidateRoutes(createRouteService());
    const response = await app.request("/events/1/candidates", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-event-member-id": "5",
      },
      body: JSON.stringify({
        title: "一蘭で昼ごはん",
        startAt: "invalid-date",
      }),
    });

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      error: {
        code: "VALIDATION_ERROR",
        message: "入力内容が正しくありません",
        details: [{ field: "startAt", message: "startAt が不正です" }],
      },
    });
  });

  it("returns 400 with non ISO date string", async () => {
    const app = createScheduleCandidateRoutes(createRouteService());
    const response = await app.request("/events/1/candidates", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-event-member-id": "5",
      },
      body: JSON.stringify({
        title: "一蘭で昼ごはん",
        startAt: "2026-07-31",
      }),
    });

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      error: {
        code: "VALIDATION_ERROR",
        message: "入力内容が正しくありません",
        details: [{ field: "startAt", message: "startAt が不正です" }],
      },
    });
  });

  it("returns 400 when endAt is not after startAt", async () => {
    const app = createScheduleCandidateRoutes(createRouteService());
    const response = await app.request("/events/1/candidates", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-event-member-id": "5",
      },
      body: JSON.stringify({
        title: "一蘭で昼ごはん",
        startAt: "2026-07-31T13:00:00+09:00",
        endAt: "2026-07-31T13:00:00+09:00",
      }),
    });

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      error: {
        code: "VALIDATION_ERROR",
        message: "入力内容が正しくありません",
        details: [
          {
            field: "endAt",
            message: "終了日時は開始日時より後にしてください",
          },
        ],
      },
    });
  });

  it("maps forbidden error to common error response", async () => {
    const app = createScheduleCandidateRoutes(
      createRouteService({
        async createScheduleCandidate() {
          throw new ApplicationError(
            "FORBIDDEN",
            "この操作を行う権限がありません",
          );
        },
      }),
    );

    const response = await app.request("/events/1/candidates", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-event-member-id": "5",
      },
      body: JSON.stringify({
        title: "一蘭で昼ごはん",
        startAt: "2026-07-31T13:00:00+09:00",
      }),
    });

    assert.equal(response.status, 403);
    assert.deepEqual(await response.json(), {
      error: {
        code: "FORBIDDEN",
        message: "この操作を行う権限がありません",
      },
    });
  });

  it("maps not found error to common error response", async () => {
    const app = createScheduleCandidateRoutes(
      createRouteService({
        async createScheduleCandidate() {
          throw new ApplicationError("NOT_FOUND", "データが存在しません");
        },
      }),
    );

    const response = await app.request("/events/999/candidates", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-event-member-id": "5",
      },
      body: JSON.stringify({
        title: "一蘭で昼ごはん",
        startAt: "2026-07-31T13:00:00+09:00",
      }),
    });

    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), {
      error: {
        code: "NOT_FOUND",
        message: "データが存在しません",
      },
    });
  });
});
