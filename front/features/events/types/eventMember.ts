export type EventMemberRole = "owner" | "member";

export type EventMemberType = "user" | "guest";

export type EventMember = {
  id: string;
  eventId: string;
  userId: string | null;
  displayName: string;
  role: EventMemberRole;
  memberType: EventMemberType;
  user?: {
    id: string;
    name: string;
    avatarUrl: string | null;
  } | null;
};
