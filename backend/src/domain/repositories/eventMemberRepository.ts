export type EventMemberRole = "OWNER" | "MEMBER";

export type EventMemberUser = {
  id: bigint;
  name: string;
  avatarUrl: string | null;
};

export type EventMemberRecord = {
  id: bigint;
  eventId: bigint;
  userId: bigint | null;
  displayName: string;
  role: EventMemberRole;
  user: EventMemberUser | null;
};

export type CurrentEventMember = {
  id: bigint;
  eventId: bigint;
  userId: bigint | null;
  displayName: string;
  role: EventMemberRole;
};

export interface EventMemberRepository {
  findEventMemberById(
    eventMemberId: bigint,
  ): Promise<CurrentEventMember | null>;
  findEventById(eventId: bigint): Promise<{ id: bigint } | null>;
  findMembersByEventId(eventId: bigint): Promise<EventMemberRecord[]>;
}
