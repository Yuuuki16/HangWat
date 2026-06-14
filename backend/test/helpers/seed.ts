import type { Hono } from "hono";

export async function createEvent(
  app: Hono,
  cookie: string,
  options?: {
    title?: string;
    date?: string;
    description?: string;
  },
): Promise<{ eventId: string; memberId: string }> {
  const res = await app.request("/api/events", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie,
    },
    body: JSON.stringify({
      title: options?.title ?? "テストイベント",
      date: options?.date ?? "2026-12-31",
      location: null,
      description: options?.description ?? null,
    }),
  });

  const body = (await res.json()) as {
    event: { id: string; myMember: { id: string } };
  };

  return {
    eventId: body.event.id,
    memberId: body.event.myMember.id,
  };
}

export async function createCandidate(
  app: Hono,
  eventId: string,
  memberId: string,
  options?: { title?: string; startAt?: string; endAt?: string },
): Promise<{ candidateId: string }> {
  const res = await app.request(`/api/events/${eventId}/candidates`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-event-member-id": memberId,
    },
    body: JSON.stringify({
      title: options?.title ?? "候補日程",
      startAt: options?.startAt ?? "2026-12-31T10:00:00.000Z",
      endAt: options?.endAt ?? "2026-12-31T12:00:00.000Z",
      location: null,
      description: null,
    }),
  });

  const body = (await res.json()) as { candidate: { id: string } };
  return { candidateId: body.candidate.id };
}

export async function createComment(
  app: Hono,
  eventId: string,
  candidateId: string,
  memberId: string,
  body = "テストコメント",
): Promise<{ commentId: string }> {
  const res = await app.request(
    `/api/events/${eventId}/candidates/${candidateId}/comments`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-event-member-id": memberId,
      },
      body: JSON.stringify({ body }),
    },
  );

  const resBody = (await res.json()) as { comment: { id: string } };
  return { commentId: resBody.comment.id };
}

export async function createInviteToken(
  app: Hono,
  eventId: string,
  memberId: string,
): Promise<{ tokenId: string; inviteToken: string }> {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const res = await app.request(`/api/events/${eventId}/invite-tokens`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-event-member-id": memberId,
    },
    body: JSON.stringify({ expiresAt }),
  });

  const body = (await res.json()) as {
    inviteToken: { id: string; inviteToken: string };
  };
  return {
    tokenId: body.inviteToken.id,
    inviteToken: body.inviteToken.inviteToken,
  };
}
