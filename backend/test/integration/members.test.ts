import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";

import { guestJoin, registerLoginAndCreateEvent } from "../helpers/auth.js";
import { createInviteToken } from "../helpers/seed.js";
import { createTestApp } from "../helpers/testApp.js";
import { resetTestDb } from "../helpers/testDb.js";

describe("GET /api/events/:eventId/members", () => {
  beforeEach(async () => {
    await resetTestDb();
  });

  it("イベント参加者ならメンバー一覧を取得できる", async () => {
    const app = createTestApp();
    const { eventId, memberId } = await registerLoginAndCreateEvent(app);

    const res = await app.request(`/api/events/${eventId}/members`, {
      headers: { "x-event-member-id": memberId },
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(Array.isArray(body.members));
    assert.equal(body.members.length, 1);
    assert.equal(body.members[0].id, memberId);
  });

  it("非参加者なら403", async () => {
    const app = createTestApp();
    const { eventId } = await registerLoginAndCreateEvent(app);
    const { memberId: otherMemberId } = await registerLoginAndCreateEvent(app, {
      email: `other-${crypto.randomUUID()}@example.com`,
      eventTitle: "別イベント",
    });

    const res = await app.request(`/api/events/${eventId}/members`, {
      headers: { "x-event-member-id": otherMemberId },
    });

    assert.equal(res.status, 403);
  });
});

describe("GET /api/events/:eventId/me/member", () => {
  beforeEach(async () => {
    await resetTestDb();
  });

  it("自分のEventMemberを取得できる", async () => {
    const app = createTestApp();
    const { eventId, memberId } = await registerLoginAndCreateEvent(app);

    const res = await app.request(`/api/events/${eventId}/me/member`, {
      headers: { "x-event-member-id": memberId },
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.eventMember.id, memberId);
    assert.equal(body.eventMember.role, "owner");
  });

  it("非参加者なら403", async () => {
    const app = createTestApp();
    const { eventId } = await registerLoginAndCreateEvent(app);
    const { memberId: otherMemberId } = await registerLoginAndCreateEvent(app, {
      email: `other-${crypto.randomUUID()}@example.com`,
      eventTitle: "別イベント",
    });

    const res = await app.request(`/api/events/${eventId}/me/member`, {
      headers: { "x-event-member-id": otherMemberId },
    });

    assert.equal(res.status, 403);
  });
});

describe("PATCH /api/events/:eventId/members/:memberId", () => {
  beforeEach(async () => {
    await resetTestDb();
  });

  it("本人なら表示名を変更できる", async () => {
    const app = createTestApp();
    const { eventId, memberId } = await registerLoginAndCreateEvent(app);
    const { inviteToken } = await createInviteToken(app, eventId, memberId);
    const { memberId: guestMemberId } = await guestJoin(app, inviteToken, "ゲスト");

    const res = await app.request(
      `/api/events/${eventId}/members/${guestMemberId}`,
      {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          "x-event-member-id": guestMemberId,
        },
        body: JSON.stringify({ displayName: "新しい名前" }),
      },
    );

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.eventMember.displayName, "新しい名前");
  });

  it("ownerなら他メンバーの表示名を変更できる", async () => {
    const app = createTestApp();
    const { eventId, memberId } = await registerLoginAndCreateEvent(app);
    const { inviteToken } = await createInviteToken(app, eventId, memberId);
    const { memberId: guestMemberId } = await guestJoin(app, inviteToken, "ゲスト");

    const res = await app.request(
      `/api/events/${eventId}/members/${guestMemberId}`,
      {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          "x-event-member-id": memberId,
        },
        body: JSON.stringify({ displayName: "owner変更" }),
      },
    );

    assert.equal(res.status, 200);
  });

  it("他人なら403", async () => {
    const app = createTestApp();
    const { eventId, memberId } = await registerLoginAndCreateEvent(app);
    const { inviteToken } = await createInviteToken(app, eventId, memberId);
    await guestJoin(app, inviteToken, "ゲスト1");
    const { memberId: guest2MemberId } = await guestJoin(app, inviteToken, "ゲスト2");

    const res = await app.request(
      `/api/events/${eventId}/members/${memberId}`,
      {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          "x-event-member-id": guest2MemberId,
        },
        body: JSON.stringify({ displayName: "不正変更" }),
      },
    );

    assert.equal(res.status, 403);
  });
});

describe("DELETE /api/events/:eventId/members/:memberId", () => {
  beforeEach(async () => {
    await resetTestDb();
  });

  it("本人なら退出できる（guestメンバー）", async () => {
    const app = createTestApp();
    const { eventId, memberId } = await registerLoginAndCreateEvent(app);
    const { inviteToken } = await createInviteToken(app, eventId, memberId);
    const { memberId: guestMemberId } = await guestJoin(app, inviteToken, "ゲスト");

    const res = await app.request(
      `/api/events/${eventId}/members/${guestMemberId}`,
      {
        method: "DELETE",
        headers: { "x-event-member-id": guestMemberId },
      },
    );

    assert.equal(res.status, 200);
  });

  it("ownerは退出できない（409）", async () => {
    const app = createTestApp();
    const { eventId, memberId } = await registerLoginAndCreateEvent(app);

    const res = await app.request(
      `/api/events/${eventId}/members/${memberId}`,
      {
        method: "DELETE",
        headers: { "x-event-member-id": memberId },
      },
    );

    assert.equal(res.status, 409);
    const body = await res.json();
    assert.equal(body.error.code, "CONFLICT");
  });

  it("他人なら403", async () => {
    const app = createTestApp();
    const { eventId, memberId } = await registerLoginAndCreateEvent(app);
    const { inviteToken } = await createInviteToken(app, eventId, memberId);
    await guestJoin(app, inviteToken, "ゲスト1");
    const { memberId: guest2MemberId } = await guestJoin(app, inviteToken, "ゲスト2");

    const res = await app.request(
      `/api/events/${eventId}/members/${memberId}`,
      {
        method: "DELETE",
        headers: { "x-event-member-id": guest2MemberId },
      },
    );

    assert.equal(res.status, 403);
  });
});
