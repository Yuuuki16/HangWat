import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";

import { registerLoginAndCreateEvent } from "../helpers/auth.js";
import { createCandidate, createComment } from "../helpers/seed.js";
import { createTestApp } from "../helpers/testApp.js";
import { resetTestDb } from "../helpers/testDb.js";

describe("GET /api/events/:eventId/candidates/:candidateId/comments", () => {
  beforeEach(async () => {
    await resetTestDb();
  });

  it("イベント参加者ならコメント一覧を取得できる", async () => {
    const app = createTestApp();
    const { eventId, memberId } = await registerLoginAndCreateEvent(app);
    const { candidateId } = await createCandidate(app, eventId, memberId);
    await createComment(app, eventId, candidateId, memberId, "テストコメント");

    const res = await app.request(
      `/api/events/${eventId}/candidates/${candidateId}/comments`,
      { headers: { "x-event-member-id": memberId } },
    );

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(Array.isArray(body.comments));
    assert.equal(body.comments.length, 1);
    assert.equal(body.comments[0].body, "テストコメント");
    assert.ok(body.comments[0].authorMember);
    assert.equal(typeof body.comments[0].likeCount, "number");
    assert.equal(typeof body.comments[0].likedByMe, "boolean");
  });

  it("非参加者なら403", async () => {
    const app = createTestApp();
    const { eventId, memberId } = await registerLoginAndCreateEvent(app);
    const { candidateId } = await createCandidate(app, eventId, memberId);
    const { memberId: otherMemberId } = await registerLoginAndCreateEvent(app, {
      email: `other-${crypto.randomUUID()}@example.com`,
      eventTitle: "別イベント",
    });

    const res = await app.request(
      `/api/events/${eventId}/candidates/${candidateId}/comments`,
      { headers: { "x-event-member-id": otherMemberId } },
    );

    assert.equal(res.status, 403);
  });
});

describe("POST /api/events/:eventId/candidates/:candidateId/comments", () => {
  beforeEach(async () => {
    await resetTestDb();
  });

  it("イベント参加者ならコメントを投稿できる", async () => {
    const app = createTestApp();
    const { eventId, memberId } = await registerLoginAndCreateEvent(app);
    const { candidateId } = await createCandidate(app, eventId, memberId);

    const res = await app.request(
      `/api/events/${eventId}/candidates/${candidateId}/comments`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-event-member-id": memberId,
        },
        body: JSON.stringify({ body: "いい感じ！" }),
      },
    );

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.comment.body, "いい感じ！");
    assert.equal(body.comment.authorMember.id, memberId);
  });

  it("body空文字で400", async () => {
    const app = createTestApp();
    const { eventId, memberId } = await registerLoginAndCreateEvent(app);
    const { candidateId } = await createCandidate(app, eventId, memberId);

    const res = await app.request(
      `/api/events/${eventId}/candidates/${candidateId}/comments`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-event-member-id": memberId,
        },
        body: JSON.stringify({ body: "" }),
      },
    );

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error.code, "VALIDATION_ERROR");
  });

  it("非参加者なら403", async () => {
    const app = createTestApp();
    const { eventId, memberId } = await registerLoginAndCreateEvent(app);
    const { candidateId } = await createCandidate(app, eventId, memberId);
    const { memberId: otherMemberId } = await registerLoginAndCreateEvent(app, {
      email: `other-${crypto.randomUUID()}@example.com`,
      eventTitle: "別イベント",
    });

    const res = await app.request(
      `/api/events/${eventId}/candidates/${candidateId}/comments`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-event-member-id": otherMemberId,
        },
        body: JSON.stringify({ body: "テスト" }),
      },
    );

    assert.equal(res.status, 403);
  });
});

describe("DELETE /api/comments/:commentId", () => {
  beforeEach(async () => {
    await resetTestDb();
  });

  it("コメント作成者本人なら削除できる", async () => {
    const app = createTestApp();
    const { eventId, memberId } = await registerLoginAndCreateEvent(app);
    const { candidateId } = await createCandidate(app, eventId, memberId);
    const { commentId } = await createComment(app, eventId, candidateId, memberId);

    const res = await app.request(`/api/comments/${commentId}`, {
      method: "DELETE",
      headers: { "x-event-member-id": memberId },
    });

    assert.equal(res.status, 200);
  });

  it("他のメンバーなら403", async () => {
    const app = createTestApp();
    const { eventId, memberId } = await registerLoginAndCreateEvent(app);
    const { candidateId } = await createCandidate(app, eventId, memberId);
    const { commentId } = await createComment(app, eventId, candidateId, memberId);
    const { memberId: otherMemberId } = await registerLoginAndCreateEvent(app, {
      email: `other-${crypto.randomUUID()}@example.com`,
      eventTitle: "別イベント",
    });

    const res = await app.request(`/api/comments/${commentId}`, {
      method: "DELETE",
      headers: { "x-event-member-id": otherMemberId },
    });

    assert.equal(res.status, 403);
  });
});

describe("PUT /api/comments/:commentId/like", () => {
  beforeEach(async () => {
    await resetTestDb();
  });

  it("イベント参加者ならいいねできる", async () => {
    const app = createTestApp();
    const { eventId, memberId } = await registerLoginAndCreateEvent(app);
    const { candidateId } = await createCandidate(app, eventId, memberId);
    const { commentId } = await createComment(app, eventId, candidateId, memberId);

    const res = await app.request(`/api/comments/${commentId}/like`, {
      method: "PUT",
      headers: { "x-event-member-id": memberId },
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.likedByMe, true);
    assert.equal(body.likeCount, 1);
  });

  it("2回実行しても重複登録されない", async () => {
    const app = createTestApp();
    const { eventId, memberId } = await registerLoginAndCreateEvent(app);
    const { candidateId } = await createCandidate(app, eventId, memberId);
    const { commentId } = await createComment(app, eventId, candidateId, memberId);

    await app.request(`/api/comments/${commentId}/like`, {
      method: "PUT",
      headers: { "x-event-member-id": memberId },
    });
    const res = await app.request(`/api/comments/${commentId}/like`, {
      method: "PUT",
      headers: { "x-event-member-id": memberId },
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.likeCount, 1);
  });
});

describe("DELETE /api/comments/:commentId/like", () => {
  beforeEach(async () => {
    await resetTestDb();
  });

  it("いいねを解除できる", async () => {
    const app = createTestApp();
    const { eventId, memberId } = await registerLoginAndCreateEvent(app);
    const { candidateId } = await createCandidate(app, eventId, memberId);
    const { commentId } = await createComment(app, eventId, candidateId, memberId);

    await app.request(`/api/comments/${commentId}/like`, {
      method: "PUT",
      headers: { "x-event-member-id": memberId },
    });
    const res = await app.request(`/api/comments/${commentId}/like`, {
      method: "DELETE",
      headers: { "x-event-member-id": memberId },
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.likedByMe, false);
    assert.equal(body.likeCount, 0);
  });
});
