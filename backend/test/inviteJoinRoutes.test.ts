import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ApplicationError } from "../src/application/errors/applicationError.js";
import {
  InviteJoinError,
  type InviteEventMemberDto,
  type InviteEventPreviewDto,
  type InviteJoinService,
  type MemberSessionDto,
} from "../src/application/services/inviteJoinService.js";
import { createInviteJoinRoutes } from "../src/presentation/routes/inviteJoinRoutes.js";

type RouteService = Pick<
  InviteJoinService,
  "getInviteEvent" | "joinByInviteToken" | "rejoinByMemberSession"
>;

const samplePreview: InviteEventPreviewDto = {
  event: {
    id: "1",
    title: "梅田で昼ごはん",
    date: "2026-07-31",
    description: "昼ごはん候補を決める",
    location: null,
  },
  requiresDisplayName: true,
};

const sampleEventMember: InviteEventMemberDto = {
  id: "10",
  eventId: "1",
  userId: null,
  displayName: "たくや",
  role: "member",
  memberType: "guest",
  createdAt: "2026-07-31T10:00:00.000Z",
  updatedAt: "2026-07-31T10:00:00.000Z",
};

const sampleMemberSession: MemberSessionDto = {
  token: "plain_local_token_returned_once",
  expiresAt: "2026-08-30T10:00:00.000Z",
};

function createRouteService(overrides: Partial<RouteService> = {}): RouteService {
  return {
    async getInviteEvent() {
      return samplePreview;
    },
    async joinByInviteToken() {
      return {
        eventMember: sampleEventMember,
        memberSession: sampleMemberSession,
      };
    },
    async rejoinByMemberSession() {
      return { eventMember: sampleEventMember };
    },
    ...overrides,
  };
}

function getInviteEvent(
  app: ReturnType<typeof createInviteJoinRoutes>,
  inviteToken = "active-token",
) {
  return app.request(`/invite-tokens/${inviteToken}`);
}

function postJoin(
  app: ReturnType<typeof createInviteJoinRoutes>,
  options: { inviteToken?: string; body?: unknown } = {},
) {
  return app.request(`/invite-tokens/${options.inviteToken ?? "active-token"}/join`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(options.body ?? { displayName: "たくや" }),
  });
}

function postRejoin(
  app: ReturnType<typeof createInviteJoinRoutes>,
  options: { inviteToken?: string; body?: unknown } = {},
) {
  return app.request(
    `/invite-tokens/${options.inviteToken ?? "active-token"}/rejoin`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(
        options.body ?? { memberSessionToken: "plain_local_token" },
      ),
    },
  );
}

describe("inviteJoinRoutes", () => {
  describe("GET /invite-tokens/:inviteToken", () => {
    it("returns invite event preview", async () => {
      const app = createInviteJoinRoutes(createRouteService());

      const response = await getInviteEvent(app);

      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), samplePreview);
    });

    it("maps expired invite token to 410", async () => {
      const app = createInviteJoinRoutes(
        createRouteService({
          async getInviteEvent() {
            throw new InviteJoinError(
              "INVITE_TOKEN_EXPIRED",
              "招待URLの有効期限が切れています",
            );
          },
        }),
      );

      const response = await getInviteEvent(app);

      assert.equal(response.status, 410);
      assert.deepEqual(await response.json(), {
        error: {
          code: "INVITE_TOKEN_EXPIRED",
          message: "招待URLの有効期限が切れています",
        },
      });
    });
  });

  describe("POST /invite-tokens/:inviteToken/join", () => {
    it("joins by invite token", async () => {
      let receivedInput:
        | Parameters<RouteService["joinByInviteToken"]>[0]
        | undefined;
      const app = createInviteJoinRoutes(
        createRouteService({
          async joinByInviteToken(input) {
            receivedInput = input;
            return {
              eventMember: sampleEventMember,
              memberSession: sampleMemberSession,
            };
          },
        }),
      );

      const response = await postJoin(app, {
        body: { displayName: "  たくや  " },
      });

      assert.equal(response.status, 201);
      assert.deepEqual(await response.json(), {
        eventMember: sampleEventMember,
        memberSession: sampleMemberSession,
      });
      assert.deepEqual(receivedInput, {
        inviteToken: "active-token",
        displayName: "たくや",
      });
    });

    it("returns 400 with empty displayName", async () => {
      const app = createInviteJoinRoutes(createRouteService());

      const response = await postJoin(app, { body: { displayName: "" } });

      assert.equal(response.status, 400);
      const body = (await response.json()) as {
        error: { details: { field: string }[] };
      };
      assert.equal(body.error.details[0].field, "displayName");
    });

    it("maps duplicated displayName to 409", async () => {
      const app = createInviteJoinRoutes(
        createRouteService({
          async joinByInviteToken() {
            throw new ApplicationError(
              "CONFLICT",
              "同じイベント内で同じ表示名が既に使われています",
            );
          },
        }),
      );

      const response = await postJoin(app);

      assert.equal(response.status, 409);
    });
  });

  describe("POST /invite-tokens/:inviteToken/rejoin", () => {
    it("rejoins by member session token", async () => {
      let receivedInput:
        | Parameters<RouteService["rejoinByMemberSession"]>[0]
        | undefined;
      const app = createInviteJoinRoutes(
        createRouteService({
          async rejoinByMemberSession(input) {
            receivedInput = input;
            return { eventMember: sampleEventMember };
          },
        }),
      );

      const response = await postRejoin(app, {
        body: { memberSessionToken: "plain_local_token" },
      });

      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), {
        eventMember: sampleEventMember,
      });
      assert.deepEqual(receivedInput, {
        inviteToken: "active-token",
        memberSessionToken: "plain_local_token",
      });
    });

    it("returns 400 without memberSessionToken", async () => {
      const app = createInviteJoinRoutes(createRouteService());

      const response = await postRejoin(app, { body: {} });

      assert.equal(response.status, 400);
    });

    it("maps invalid member session token to 401", async () => {
      const app = createInviteJoinRoutes(
        createRouteService({
          async rejoinByMemberSession() {
            throw new ApplicationError(
              "UNAUTHORIZED",
              "ローカルトークンが不正です",
            );
          },
        }),
      );

      const response = await postRejoin(app);

      assert.equal(response.status, 401);
    });

    it("maps expired member session token to 410", async () => {
      const app = createInviteJoinRoutes(
        createRouteService({
          async rejoinByMemberSession() {
            throw new InviteJoinError(
              "MEMBER_SESSION_EXPIRED",
              "ローカルトークンの有効期限が切れています",
            );
          },
        }),
      );

      const response = await postRejoin(app);

      assert.equal(response.status, 410);
    });
  });
});
