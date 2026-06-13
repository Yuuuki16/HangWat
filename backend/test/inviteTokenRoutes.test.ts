import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ApplicationError } from "../src/application/errors/applicationError.js";
import type {
  InviteTokenDto,
  InviteTokenService,
} from "../src/application/services/inviteTokenService.js";
import { createInviteTokenRoutes } from "../src/presentation/routes/inviteTokenRoutes.js";

type RouteService = Pick<
  InviteTokenService,
  "createInviteToken" | "revokeInviteToken"
>;

const sampleToken: InviteTokenDto = {
  id: "1",
  eventId: "1",
  inviteToken: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  url: "http://localhost:3000/invite/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  expiresAt: "2026-08-01T00:00:00.000Z",
  revokedAt: null,
  createdAt: "2026-07-31T10:00:00.000Z",
};

function createRouteService(overrides: Partial<RouteService> = {}): RouteService {
  return {
    async createInviteToken() {
      return { inviteToken: sampleToken };
    },
    async revokeInviteToken() {},
    ...overrides,
  };
}

function postInviteToken(
  app: ReturnType<typeof createInviteTokenRoutes>,
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

  return app.request(`/events/${options.eventId ?? "1"}/invite-tokens`, {
    method: "POST",
    headers,
    body: JSON.stringify(
      options.body ?? { expiresAt: "2026-08-01T00:00:00+09:00" },
    ),
  });
}

function deleteInviteToken(
  app: ReturnType<typeof createInviteTokenRoutes>,
  options: {
    eventId?: string;
    tokenId?: string;
    currentMemberId?: string;
  } = {},
) {
  const headers: Record<string, string> = {};
  if (options.currentMemberId !== undefined) {
    headers["x-event-member-id"] = options.currentMemberId;
  }

  return app.request(
    `/events/${options.eventId ?? "1"}/invite-tokens/${options.tokenId ?? "1"}`,
    { method: "DELETE", headers },
  );
}

