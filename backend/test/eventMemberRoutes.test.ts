import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ApplicationError } from "../src/application/errors/applicationError.js";
import type {
  CurrentEventMemberDto,
  EventMemberDto,
  EventMemberService,
} from "../src/application/services/eventMemberService.js";
import { createEventMemberRoutes } from "../src/presentation/routes/eventMemberRoutes.js";

type EventMemberRouteService = Pick<
  EventMemberService,
  "listMembers" | "getMyMember"
>;

const sampleMember: EventMemberDto = {
  id: "5",
  eventId: "1",
  userId: "1",
  displayName: "はせたく",
  role: "owner",
  memberType: "user",
  user: { id: "1", name: "はせたく", avatarUrl: null },
};

const sampleGuestMember: EventMemberDto = {
  id: "6",
  eventId: "1",
  userId: null,
  displayName: "たくや",
  role: "member",
  memberType: "guest",
  user: null,
};

const sampleCurrentMember: CurrentEventMemberDto = {
  id: "6",
  eventId: "1",
  userId: null,
  displayName: "たくや",
  role: "member",
  memberType: "guest",
};

function createRouteService(
  overrides: Partial<EventMemberRouteService> = {},
): EventMemberRouteService {
  return {
    async listMembers() {
      return [sampleMember, sampleGuestMember];
    },
    async getMyMember() {
      return sampleCurrentMember;
    },
    ...overrides,
  };
}

function getMembers(
  app: ReturnType<typeof createEventMemberRoutes>,
  options: { eventId?: string; currentMemberId?: string } = {},
) {
  const headers: Record<string, string> = {};
  if (options.currentMemberId !== undefined) {
    headers["x-event-member-id"] = options.currentMemberId;
  }

  return app.request(`/events/${options.eventId ?? "1"}/members`, {
    method: "GET",
    headers,
  });
}

function getMyMember(
  app: ReturnType<typeof createEventMemberRoutes>,
  options: { eventId?: string; currentMemberId?: string } = {},
) {
  const headers: Record<string, string> = {};
  if (options.currentMemberId !== undefined) {
    headers["x-event-member-id"] = options.currentMemberId;
  }

  return app.request(`/events/${options.eventId ?? "1"}/me/member`, {
    method: "GET",
    headers,
  });
}

describe("eventMemberRoutes", () => {
  describe("GET /events/:eventId/members", () => {
    it("returns members", async () => {
      let receivedInput:
        | Parameters<EventMemberRouteService["listMembers"]>[0]
        | undefined;
      const app = createEventMemberRoutes(
        createRouteService({
          async listMembers(input) {
            receivedInput = input;
            return [sampleMember, sampleGuestMember];
          },
        }),
      );

      const response = await getMembers(app, { currentMemberId: "5" });

      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), {
        members: [sampleMember, sampleGuestMember],
      });
      assert.deepEqual(receivedInput, {
        eventId: 1n,
        currentMemberId: 5n,
      });
    });

    it("returns 401 without x-event-member-id", async () => {
      const app = createEventMemberRoutes(createRouteService());
      const response = await getMembers(app);

      assert.equal(response.status, 401);
      assert.deepEqual(await response.json(), {
        error: { code: "UNAUTHORIZED", message: "認証が必要です" },
      });
    });

    it("returns 400 with invalid eventId", async () => {
      const app = createEventMemberRoutes(createRouteService());
      const response = await getMembers(app, {
        eventId: "abc",
        currentMemberId: "5",
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

    it("maps forbidden error to 403", async () => {
      const app = createEventMemberRoutes(
        createRouteService({
          async listMembers() {
            throw new ApplicationError(
              "FORBIDDEN",
              "この操作を行う権限がありません",
            );
          },
        }),
      );

      const response = await getMembers(app, { currentMemberId: "5" });

      assert.equal(response.status, 403);
      assert.deepEqual(await response.json(), {
        error: {
          code: "FORBIDDEN",
          message: "この操作を行う権限がありません",
        },
      });
    });

    it("maps not found error to 404", async () => {
      const app = createEventMemberRoutes(
        createRouteService({
          async listMembers() {
            throw new ApplicationError("NOT_FOUND", "データが存在しません");
          },
        }),
      );

      const response = await getMembers(app, {
        eventId: "999",
        currentMemberId: "5",
      });

      assert.equal(response.status, 404);
      assert.deepEqual(await response.json(), {
        error: { code: "NOT_FOUND", message: "データが存在しません" },
      });
    });
  });

  describe("GET /events/:eventId/me/member", () => {
    it("returns current member", async () => {
      let receivedInput:
        | Parameters<EventMemberRouteService["getMyMember"]>[0]
        | undefined;
      const app = createEventMemberRoutes(
        createRouteService({
          async getMyMember(input) {
            receivedInput = input;
            return sampleCurrentMember;
          },
        }),
      );

      const response = await getMyMember(app, { currentMemberId: "6" });

      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), {
        eventMember: sampleCurrentMember,
      });
      assert.deepEqual(receivedInput, {
        eventId: 1n,
        currentMemberId: 6n,
      });
    });

    it("returns 401 without x-event-member-id", async () => {
      const app = createEventMemberRoutes(createRouteService());
      const response = await getMyMember(app);

      assert.equal(response.status, 401);
      assert.deepEqual(await response.json(), {
        error: { code: "UNAUTHORIZED", message: "認証が必要です" },
      });
    });

    it("returns 400 with invalid eventId", async () => {
      const app = createEventMemberRoutes(createRouteService());
      const response = await getMyMember(app, {
        eventId: "abc",
        currentMemberId: "6",
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

    it("maps forbidden error to 403", async () => {
      const app = createEventMemberRoutes(
        createRouteService({
          async getMyMember() {
            throw new ApplicationError(
              "FORBIDDEN",
              "この操作を行う権限がありません",
            );
          },
        }),
      );

      const response = await getMyMember(app, { currentMemberId: "6" });

      assert.equal(response.status, 403);
    });

    it("maps not found error to 404", async () => {
      const app = createEventMemberRoutes(
        createRouteService({
          async getMyMember() {
            throw new ApplicationError("NOT_FOUND", "データが存在しません");
          },
        }),
      );

      const response = await getMyMember(app, {
        eventId: "999",
        currentMemberId: "6",
      });

      assert.equal(response.status, 404);
    });
  });
});
