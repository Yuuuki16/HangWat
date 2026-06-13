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
  | "createScheduleCandidate"
  | "updateScheduleCandidate"
  | "deleteScheduleCandidate"
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
    async updateScheduleCandidate() {
      return sampleCandidate;
    },
    async deleteScheduleCandidate() {},
    ...overrides,
  };
}

function postCandidate(
  app: ReturnType<typeof createScheduleCandidateRoutes>,
  options: {
    eventId?: string;
    currentMemberId?: string;
    body?: unknown;
  } = {},
) {
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (options.currentMemberId !== undefined) {
    headers["x-event-member-id"] = options.currentMemberId;
  }

  return app.request(`/events/${options.eventId ?? "1"}/candidates`, {
    method: "POST",
    headers,
    body: JSON.stringify(
      options.body ?? {
        title: "一蘭で昼ごはん",
        startAt: "2026-07-31T13:00:00+09:00",
      },
    ),
  });
}

function patchCandidate(
  app: ReturnType<typeof createScheduleCandidateRoutes>,
  options: {
    eventId?: string;
    candidateId?: string;
    currentMemberId?: string;
    body?: unknown;
  } = {},
) {
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (options.currentMemberId !== undefined) {
    headers["x-event-member-id"] = options.currentMemberId;
  }

  return app.request(
    `/events/${options.eventId ?? "1"}/candidates/${options.candidateId ?? "10"}`,
    {
      method: "PATCH",
      headers,
      body: JSON.stringify(
        options.body ?? {
          title: "一蘭で昼ごはん",
          startAt: "2026-07-31T13:30:00+09:00",
          endAt: "2026-07-31T14:30:00+09:00",
          location: null,
          description: "開始時間を変更",
        },
      ),
    },
  );
}

