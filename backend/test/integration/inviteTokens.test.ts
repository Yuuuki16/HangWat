import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";

import { registerLoginAndCreateEvent } from "../helpers/auth.js";
import { createInviteToken } from "../helpers/seed.js";
import { createTestApp } from "../helpers/testApp.js";
import { resetTestDb } from "../helpers/testDb.js";

describe("POST /api/events/:eventId/invite-tokens", () => {
  beforeEach(async () => {
    await resetTestDb();
  });

  it("ownerなら招待URLを発行できる", async () => {
    const app = createTestApp();
    const { eventId, memberId } = await registerLoginAndCreateEvent(app);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const res = await app.request(`/api/events/${eventId}/invite-tokens`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-event-member-id": memberId,
      },
      body: JSON.stringify({ expiresAt }),
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.ok(body.inviteToken);
    assert.equal(typeof body.inviteToken.inviteToken, "string");
    assert.ok(body.inviteToken.url);
  });

  it("別イベントのmemberIdで403", async () => {
    const app = createTestApp();
    const { eventId } = await registerLoginAndCreateEvent(app);
    const { memberId: otherMemberId } = await registerLoginAndCreateEvent(app, {
      email: `other-${crypto.randomUUID()}@example.com`,
    });

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const res = await app.request(`/api/events/${eventId}/invite-tokens`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-event-member-id": otherMemberId,
      },
      body: JSON.stringify({ expiresAt }),
    });

    assert.equal(res.status, 403);
  });

  it("expiresAt未指定で400", async () => {
    const app = createTestApp();
    const { eventId, memberId } = await registerLoginAndCreateEvent(app);

    const res = await app.request(`/api/events/${eventId}/invite-tokens`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-event-member-id": memberId,
      },
      body: JSON.stringify({}),
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error.code, "VALIDATION_ERROR");
  });
});

describe("DELETE /api/events/:eventId/invite-tokens/:tokenId", () => {
  beforeEach(async () => {
    await resetTestDb();
  });

  it("ownerなら招待URLを無効化できる", async () => {
    const app = createTestApp();
    const { eventId, memberId } = await registerLoginAndCreateEvent(app);
    const { tokenId } = await createInviteToken(app, eventId, memberId);

    const res = await app.request(
      `/api/events/${eventId}/invite-tokens/${tokenId}`,
      {
        method: "DELETE",
        headers: { "x-event-member-id": memberId },
      },
    );

    assert.equal(res.status, 200);
  });

  it("別イベントのmemberIdで403", async () => {
    const app = createTestApp();
    const { eventId, memberId } = await registerLoginAndCreateEvent(app);
    const { tokenId } = await createInviteToken(app, eventId, memberId);
    const { memberId: otherMemberId } = await registerLoginAndCreateEvent(app, {
      email: `other-${crypto.randomUUID()}@example.com`,
    });

    const res = await app.request(
      `/api/events/${eventId}/invite-tokens/${tokenId}`,
      {
        method: "DELETE",
        headers: { "x-event-member-id": otherMemberId },
      },
    );

    assert.equal(res.status, 403);
  });
});
