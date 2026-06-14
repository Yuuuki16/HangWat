import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";

import { guestJoin, registerLoginAndCreateEvent } from "../helpers/auth.js";
import { createInviteToken } from "../helpers/seed.js";
import { createTestApp } from "../helpers/testApp.js";
import { resetTestDb } from "../helpers/testDb.js";

describe("GET /api/invite-tokens/:inviteToken", () => {
  beforeEach(async () => {
    await resetTestDb();
  });

  it("有効なトークンでイベント情報を取得できる", async () => {
    const app = createTestApp();
    const { eventId, memberId } = await registerLoginAndCreateEvent(app);
    const { inviteToken } = await createInviteToken(app, eventId, memberId);

    const res = await app.request(`/api/invite-tokens/${inviteToken}`);

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.event.id);
    assert.ok(body.event.title);
  });

  it("存在しないトークンで404", async () => {
    const app = createTestApp();

    const res = await app.request(
      `/api/invite-tokens/00000000-0000-0000-0000-000000000000`,
    );

    assert.equal(res.status, 404);
  });
});

describe("POST /api/invite-tokens/:inviteToken/join", () => {
  beforeEach(async () => {
    await resetTestDb();
  });

  it("ゲストとしてイベントに参加できる", async () => {
    const app = createTestApp();
    const { eventId, memberId } = await registerLoginAndCreateEvent(app);
    const { inviteToken } = await createInviteToken(app, eventId, memberId);

    const res = await app.request(`/api/invite-tokens/${inviteToken}/join`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ displayName: "ゲストユーザー" }),
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.eventMember.memberType, "guest");
    assert.ok(body.memberSession.token);
  });

  it("displayName未指定で400", async () => {
    const app = createTestApp();
    const { eventId, memberId } = await registerLoginAndCreateEvent(app);
    const { inviteToken } = await createInviteToken(app, eventId, memberId);

    const res = await app.request(`/api/invite-tokens/${inviteToken}/join`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });

    assert.equal(res.status, 400);
  });
});

describe("POST /api/invite-tokens/:inviteToken/rejoin", () => {
  beforeEach(async () => {
    await resetTestDb();
  });

  it("有効なセッショントークンで再参加できる", async () => {
    const app = createTestApp();
    const { eventId, memberId } = await registerLoginAndCreateEvent(app);
    const { inviteToken } = await createInviteToken(app, eventId, memberId);
    const { memberSessionToken } = await guestJoin(app, inviteToken, "ゲスト");

    const res = await app.request(`/api/invite-tokens/${inviteToken}/rejoin`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ memberSessionToken }),
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.eventMember.id);
  });

  it("無効なセッショントークンで401", async () => {
    const app = createTestApp();
    const { eventId, memberId } = await registerLoginAndCreateEvent(app);
    const { inviteToken } = await createInviteToken(app, eventId, memberId);

    const res = await app.request(`/api/invite-tokens/${inviteToken}/rejoin`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ memberSessionToken: "invalid-token" }),
    });

    assert.equal(res.status, 401);
  });
});
