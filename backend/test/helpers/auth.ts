import type { Hono } from "hono";

export type LoginResult = {
  userId: string;
  cookie: string;
  memberId?: string;
};

export async function registerAndLogin(
  app: Hono,
  options?: {
    name?: string;
    email?: string;
    password?: string;
  },
): Promise<LoginResult> {
  const name = options?.name ?? "テストユーザー";
  const email = options?.email ?? `user-${crypto.randomUUID()}@example.com`;
  const password = options?.password ?? "password123";

  await app.request("/api/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });

  const loginRes = await app.request("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const body = (await loginRes.json()) as { user: { id: string } };
  const setCookie = loginRes.headers.get("set-cookie") ?? "";

  return { userId: body.user.id, cookie: setCookie };
}

export async function registerLoginAndCreateEvent(
  app: Hono,
  options?: {
    name?: string;
    email?: string;
    eventTitle?: string;
  },
): Promise<LoginResult & { eventId: string; memberId: string }> {
  const auth = await registerAndLogin(app, options);

  const eventRes = await app.request("/api/events", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie: auth.cookie,
    },
    body: JSON.stringify({
      title: options?.eventTitle ?? "テストイベント",
      date: "2026-12-31",
      location: null,
      description: null,
    }),
  });

  const eventBody = (await eventRes.json()) as {
    event: { id: string; myMember: { id: string } };
  };

  return {
    ...auth,
    eventId: eventBody.event.id,
    memberId: eventBody.event.myMember.id,
  };
}

export async function guestJoin(
  app: Hono,
  inviteToken: string,
  displayName = "ゲストユーザー",
): Promise<{ memberId: string; memberSessionToken: string }> {
  const res = await app.request(`/api/invite-tokens/${inviteToken}/join`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ displayName }),
  });

  const body = (await res.json()) as {
    eventMember: { id: string };
    memberSession: { token: string };
  };

  return {
    memberId: body.eventMember.id,
    memberSessionToken: body.memberSession.token,
  };
}