function deleteCandidate(
  app: ReturnType<typeof createScheduleCandidateRoutes>,
  options: {
    eventId?: string;
    candidateId?: string;
    currentMemberId?: string;
  } = {},
) {
  const headers: Record<string, string> = {};
  if (options.currentMemberId !== undefined) {
    headers["x-event-member-id"] = options.currentMemberId;
  }

  return app.request(
    `/events/${options.eventId ?? "1"}/candidates/${options.candidateId ?? "10"}`,
    {
      method: "DELETE",
      headers,
    },
  );
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

    const response = await postCandidate(app, {
      currentMemberId: "5",
      body: {
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
      },
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

    const response = await postCandidate(app, {
      currentMemberId: "5",
      body: {
        title: "駅前集合",
        startAt: "2026-07-31T13:00:00+09:00",
      },
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
    const response = await postCandidate(app);

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), {
      error: {
        code: "UNAUTHORIZED",
        message: "認証が必要です",
      },
    });
  });

  const validationCases: {
    name: string;
    request: Parameters<typeof postCandidate>[1];
    details: { field: string; message: string }[];
  }[] = [
    {
      name: "invalid event id",
      request: { eventId: "abc", currentMemberId: "5" },
      details: [{ field: "eventId", message: "eventId が不正です" }],
    },
    {
      name: "empty title",
      request: {
        currentMemberId: "5",
        body: {
          title: "   ",
          startAt: "2026-07-31T13:00:00+09:00",
        },
      },
      details: [{ field: "title", message: "タイトルは必須です" }],
    },
    {
      name: "invalid date",
      request: {
        currentMemberId: "5",
        body: {
          title: "一蘭で昼ごはん",
          startAt: "invalid-date",
        },
      },
      details: [{ field: "startAt", message: "startAt が不正です" }],
    },
    {
      name: "non ISO date string",
      request: {
        currentMemberId: "5",
        body: {
          title: "一蘭で昼ごはん",
          startAt: "2026-07-31",
        },
      },
      details: [{ field: "startAt", message: "startAt が不正です" }],
    },
    {
      name: "endAt is not after startAt",
      request: {
        currentMemberId: "5",
        body: {
          title: "一蘭で昼ごはん",
          startAt: "2026-07-31T13:00:00+09:00",
          endAt: "2026-07-31T13:00:00+09:00",
        },
      },
      details: [
        {
          field: "endAt",
          message: "終了日時は開始日時より後にしてください",
        },
      ],
    },
  ];

  for (const validationCase of validationCases) {
    it(`returns 400 with ${validationCase.name}`, async () => {
      const app = createScheduleCandidateRoutes(createRouteService());
      const response = await postCandidate(app, validationCase.request);

      assert.equal(response.status, 400);
      assert.deepEqual(await response.json(), {
        error: {
          code: "VALIDATION_ERROR",
          message: "入力内容が正しくありません",
          details: validationCase.details,
        },
      });
    });
  }

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

    const response = await postCandidate(app, { currentMemberId: "5" });

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

    const response = await postCandidate(app, {
      eventId: "999",
      currentMemberId: "5",
    });

    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), {
      error: {
        code: "NOT_FOUND",
        message: "データが存在しません",
      },
    });
  });

  it("updates a schedule candidate with location", async () => {
    let receivedInput:
      | Parameters<ScheduleCandidateRouteService["updateScheduleCandidate"]>[0]
      | undefined;
    const updatedCandidate = {
      ...sampleCandidate,
      startAt: "2026-07-31T04:30:00.000Z",
      endAt: "2026-07-31T05:30:00.000Z",
      description: "開始時間を変更",
    };
    const app = createScheduleCandidateRoutes(
      createRouteService({
        async updateScheduleCandidate(input) {
          receivedInput = input;
          return updatedCandidate;
        },
      }),
    );

    const response = await patchCandidate(app, {
      currentMemberId: "5",
      body: {
        title: "  一蘭で昼ごはん  ",
        startAt: "2026-07-31T13:30:00+09:00",
        endAt: "2026-07-31T14:30:00+09:00",
        location: {
          name: "  一蘭 梅田店  ",
          address: "大阪府大阪市北区...",
          googlePlaceId: "ChIJyyyyyyyyyyyy",
          latitude: 34.701111,
          longitude: 135.500111,
          googleMapsUrl: "https://www.google.com/maps/place/...",
        },
        description: "  開始時間を変更  ",
      },
    });

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { candidate: updatedCandidate });
    assert.deepEqual(receivedInput, {
      eventId: 1n,
      candidateId: 10n,
      currentMemberId: 5n,
      title: "一蘭で昼ごはん",
      startAt: new Date("2026-07-31T13:30:00+09:00"),
      endAt: new Date("2026-07-31T14:30:00+09:00"),
      location: {
        name: "一蘭 梅田店",
        address: "大阪府大阪市北区...",
        googlePlaceId: "ChIJyyyyyyyyyyyy",
        latitude: 34.701111,
        longitude: 135.500111,
        googleMapsUrl: "https://www.google.com/maps/place/...",
      },
      description: "開始時間を変更",
    });
  });

  it("updates a schedule candidate with null location", async () => {
    let receivedInput:
      | Parameters<ScheduleCandidateRouteService["updateScheduleCandidate"]>[0]
      | undefined;
    const app = createScheduleCandidateRoutes(
      createRouteService({
        async updateScheduleCandidate(input) {
          receivedInput = input;
          return { ...sampleCandidate, location: null };
        },
      }),
    );

    const response = await patchCandidate(app, {
      currentMemberId: "5",
      body: {
        title: "駅前集合",
        startAt: "2026-07-31T13:30:00+09:00",
        endAt: null,
        location: null,
        description: null,
      },
    });

    assert.equal(response.status, 200);
    assert.deepEqual(receivedInput, {
      eventId: 1n,
      candidateId: 10n,
      currentMemberId: 5n,
      title: "駅前集合",
      startAt: new Date("2026-07-31T13:30:00+09:00"),
      endAt: null,
      location: null,
      description: null,
    });
  });

  it("updates a schedule candidate with omitted location as null", async () => {
    let receivedInput:
      | Parameters<ScheduleCandidateRouteService["updateScheduleCandidate"]>[0]
      | undefined;
    const app = createScheduleCandidateRoutes(
      createRouteService({
        async updateScheduleCandidate(input) {
          receivedInput = input;
          return { ...sampleCandidate, location: null };
        },
      }),
    );

    const response = await patchCandidate(app, {
      currentMemberId: "5",
      body: {
        title: "駅前集合",
        startAt: "2026-07-31T13:30:00+09:00",
      },
    });

    assert.equal(response.status, 200);
    assert.equal(receivedInput?.location, null);
  });

  it("returns 401 on update without x-event-member-id", async () => {
    const app = createScheduleCandidateRoutes(createRouteService());
    const response = await patchCandidate(app);

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), {
      error: {
        code: "UNAUTHORIZED",
        message: "認証が必要です",
      },
    });
  });

  const updateValidationCases: {
    name: string;
    request: Parameters<typeof patchCandidate>[1];
    details: { field: string; message: string }[];
  }[] = [
    {
      name: "invalid event id",
      request: { eventId: "abc", candidateId: "10", currentMemberId: "5" },
      details: [{ field: "eventId", message: "eventId が不正です" }],
    },
    {
      name: "invalid candidate id",
      request: { eventId: "1", candidateId: "abc", currentMemberId: "5" },
      details: [{ field: "candidateId", message: "candidateId が不正です" }],
    },
    {
      name: "empty title",
      request: {
        currentMemberId: "5",
        body: {
          title: "   ",
          startAt: "2026-07-31T13:30:00+09:00",
        },
      },
      details: [{ field: "title", message: "タイトルは必須です" }],
    },
    {
      name: "invalid date",
      request: {
        currentMemberId: "5",
        body: {
          title: "一蘭で昼ごはん",
          startAt: "invalid-date",
        },
      },
      details: [{ field: "startAt", message: "startAt が不正です" }],
    },
    {
      name: "endAt is not after startAt",
      request: {
        currentMemberId: "5",
        body: {
          title: "一蘭で昼ごはん",
          startAt: "2026-07-31T13:30:00+09:00",
          endAt: "2026-07-31T13:30:00+09:00",
        },
      },
      details: [
        {
          field: "endAt",
          message: "終了日時は開始日時より後にしてください",
        },
      ],
    },
  ];

  for (const validationCase of updateValidationCases) {
    it(`returns 400 on update with ${validationCase.name}`, async () => {
      const app = createScheduleCandidateRoutes(createRouteService());
      const response = await patchCandidate(app, validationCase.request);

      assert.equal(response.status, 400);
      assert.deepEqual(await response.json(), {
        error: {
          code: "VALIDATION_ERROR",
          message: "入力内容が正しくありません",
          details: validationCase.details,
        },
      });
    });
  }

  it("maps update forbidden error to common error response", async () => {
    const app = createScheduleCandidateRoutes(
      createRouteService({
        async updateScheduleCandidate() {
          throw new ApplicationError(
            "FORBIDDEN",
            "この操作を行う権限がありません",
          );
        },
      }),
    );

    const response = await patchCandidate(app, { currentMemberId: "5" });

    assert.equal(response.status, 403);
    assert.deepEqual(await response.json(), {
      error: {
        code: "FORBIDDEN",
        message: "この操作を行う権限がありません",
      },
    });
  });

  it("maps update not found error to common error response", async () => {
    const app = createScheduleCandidateRoutes(
      createRouteService({
        async updateScheduleCandidate() {
          throw new ApplicationError("NOT_FOUND", "データが存在しません");
        },
      }),
    );

    const response = await patchCandidate(app, {
      candidateId: "999",
      currentMemberId: "5",
    });

    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), {
      error: {
        code: "NOT_FOUND",
        message: "データが存在しません",
      },
    });
  });

  it("deletes a schedule candidate by creator", async () => {
    let receivedInput:
      | Parameters<ScheduleCandidateRouteService["deleteScheduleCandidate"]>[0]
      | undefined;
    const app = createScheduleCandidateRoutes(
      createRouteService({
        async deleteScheduleCandidate(input) {
          receivedInput = input;
        },
      }),
    );

    const response = await deleteCandidate(app, { currentMemberId: "5" });

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      message: "予定候補を削除しました",
    });
    assert.deepEqual(receivedInput, {
      eventId: 1n,
      candidateId: 10n,
      currentMemberId: 5n,
    });
  });

  it("deletes a schedule candidate by owner", async () => {
    let receivedInput:
      | Parameters<ScheduleCandidateRouteService["deleteScheduleCandidate"]>[0]
      | undefined;
    const app = createScheduleCandidateRoutes(
      createRouteService({
        async deleteScheduleCandidate(input) {
          receivedInput = input;
        },
      }),
    );

    const response = await deleteCandidate(app, { currentMemberId: "8" });

    assert.equal(response.status, 200);
    assert.deepEqual(receivedInput, {
      eventId: 1n,
      candidateId: 10n,
      currentMemberId: 8n,
    });
  });

  it("returns 401 on delete without x-event-member-id", async () => {
    const app = createScheduleCandidateRoutes(createRouteService());
    const response = await deleteCandidate(app);

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), {
      error: {
        code: "UNAUTHORIZED",
        message: "認証が必要です",
      },
    });
  });

  const deleteValidationCases: {
    name: string;
    request: Parameters<typeof deleteCandidate>[1];
    details: { field: string; message: string }[];
  }[] = [
    {
      name: "invalid event id",
      request: { eventId: "abc", candidateId: "10", currentMemberId: "5" },
      details: [{ field: "eventId", message: "eventId が不正です" }],
    },
    {
      name: "invalid candidate id",
      request: { eventId: "1", candidateId: "abc", currentMemberId: "5" },
      details: [{ field: "candidateId", message: "candidateId が不正です" }],
    },
  ];

  for (const validationCase of deleteValidationCases) {
    it(`returns 400 on delete with ${validationCase.name}`, async () => {
      const app = createScheduleCandidateRoutes(createRouteService());
      const response = await deleteCandidate(app, validationCase.request);

      assert.equal(response.status, 400);
      assert.deepEqual(await response.json(), {
        error: {
          code: "VALIDATION_ERROR",
          message: "入力内容が正しくありません",
          details: validationCase.details,
        },
      });
    });
  }

  it("maps delete forbidden error to common error response", async () => {
    const app = createScheduleCandidateRoutes(
      createRouteService({
        async deleteScheduleCandidate() {
          throw new ApplicationError(
            "FORBIDDEN",
            "この操作を行う権限がありません",
          );
        },
      }),
    );

    const response = await deleteCandidate(app, { currentMemberId: "5" });

    assert.equal(response.status, 403);
    assert.deepEqual(await response.json(), {
      error: {
        code: "FORBIDDEN",
        message: "この操作を行う権限がありません",
      },
    });
  });

  it("maps delete not found error to common error response", async () => {
    const app = createScheduleCandidateRoutes(
      createRouteService({
        async deleteScheduleCandidate() {
          throw new ApplicationError("NOT_FOUND", "データが存在しません");
        },
      }),
    );

    const response = await deleteCandidate(app, {
      candidateId: "999",
      currentMemberId: "5",
    });

    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), {
      error: {
        code: "NOT_FOUND",
        message: "データが存在しません",
      },
    });
  });

  it("maps delete conflict error to common error response", async () => {
    const app = createScheduleCandidateRoutes(
      createRouteService({
        async deleteScheduleCandidate() {
          throw new ApplicationError(
            "CONFLICT",
            "確定済みの予定候補のため削除できません",
          );
        },
      }),
    );

    const response = await deleteCandidate(app, { currentMemberId: "5" });

    assert.equal(response.status, 409);
    assert.deepEqual(await response.json(), {
      error: {
        code: "CONFLICT",
        message: "確定済みの予定候補のため削除できません",
      },
    });
  });
});
