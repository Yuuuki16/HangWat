import { type ApiResult, request } from "@/features/events/services/apiUtils";

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

export type EventListItemApi = {
  id: string;
  title: string;
  date: string | null;
  location: EventLocationInput | null;
  memberCount: number;
  isConfirmed: boolean;
};

export type CreateEventResult = ApiResult<{ event: CreatedEvent }>;
export type UpdateEventResult = ApiResult<{ event: UpdatedEvent }>;
export type DeleteEventResult = ApiResult<{ message: string }>;
export type ListEventsResult = ApiResult<{ events: EventListItemApi[] }>;

export async function listEvents(): Promise<ListEventsResult> {
  return request(
    "/api/events",
    { method: "GET" },
    "イベント一覧の取得に失敗しました",
  );
}

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
