import { type ApiResult, request } from "@/features/events/services/apiUtils";

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