describe("inviteTokenRoutes", () => {
  describe("POST /events/:eventId/invite-tokens", () => {
    it("creates invite token and returns 201", async () => {
      let receivedInput:
        | Parameters<RouteService["createInviteToken"]>[0]
        | undefined;
      const app = createInviteTokenRoutes(
        createRouteService({
          async createInviteToken(input) {
            receivedInput = input;
            return { inviteToken: sampleToken };
          },
        }),
      );

      const response = await postInviteToken(app, { currentMemberId: "5" });

      assert.equal(response.status, 201);
      assert.deepEqual(await response.json(), { inviteToken: sampleToken });
      assert.equal(receivedInput?.eventId, 1n);
      assert.equal(receivedInput?.currentMemberId, 5n);
      assert.ok(receivedInput?.expiresAt instanceof Date);
    });

    it("returns 401 without x-event-member-id", async () => {
      const app = createInviteTokenRoutes(createRouteService());
      const response = await postInviteToken(app);

      assert.equal(response.status, 401);
      assert.deepEqual(await response.json(), {
        error: { code: "UNAUTHORIZED", message: "認証が必要です" },
      });
    });

    it("returns 400 with invalid eventId", async () => {
      const app = createInviteTokenRoutes(createRouteService());
      const response = await postInviteToken(app, {
        eventId: "abc",
        currentMemberId: "5",
      });

      assert.equal(response.status, 400);
      const body = await response.json() as { error: { details: { field: string }[] } };
      assert.equal(body.error.details[0].field, "eventId");
    });

    it("returns 400 when expiresAt is missing", async () => {
      const app = createInviteTokenRoutes(createRouteService());
      const response = await postInviteToken(app, {
        currentMemberId: "5",
        body: {},
      });

      assert.equal(response.status, 400);
      const body = await response.json() as { error: { details: { field: string }[] } };
      assert.equal(body.error.details[0].field, "expiresAt");
    });

    it("returns 400 when expiresAt is invalid date", async () => {
      const app = createInviteTokenRoutes(createRouteService());
      const response = await postInviteToken(app, {
        currentMemberId: "5",
        body: { expiresAt: "not-a-date" },
      });

      assert.equal(response.status, 400);
      const body = await response.json() as { error: { details: { field: string }[] } };
      assert.equal(body.error.details[0].field, "expiresAt");
    });

    it("maps forbidden error to 403", async () => {
      const app = createInviteTokenRoutes(
        createRouteService({
          async createInviteToken() {
            throw new ApplicationError("FORBIDDEN", "招待URLを発行する権限がありません");
          },
        }),
      );

      const response = await postInviteToken(app, { currentMemberId: "6" });

      assert.equal(response.status, 403);
      assert.deepEqual(await response.json(), {
        error: { code: "FORBIDDEN", message: "招待URLを発行する権限がありません" },
      });
    });

    it("maps not found error to 404", async () => {
      const app = createInviteTokenRoutes(
        createRouteService({
          async createInviteToken() {
            throw new ApplicationError("NOT_FOUND", "イベントが存在しません");
          },
        }),
      );

      const response = await postInviteToken(app, {
        eventId: "999",
        currentMemberId: "5",
      });

      assert.equal(response.status, 404);
    });
  });

  describe("DELETE /events/:eventId/invite-tokens/:tokenId", () => {
    it("revokes invite token and returns 200", async () => {
      let receivedInput:
        | Parameters<RouteService["revokeInviteToken"]>[0]
        | undefined;
      const app = createInviteTokenRoutes(
        createRouteService({
          async revokeInviteToken(input) {
            receivedInput = input;
          },
        }),
      );

      const response = await deleteInviteToken(app, {
        eventId: "1",
        tokenId: "1",
        currentMemberId: "5",
      });

      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), {
        message: "招待URLを無効化しました",
      });
      assert.deepEqual(receivedInput, {
        eventId: 1n,
        tokenId: 1n,
        currentMemberId: 5n,
      });
    });

    it("returns 401 without x-event-member-id", async () => {
      const app = createInviteTokenRoutes(createRouteService());
      const response = await deleteInviteToken(app);

      assert.equal(response.status, 401);
      assert.deepEqual(await response.json(), {
        error: { code: "UNAUTHORIZED", message: "認証が必要です" },
      });
    });

    it("returns 400 with invalid eventId", async () => {
      const app = createInviteTokenRoutes(createRouteService());
      const response = await deleteInviteToken(app, {
        eventId: "abc",
        currentMemberId: "5",
      });

      assert.equal(response.status, 400);
      const body = await response.json() as { error: { details: { field: string }[] } };
      assert.equal(body.error.details[0].field, "eventId");
    });

    it("returns 400 with invalid tokenId", async () => {
      const app = createInviteTokenRoutes(createRouteService());
      const response = await deleteInviteToken(app, {
        tokenId: "abc",
        currentMemberId: "5",
      });

      assert.equal(response.status, 400);
      const body = await response.json() as { error: { details: { field: string }[] } };
      assert.equal(body.error.details[0].field, "tokenId");
    });

    it("maps forbidden error to 403", async () => {
      const app = createInviteTokenRoutes(
        createRouteService({
          async revokeInviteToken() {
            throw new ApplicationError("FORBIDDEN", "招待URLを無効化する権限がありません");
          },
        }),
      );

      const response = await deleteInviteToken(app, { currentMemberId: "6" });

      assert.equal(response.status, 403);
    });

    it("maps not found error to 404", async () => {
      const app = createInviteTokenRoutes(
        createRouteService({
          async revokeInviteToken() {
            throw new ApplicationError("NOT_FOUND", "招待URLが存在しません");
          },
        }),
      );

      const response = await deleteInviteToken(app, {
        tokenId: "999",
        currentMemberId: "5",
      });

      assert.equal(response.status, 404);
    });
  });
});
