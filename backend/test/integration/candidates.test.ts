import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";

import { registerLoginAndCreateEvent } from "../helpers/auth.js";
import { createCandidate, createInviteToken } from "../helpers/seed.js";
import { guestJoin } from "../helpers/auth.js";
import { createTestApp } from "../helpers/testApp.js";
import { resetTestDb } from "../helpers/testDb.js";

describe("POST /api/events/:eventId/candidates", () => {
  beforeEach(async () => {
    await resetTestDb();
  });

  it("イベント参加者なら候補を作成できる", async () => {
    const app = createTestApp();
    const { eventId, memberId } = await registerLoginAndCreateEvent(app);

    const res = await app.request(`/api/events/${eventId}/candidates`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-event-member-id": memberId,
      },
      body: JSON.stringify({
        title: "候補日程A",
        startAt: "2026-12-31T10:00:00.000Z",
        endAt: "2026-12-31T12:00:00.000Z",
        location: null,
        description: null,
      }),
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.candidate.title, "候補日程A");
    assert.equal(body.candidate.createdByMember.id, memberId);
  });

  it("非参加者なら403", async () => {
    const app = createTestApp();
    const { eventId } = await registerLoginAndCreateEvent(app);
    const { memberId: otherMemberId } = await registerLoginAndCreateEvent(app, {
      email: `other-${crypto.randomUUID()}@example.com`,
      eventTitle: "別イベント",
    });

    const res = await app.request(`/api/events/${eventId}/candidates`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-event-member-id": otherMemberId,
      },
      body: JSON.stringify({
        title: "候補",
        startAt: "2026-12-31T10:00:00.000Z",
        endAt: "2026-12-31T12:00:00.000Z",
        location: null,
        description: null,
      }),
    });

    assert.equal(res.status, 403);
  });

  it("startsAt未指定で400", async () => {
    const app = createTestApp();
    const { eventId, memberId } = await registerLoginAndCreateEvent(app);

    const res = await app.request(`/api/events/${eventId}/candidates`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-event-member-id": memberId,
      },
      body: JSON.stringify({ title: "候補", location: null, description: null }),
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error.code, "VALIDATION_ERROR");
  });
});

describe("PATCH /api/events/:eventId/candidates/:candidateId", () => {
  beforeEach(async () => {
    await resetTestDb();
  });

  it("作成者本人なら候補を更新できる", async () => {
    const app = createTestApp();
    const { eventId, memberId } = await registerLoginAndCreateEvent(app);
    const { candidateId } = await createCandidate(app, eventId, memberId);

    const res = await app.request(
      `/api/events/${eventId}/candidates/${candidateId}`,
      {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          "x-event-member-id": memberId,
        },
        body: JSON.stringify({
          title: "更新後タイトル",
          startAt: "2026-12-31T10:00:00.000Z",
          endAt: "2026-12-31T12:00:00.000Z",
          location: null,
          description: null,
        }),
      },
    );

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.candidate.title, "更新後タイトル");
  });

  it("他の参加者なら403", async () => {
    const app = createTestApp();
    const { eventId, memberId } = await registerLoginAndCreateEvent(app);
    const { candidateId } = await createCandidate(app, eventId, memberId);
    const { memberId: otherMemberId } = await registerLoginAndCreateEvent(app, {
      email: `other-${crypto.randomUUID()}@example.com`,
      eventTitle: "別イベント",
    });

    const res = await app.request(
      `/api/events/${eventId}/candidates/${candidateId}`,
      {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          "x-event-member-id": otherMemberId,
        },
        body: JSON.stringify({
          title: "不正更新",
          startAt: "2026-12-31T10:00:00.000Z",
          endAt: "2026-12-31T12:00:00.000Z",
          location: null,
          description: null,
        }),
      },
    );

    assert.equal(res.status, 403);
  });

  it("存在しないcandidateIdで404", async () => {
    const app = createTestApp();
    const { eventId, memberId } = await registerLoginAndCreateEvent(app);

    const res = await app.request(
      `/api/events/${eventId}/candidates/999999`,
      {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          "x-event-member-id": memberId,
        },
        body: JSON.stringify({
          title: "更新",
          startAt: "2026-12-31T10:00:00.000Z",
          endAt: "2026-12-31T12:00:00.000Z",
          location: null,
          description: null,
        }),
      },
    );

    assert.equal(res.status, 404);
  });
});

