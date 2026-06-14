import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";

import { createTestApp } from "../helpers/testApp.js";
import { resetTestDb } from "../helpers/testDb.js";

describe("主要シナリオ: 登録→ログイン→イベント作成→候補→コメント→いいね", () => {
  beforeEach(async () => {
    await resetTestDb();
  });

  it("主要フローが一本通る", async () => {
    const app = createTestApp();

    // 1. ユーザー登録
    const registerRes = await app.request("/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "はせたく",
        email: "scenario@example.com",
        password: "password123",
      }),
    });
    assert.equal(registerRes.status, 201);
    const registerBody = await registerRes.json();
    assert.equal(typeof registerBody.user.id, "string");

    // 2. ログイン
    const loginRes = await app.request("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "scenario@example.com", password: "password123" }),
    });
    assert.equal(loginRes.status, 200);
    const cookie = loginRes.headers.get("set-cookie") ?? "";
    assert.ok(cookie.includes("session_token"));

    // 3. ログイン中ユーザー取得
    const meRes = await app.request("/api/me", { headers: { cookie } });
    assert.equal(meRes.status, 200);
    const meBody = await meRes.json();
    assert.equal(meBody.user.email, "scenario@example.com");

    // 4. イベント作成
    const eventRes = await app.request("/api/events", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        title: "梅田で昼ごはん",
        date: "2026-07-31",
        location: null,
        description: "昼ごはん候補を決める",
      }),
    });
    assert.equal(eventRes.status, 201);
    const eventBody = await eventRes.json();
    const eventId: string = eventBody.event.id;
    const memberId: string = eventBody.event.myMember.id;
    assert.ok(eventId);
    assert.ok(memberId);

    // 5. イベント詳細取得
    const detailRes = await app.request(`/api/events/${eventId}`, {
      headers: { "x-event-member-id": memberId },
    });
    assert.equal(detailRes.status, 200);
    const detailBody = await detailRes.json();
    assert.equal(detailBody.event.title, "梅田で昼ごはん");
    assert.ok(Array.isArray(detailBody.candidates));

    // 6. 招待URL発行
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const tokenRes = await app.request(`/api/events/${eventId}/invite-tokens`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-event-member-id": memberId,
      },
      body: JSON.stringify({ expiresAt }),
    });
    assert.equal(tokenRes.status, 201);
    const tokenBody = await tokenRes.json();
    assert.ok(tokenBody.inviteToken.url);

    // 7. 予定候補作成
    const candidateRes = await app.request(`/api/events/${eventId}/candidates`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-event-member-id": memberId,
      },
      body: JSON.stringify({
        title: "7/31 ランチ",
        startAt: "2026-07-31T11:00:00.000Z",
        endAt: "2026-07-31T13:00:00.000Z",
        location: null,
        description: null,
      }),
    });
    assert.equal(candidateRes.status, 201);
    const candidateBody = await candidateRes.json();
    const candidateId: string = candidateBody.candidate.id;

    // 8. コメント投稿
    const commentRes = await app.request(
      `/api/events/${eventId}/candidates/${candidateId}/comments`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-event-member-id": memberId,
        },
        body: JSON.stringify({ body: "この日いい感じ！" }),
      },
    );
    assert.equal(commentRes.status, 201);
    const commentBody = await commentRes.json();
    const commentId: string = commentBody.comment.id;

    // 9. コメントいいね
    const likeRes = await app.request(`/api/comments/${commentId}/like`, {
      method: "PUT",
      headers: { "x-event-member-id": memberId },
    });
    assert.equal(likeRes.status, 200);
    const likeBody = await likeRes.json();
    assert.equal(likeBody.likedByMe, true);
    assert.equal(likeBody.likeCount, 1);

    // 10. コメント一覧で確認
    const commentsRes = await app.request(
      `/api/events/${eventId}/candidates/${candidateId}/comments`,
      { headers: { "x-event-member-id": memberId } },
    );
    assert.equal(commentsRes.status, 200);
    const commentsBody = await commentsRes.json();
    assert.equal(commentsBody.comments.length, 1);
    assert.equal(commentsBody.comments[0].likedByMe, true);
    assert.equal(commentsBody.comments[0].likeCount, 1);

    // 11. いいね解除
    const unlikeRes = await app.request(`/api/comments/${commentId}/like`, {
      method: "DELETE",
      headers: { "x-event-member-id": memberId },
    });
    assert.equal(unlikeRes.status, 200);
    const unlikeBody = await unlikeRes.json();
    assert.equal(unlikeBody.likedByMe, false);
    assert.equal(unlikeBody.likeCount, 0);

    // 12. 招待トークン取得
    const inviteToken: string = tokenBody.inviteToken.url.split("/").at(-1)!;

    // 13. ゲスト参加
    const joinRes = await app.request(`/api/invite-tokens/${inviteToken}/join`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ displayName: "ゲスト太郎" }),
    });
    assert.equal(joinRes.status, 201);
    const joinBody = await joinRes.json();
    const guestMemberId: string = joinBody.eventMember.id;
    void joinBody.memberSession.token;
    assert.equal(joinBody.eventMember.memberType, "guest");

    // 14. 候補確定
    const confirmRes = await app.request(
      `/api/events/${eventId}/candidates/${candidateId}/confirm`,
      {
        method: "POST",
        headers: { "x-event-member-id": memberId },
      },
    );
    assert.equal(confirmRes.status, 200);
    const confirmBody = await confirmRes.json();
    assert.equal(confirmBody.event.confirmedCandidateId, candidateId);
    assert.equal(confirmBody.candidate.status, "confirmed");

    // 15. 確定取り消し
    const cancelRes = await app.request(
      `/api/events/${eventId}/candidates/${candidateId}/cancel-confirm`,
      {
        method: "POST",
        headers: { "x-event-member-id": memberId },
      },
    );
    assert.equal(cancelRes.status, 200);
    const cancelBody = await cancelRes.json();
    assert.equal(cancelBody.event.confirmedCandidateId, null);
    assert.equal(cancelBody.candidate.status, "pending");

    // 16. ゲスト退出
    const leaveRes = await app.request(
      `/api/events/${eventId}/members/${guestMemberId}`,
      {
        method: "DELETE",
        headers: { "x-event-member-id": guestMemberId },
      },
    );
    assert.equal(leaveRes.status, 200);

    // メンバー一覧からゲストが消えていることを確認
    const membersRes = await app.request(`/api/events/${eventId}/members`, {
      headers: { "x-event-member-id": memberId },
    });
    assert.equal(membersRes.status, 200);
    const membersBody = await membersRes.json();
    const guestStillExists = membersBody.members.some(
      (m: { id: string }) => m.id === guestMemberId,
    );
    assert.equal(guestStillExists, false);
  });
});
