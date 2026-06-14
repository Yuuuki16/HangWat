const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "";

const requestTimeoutMs = 10000;
const networkErrorMessage = "通信に失敗しました。時間をおいて再度お試しください";

export type EventLocationInput = {
  name: string;
  address: string | null;
  googlePlaceId: string | null;
  latitude: number | null;
  longitude: number | null;
  googleMapsUrl: string | null;
};

export type CreateEventInput = {
  title: string;
  date: string | null;
  location: EventLocationInput | null;
  description: string | null;
};

export type UpdateEventInput = CreateEventInput;

export type CreatedEventMember = {
  id: string;
  eventId: string;
  userId: string | null;
  displayName: string;
  role: "owner" | "member";
  memberType: "user" | "guest";
};

export type CreatedEvent = {
  id: string;
  title: string;
  date: string | null;
  location: EventLocationInput | null;
  description: string | null;
  inviteUrl: null;
  confirmedCandidateId: null;
  myMember: CreatedEventMember;
  createdAt: string;
  updatedAt: string;
};

export type UpdatedEvent = {
  id: string;
  title: string;
  date: string | null;
  location: EventLocationInput | null;
  description: string | null;
  updatedAt: string;
};

type ValidationDetail = {
  field: string;
  message: string;
};

type ApiResult<T> = { ok: true; data: T } | { ok: false; message: string };

export type CreateEventResult = ApiResult<{ event: CreatedEvent }>;
export type UpdateEventResult = ApiResult<{ event: UpdatedEvent }>;
export type DeleteEventResult = ApiResult<{ message: string }>;

export async function createEvent(
  input: CreateEventInput,
): Promise<CreateEventResult> {
  return request(
    "/api/events",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
    "イベントの作成に失敗しました",
  );
}

export async function updateEvent(
  eventId: string,
  input: UpdateEventInput,
): Promise<UpdateEventResult> {
  return request(
    `/api/events/${encodeURIComponent(eventId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
    "イベントの更新に失敗しました",
  );
}

export async function deleteEvent(eventId: string): Promise<DeleteEventResult> {
  return request(
    `/api/events/${encodeURIComponent(eventId)}`,
    { method: "DELETE" },
    "イベントの削除に失敗しました",
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