describe("DELETE /api/events/:eventId/candidates/:candidateId", () => {
  beforeEach(async () => {
    await resetTestDb();
  });

  it("作成者本人なら候補を削除できる", async () => {
    const app = createTestApp();
    const { eventId, memberId } = await registerLoginAndCreateEvent(app);
    const { candidateId } = await createCandidate(app, eventId, memberId);

    const res = await app.request(
      `/api/events/${eventId}/candidates/${candidateId}`,
      {
        method: "DELETE",
        headers: { "x-event-member-id": memberId },
      },
    );

    assert.equal(res.status, 200);
  });

  it("他の参加者なら403", async () => {
    const app = createTestApp();
    const { eventId, memberId } = await registerLoginAndCreateEvent(app);
    const { candidateId } = await createCandidate(app, eventId, memberId);
    const { memberId: otherMemberId } = await registerLoginAndCreateEvent(app, {
      email: `other-${crypto.randomUUID()}@example.com`,
      eventTitle: "別イベント",
    });

    const res = await app.request(
      `/api/events/${eventId}/candidates/${candidateId}`,
      {
        method: "DELETE",
        headers: { "x-event-member-id": otherMemberId },
      },
    );

    assert.equal(res.status, 403);
  });
});

describe("POST /api/events/:eventId/candidates/:candidateId/confirm", () => {
  beforeEach(async () => {
    await resetTestDb();
  });

  it("ownerなら候補を確定できる", async () => {
    const app = createTestApp();
    const { eventId, memberId } = await registerLoginAndCreateEvent(app);
    const { candidateId } = await createCandidate(app, eventId, memberId);

    const res = await app.request(
      `/api/events/${eventId}/candidates/${candidateId}/confirm`,
      {
        method: "POST",
        headers: { "x-event-member-id": memberId },
      },
    );

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.event.confirmedCandidateId, candidateId);
    assert.equal(body.candidate.status, "confirmed");
  });

  it("ownerでなければ403", async () => {
    const app = createTestApp();
    const { eventId, memberId } = await registerLoginAndCreateEvent(app);
    const { candidateId } = await createCandidate(app, eventId, memberId);
    const { inviteToken } = await createInviteToken(app, eventId, memberId);
    const { memberId: guestMemberId } = await guestJoin(app, inviteToken, "ゲスト");

    const res = await app.request(
      `/api/events/${eventId}/candidates/${candidateId}/confirm`,
      {
        method: "POST",
        headers: { "x-event-member-id": guestMemberId },
      },
    );

    assert.equal(res.status, 403);
  });

  it("すでに確定済みなら409", async () => {
    const app = createTestApp();
    const { eventId, memberId } = await registerLoginAndCreateEvent(app);
    const { candidateId } = await createCandidate(app, eventId, memberId);
    const { candidateId: candidateId2 } = await createCandidate(
      app,
      eventId,
      memberId,
      { title: "候補B" },
    );

    await app.request(
      `/api/events/${eventId}/candidates/${candidateId}/confirm`,
      {
        method: "POST",
        headers: { "x-event-member-id": memberId },
      },
    );

    const res = await app.request(
      `/api/events/${eventId}/candidates/${candidateId2}/confirm`,
      {
        method: "POST",
        headers: { "x-event-member-id": memberId },
      },
    );

    assert.equal(res.status, 409);
  });
});

describe("POST /api/events/:eventId/candidates/:candidateId/cancel-confirm", () => {
  beforeEach(async () => {
    await resetTestDb();
  });

  it("ownerなら確定を取り消せる", async () => {
    const app = createTestApp();
    const { eventId, memberId } = await registerLoginAndCreateEvent(app);
    const { candidateId } = await createCandidate(app, eventId, memberId);

    await app.request(
      `/api/events/${eventId}/candidates/${candidateId}/confirm`,
      {
        method: "POST",
        headers: { "x-event-member-id": memberId },
      },
    );

    const res = await app.request(
      `/api/events/${eventId}/candidates/${candidateId}/cancel-confirm`,
      {
        method: "POST",
        headers: { "x-event-member-id": memberId },
      },
    );

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.event.confirmedCandidateId, null);
    assert.equal(body.candidate.status, "pending");
  });

  it("確定されていない候補を取り消すと409", async () => {
    const app = createTestApp();
    const { eventId, memberId } = await registerLoginAndCreateEvent(app);
    const { candidateId } = await createCandidate(app, eventId, memberId);

    const res = await app.request(
      `/api/events/${eventId}/candidates/${candidateId}/cancel-confirm`,
      {
        method: "POST",
        headers: { "x-event-member-id": memberId },
      },
    );

    assert.equal(res.status, 409);
  });

  it("ownerでなければ403", async () => {
    const app = createTestApp();
    const { eventId, memberId } = await registerLoginAndCreateEvent(app);
    const { candidateId } = await createCandidate(app, eventId, memberId);
    const { inviteToken } = await createInviteToken(app, eventId, memberId);
    const { memberId: guestMemberId } = await guestJoin(app, inviteToken, "ゲスト");

    await app.request(
      `/api/events/${eventId}/candidates/${candidateId}/confirm`,
      {
        method: "POST",
        headers: { "x-event-member-id": memberId },
      },
    );

    const res = await app.request(
      `/api/events/${eventId}/candidates/${candidateId}/cancel-confirm`,
      {
        method: "POST",
        headers: { "x-event-member-id": guestMemberId },
      },
    );

    assert.equal(res.status, 403);
  });
});
