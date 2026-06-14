import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";

import { registerAndLogin } from "../helpers/auth.js";
import { createTestApp } from "../helpers/testApp.js";
import { resetTestDb } from "../helpers/testDb.js";

describe("POST /api/auth/register", () => {
  beforeEach(async () => {
    await resetTestDb();
  });

  it("正しい入力でユーザーを作成できる", async () => {
    const app = createTestApp();
    const res = await app.request("/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "はせたく",
        email: "takuya@example.com",
        password: "password123",
      }),
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(typeof body.user.id, "string");
    assert.equal(body.user.name, "はせたく");
    assert.equal(body.user.email, "takuya@example.com");
    assert.equal(body.user.passwordHash, undefined);
  });

  it("email重複で409", async () => {
    const app = createTestApp();
    const payload = {
      name: "ユーザー",
      email: "dup@example.com",
      password: "password123",
    };
    await app.request("/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const res = await app.request("/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    assert.equal(res.status, 409);
    const body = await res.json();
    assert.equal(body.error.code, "CONFLICT");
  });

  it("name未指定で400", async () => {
    const app = createTestApp();
    const res = await app.request("/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "a@example.com", password: "password123" }),
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error.code, "VALIDATION_ERROR");
  });
});

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    await resetTestDb();
  });

  it("正しい認証情報でログインできる", async () => {
    const app = createTestApp();
    await app.request("/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "ユーザー",
        email: "login@example.com",
        password: "password123",
      }),
    });

    const res = await app.request("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "login@example.com", password: "password123" }),
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(typeof body.user.id, "string");
    assert.ok(res.headers.get("set-cookie")?.includes("session_token"));
  });

  it("パスワード違いで401", async () => {
    const app = createTestApp();
    await app.request("/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "ユーザー",
        email: "wrong@example.com",
        password: "password123",
      }),
    });

    const res = await app.request("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "wrong@example.com", password: "wrongpass" }),
    });

    assert.equal(res.status, 401);
  });

  it("存在しないemailで401", async () => {
    const app = createTestApp();
    const res = await app.request("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "nobody@example.com", password: "password123" }),
    });

    assert.equal(res.status, 401);
  });
});

describe("GET /api/me", () => {
  beforeEach(async () => {
    await resetTestDb();
  });

  it("ログイン済みならuserを返す", async () => {
    const app = createTestApp();
    const { cookie } = await registerAndLogin(app);

    const res = await app.request("/api/me", {
      headers: { cookie },
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(typeof body.user.id, "string");
  });

  it("未ログインなら401", async () => {
    const app = createTestApp();
    const res = await app.request("/api/me");
    assert.equal(res.status, 401);
  });
});

describe("POST /api/auth/logout", () => {
  beforeEach(async () => {
    await resetTestDb();
  });

  it("ログイン済みならログアウトできる", async () => {
    const app = createTestApp();
    const { cookie } = await registerAndLogin(app);

    const res = await app.request("/api/auth/logout", {
      method: "POST",
      headers: { cookie },
    });

    assert.equal(res.status, 200);
  });

  it("未ログインなら401", async () => {
    const app = createTestApp();
    const res = await app.request("/api/auth/logout", { method: "POST" });
    assert.equal(res.status, 401);
  });
});
