import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";

import { registerAndLogin, registerLoginAndCreateEvent } from "../helpers/auth.js";
import { createInviteToken } from "../helpers/seed.js";
import { createTestApp } from "../helpers/testApp.js";
import { resetTestDb } from "../helpers/testDb.js";

describe("POST /api/events", () => {
  beforeEach(async () => {
    await resetTestDb();
  });

  it("ログイン済みユーザーがイベントを作成できる", async () => {
    const app = createTestApp();
    const { cookie } = await registerAndLogin(app);

    const res = await app.request("/api/events", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        title: "梅田で昼ごはん",
        date: "2026-07-31",
        location: null,
        description: "昼ごはん候補を決める",
      }),
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.event.title, "梅田で昼ごはん");
    assert.equal(typeof body.event.id, "string");
    assert.ok(body.event.myMember);
    assert.equal(typeof body.event.myMember.id, "string");
  });

  it("作成者がownerのevent_memberとして登録される", async () => {
    const app = createTestApp();
    const { cookie } = await registerAndLogin(app);

    const res = await app.request("/api/events", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ title: "イベント", date: "2026-07-31", location: null, description: null }),
    });

    const body = await res.json();
    assert.equal(body.event.myMember.role, "owner");
  });

  it("未ログインなら401", async () => {
    const app = createTestApp();
    const res = await app.request("/api/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "イベント", date: "2026-07-31", location: null, description: null }),
    });

    assert.equal(res.status, 401);
  });

  it("title未指定で400", async () => {
    const app = createTestApp();
    const { cookie } = await registerAndLogin(app);

    const res = await app.request("/api/events", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ date: "2026-07-31", location: null, description: null }),
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error.code, "VALIDATION_ERROR");
  });
});

describe("GET /api/events", () => {
  beforeEach(async () => {
    await resetTestDb();
  });

  it("ログイン済みユーザーのイベント一覧を取得できる", async () => {
    const app = createTestApp();
    const { cookie } = await registerAndLogin(app);

    await app.request("/api/events", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ title: "イベント1", date: "2026-07-31", location: null, description: null }),
    });

    const res = await app.request("/api/events", {
      headers: { cookie },
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(Array.isArray(body.events));
    assert.equal(body.events.length, 1);
    assert.equal(body.events[0].title, "イベント1");
    assert.equal(typeof body.events[0].memberCount, "number");
  });

  it("セッションCookie未指定なら401", async () => {
    const app = createTestApp();
    const res = await app.request("/api/events");
    assert.equal(res.status, 401);
  });
});

describe("GET /api/events/:eventId", () => {
  beforeEach(async () => {
    await resetTestDb();
  });

  it("イベント参加者なら詳細を取得できる", async () => {
    const app = createTestApp();
    const { eventId, memberId } = await registerLoginAndCreateEvent(app);

    const res = await app.request(`/api/events/${eventId}`, {
      headers: { "x-event-member-id": memberId },
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.event);
    assert.ok(Array.isArray(body.candidates));
    assert.ok(body.event.myMember);
  });

  it("別イベントのmemberIdで403", async () => {
    const app = createTestApp();
    const { eventId } = await registerLoginAndCreateEvent(app);
    const { memberId: otherMemberId } = await registerLoginAndCreateEvent(app, {
      email: `other-${crypto.randomUUID()}@example.com`,
    });

    const res = await app.request(`/api/events/${eventId}`, {
      headers: { "x-event-member-id": otherMemberId },
    });

    assert.equal(res.status, 403);
  });

  it("存在しないeventIdで404", async () => {
    const app = createTestApp();
    const { memberId } = await registerLoginAndCreateEvent(app);

    const res = await app.request("/api/events/999999", {
      headers: { "x-event-member-id": memberId },
    });

    assert.equal(res.status, 404);
  });
});

describe("PATCH /api/events/:eventId", () => {
  beforeEach(async () => {
    await resetTestDb();
  });

  it("ownerならイベントを更新できる", async () => {
    const app = createTestApp();
    const { cookie, eventId, memberId } = await registerLoginAndCreateEvent(app);

    const res = await app.request(`/api/events/${eventId}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        cookie,
        "x-event-member-id": memberId,
      },
      body: JSON.stringify({ title: "更新後タイトル" }),
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.event.title, "更新後タイトル");
  });

  it("未ログインなら401", async () => {
    const app = createTestApp();
    const { eventId, memberId } = await registerLoginAndCreateEvent(app);

    const res = await app.request(`/api/events/${eventId}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        "x-event-member-id": memberId,
      },
      body: JSON.stringify({ title: "更新" }),
    });

    assert.equal(res.status, 401);
  });
});

describe("DELETE /api/events/:eventId", () => {
  beforeEach(async () => {
    await resetTestDb();
  });

  it("ownerならイベントを削除できる", async () => {
    const app = createTestApp();
    const { cookie, eventId, memberId } = await registerLoginAndCreateEvent(app);

    const res = await app.request(`/api/events/${eventId}`, {
      method: "DELETE",
      headers: { cookie, "x-event-member-id": memberId },
    });

    assert.equal(res.status, 200);
  });

  it("owner以外なら403", async () => {
    const app = createTestApp();
    const { eventId, memberId } = await registerLoginAndCreateEvent(app);

    const { inviteToken } = await createInviteToken(app, eventId, memberId);
    const joinRes = await app.request(
      `/api/events/${eventId}/join/${inviteToken}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ displayName: "非オーナー" }),
      },
    );
    assert.equal(joinRes.status, 201);
    const joinBody = (await joinRes.json()) as { eventMember: { id: string } };
    const guestMemberId = joinBody.eventMember.id;

    const res = await app.request(`/api/events/${eventId}`, {
      method: "DELETE",
      headers: { "x-event-member-id": guestMemberId },
    });

    assert.equal(res.status, 403);
  });
});
