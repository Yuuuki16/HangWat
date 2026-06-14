import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import WebSocket from "ws";

import { startTestServer } from "../helpers/testServer.js";
import { resetTestDb } from "../helpers/testDb.js";

async function setupEventAndCandidate(baseUrl: string) {
  const email = `ws-test-${crypto.randomUUID()}@example.com`;

  await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "WSテスト", email, password: "password123" }),
  });

  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password: "password123" }),
  });
  const cookie = loginRes.headers.get("set-cookie") ?? "";

  const eventRes = await fetch(`${baseUrl}/api/events`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({
      title: "WSテストイベント",
      date: "2026-12-31",
      location: null,
      description: null,
    }),
  });
  const eventBody = (await eventRes.json()) as {
    event: { id: string; myMember: { id: string } };
  };
  const eventId = eventBody.event.id;
  const memberId = eventBody.event.myMember.id;

  const candidateRes = await fetch(
    `${baseUrl}/api/events/${eventId}/candidates`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-event-member-id": memberId,
      },
      body: JSON.stringify({
        title: "候補A",
        startAt: "2026-12-31T10:00:00.000Z",
        endAt: "2026-12-31T12:00:00.000Z",
        location: null,
        description: null,
      }),
    },
  );
  const candidateBody = (await candidateRes.json()) as {
    candidate: { id: string };
  };
  const candidateId = candidateBody.candidate.id;

  return { eventId, memberId, candidateId };
}

function wsConnect(url: string): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    // @hono/node-ws の onOpen は await されないため、open イベント後に
    // 非同期のDB検証・subscribe が完了するまで少し待つ
    ws.once("open", () => setTimeout(() => resolve(ws), 100));
    ws.once("error", reject);
  });
}

function wsReceiveOne(ws: WebSocket, timeoutMs = 3000): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("WebSocket message timeout"));
    }, timeoutMs);
    ws.once("message", (data) => {
      clearTimeout(timer);
      resolve(JSON.parse(data.toString()));
    });
  });
}

describe("WS /ws/events/:eventId/candidates/:candidateId", () => {
  beforeEach(async () => {
    await resetTestDb();
  });

  it("コメント投稿で comment.created イベントを受信する", async () => {
    const server = await startTestServer();
    try {
      const { eventId, memberId, candidateId } = await setupEventAndCandidate(
        server.baseUrl,
      );

      const ws = await wsConnect(
        `${server.wsUrl}/ws/events/${eventId}/candidates/${candidateId}?memberId=${memberId}`,
      );
      try {
        const messagePromise = wsReceiveOne(ws);

        const res = await fetch(
          `${server.baseUrl}/api/events/${eventId}/candidates/${candidateId}/comments`,
          {
            method: "POST",
            headers: {
              "content-type": "application/json",
              "x-event-member-id": memberId,
            },
            body: JSON.stringify({ body: "リアルタイムテスト" }),
          },
        );
        assert.equal(res.status, 201);

        const event = (await messagePromise) as {
          type: string;
          comment: { body: string };
        };
        assert.equal(event.type, "comment.created");
        assert.equal(event.comment.body, "リアルタイムテスト");
      } finally {
        ws.close();
      }
    } finally {
      await server.close();
    }
  });

  it("コメント削除で comment.deleted イベントを受信する", async () => {
    const server = await startTestServer();
    try {
      const { eventId, memberId, candidateId } = await setupEventAndCandidate(
        server.baseUrl,
      );

      const commentRes = await fetch(
        `${server.baseUrl}/api/events/${eventId}/candidates/${candidateId}/comments`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-event-member-id": memberId,
          },
          body: JSON.stringify({ body: "削除するコメント" }),
        },
      );
      const commentBody = (await commentRes.json()) as {
        comment: { id: string };
      };
      const commentId = commentBody.comment.id;

      const ws = await wsConnect(
        `${server.wsUrl}/ws/events/${eventId}/candidates/${candidateId}?memberId=${memberId}`,
      );
      try {
        const messagePromise = wsReceiveOne(ws);

        const delRes = await fetch(
          `${server.baseUrl}/api/comments/${commentId}`,
          {
            method: "DELETE",
            headers: { "x-event-member-id": memberId },
          },
        );
        assert.equal(delRes.status, 200);

        const event = (await messagePromise) as {
          type: string;
          commentId: string;
        };
        assert.equal(event.type, "comment.deleted");
        assert.equal(event.commentId, commentId);
      } finally {
        ws.close();
      }
    } finally {
      await server.close();
    }
  });

  it("いいね更新で comment.like.updated イベントを受信する", async () => {
    const server = await startTestServer();
    try {
      const { eventId, memberId, candidateId } = await setupEventAndCandidate(
        server.baseUrl,
      );

      const commentRes = await fetch(
        `${server.baseUrl}/api/events/${eventId}/candidates/${candidateId}/comments`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-event-member-id": memberId,
          },
          body: JSON.stringify({ body: "いいねするコメント" }),
        },
      );
      const commentBody = (await commentRes.json()) as {
        comment: { id: string };
      };
      const commentId = commentBody.comment.id;

      const ws = await wsConnect(
        `${server.wsUrl}/ws/events/${eventId}/candidates/${candidateId}?memberId=${memberId}`,
      );
      try {
        const messagePromise = wsReceiveOne(ws);

        const likeRes = await fetch(
          `${server.baseUrl}/api/comments/${commentId}/like`,
          {
            method: "PUT",
            headers: { "x-event-member-id": memberId },
          },
        );
        assert.equal(likeRes.status, 200);

        const event = (await messagePromise) as {
          type: string;
          commentId: string;
          likeCount: number;
        };
        assert.equal(event.type, "comment.like.updated");
        assert.equal(event.commentId, commentId);
        assert.equal(event.likeCount, 1);
      } finally {
        ws.close();
      }
    } finally {
      await server.close();
    }
  });

  it("無効な memberId で接続すると close(1008) される", async () => {
    const server = await startTestServer();
    try {
      const { eventId, candidateId } = await setupEventAndCandidate(
        server.baseUrl,
      );

      const ws = await wsConnect(
        `${server.wsUrl}/ws/events/${eventId}/candidates/${candidateId}?memberId=99999999`,
      );

      const closeCode = await new Promise<number>((resolve) => {
        ws.once("close", (code) => resolve(code));
      });

      assert.equal(closeCode, 1008);
    } finally {
      await server.close();
    }
  });

  it("memberId なしで接続すると close(1008) される", async () => {
    const server = await startTestServer();
    try {
      const { eventId, candidateId } = await setupEventAndCandidate(
        server.baseUrl,
      );

      const ws = await wsConnect(
        `${server.wsUrl}/ws/events/${eventId}/candidates/${candidateId}`,
      );

      const closeCode = await new Promise<number>((resolve) => {
        ws.once("close", (code) => resolve(code));
      });

      assert.equal(closeCode, 1008);
    } finally {
      await server.close();
    }
  });
});
