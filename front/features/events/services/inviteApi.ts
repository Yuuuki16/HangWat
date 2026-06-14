const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "";

const requestTimeoutMs = 10000;
const networkErrorMessage = "通信に失敗しました。時間をおいて再度お試しください";

export type InviteLocation = {
  name: string;
  address: string | null;
  googlePlaceId: string | null;
  latitude: number | null;
  longitude: number | null;
  googleMapsUrl: string | null;
};

export type InviteEventPreview = {
  event: {
    id: string;
    title: string;
    date: string | null;
    description: string | null;
    location: InviteLocation | null;
  };
  requiresDisplayName: true;
};

export type InviteEventMember = {
  id: string;
  eventId: string;
  userId: string | null;
  displayName: string;
  role: "owner" | "member";
  memberType: "user" | "guest";
  createdAt: string;
  updatedAt: string;
};

export type MemberSession = {
  token: string;
  expiresAt: string;
};

type ValidationDetail = {
  field: string;
  message: string;
};

type ApiResult<T> = { ok: true; data: T } | { ok: false; message: string };

export type InvitePreviewResult = ApiResult<InviteEventPreview>;
export type InviteJoinResult = ApiResult<{
  eventMember: InviteEventMember;
  memberSession: MemberSession;
}>;
export type InviteRejoinResult = ApiResult<{ eventMember: InviteEventMember }>;

export async function getInviteEvent(
  inviteToken: string,
): Promise<InvitePreviewResult> {
  return request<InviteEventPreview>(
    `/api/invite-tokens/${encodeURIComponent(inviteToken)}`,
    { method: "GET" },
    "イベント情報の取得に失敗しました",
  );
}

export async function joinInviteEvent(
  inviteToken: string,
  displayName: string,
): Promise<InviteJoinResult> {
  return request(
    `/api/invite-tokens/${encodeURIComponent(inviteToken)}/join`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName }),
    },
    "イベントへの参加に失敗しました",
  );
}

export async function rejoinInviteEvent(
  inviteToken: string,
  memberSessionToken: string,
): Promise<InviteRejoinResult> {
  return request(
    `/api/invite-tokens/${encodeURIComponent(inviteToken)}/rejoin`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberSessionToken }),
    },
    "再参加に失敗しました",
  );
}

async function request<T>(
  path: string,
  init: RequestInit,
  fallbackErrorMessage: string,
): Promise<ApiResult<T>> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), requestTimeoutMs);

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...init,
      credentials: "include",
      signal: controller.signal,
    });
  } catch {
    return { ok: false, message: networkErrorMessage };
  } finally {
    clearTimeout(timeoutId);
  }

  if (response.ok) {
    try {
      const data = (await response.json()) as T;
      return { ok: true, data };
    } catch {
      return { ok: false, message: fallbackErrorMessage };
    }
  }

  return {
    ok: false,
    message: await extractErrorMessage(response, fallbackErrorMessage),
  };
}

async function extractErrorMessage(
  response: Response,
  fallback: string,
): Promise<string> {
  try {
    const data = (await response.json()) as {
      error?: { message?: string; details?: ValidationDetail[] };
    };
    if (data.error?.details && data.error.details.length > 0) {
      return data.error.details.map((detail) => detail.message).join("\n");
    }
    if (data.error?.message) {
      return data.error.message;
    }
  } catch {
    // レスポンスボディが JSON でない場合は既定のメッセージを使う
  }

  return fallback;
}
