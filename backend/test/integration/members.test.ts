import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";

import { registerLoginAndCreateEvent } from "../helpers/auth.js";
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
