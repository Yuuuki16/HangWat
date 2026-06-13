export type EventMemberRole = "OWNER" | "MEMBER";
export type CandidateStatus = "PROPOSED" | "CONFIRMED" | "REJECTED";

export type EventLocationRecord = {
  name: string;
  address: string | null;
  googlePlaceId: string | null;
  latitude: number | null;
  longitude: number | null;
  googleMapsUrl: string | null;
};

export type EventListRecord = {
  id: bigint;
  title: string;
  eventDate: Date | null;
  location: EventLocationRecord | null;
  memberCount: number;
  confirmedCandidateId: bigint | null;
};

export type EventUserRecord = {
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
  user: EventUserRecord | null;
};

export type EventCandidateRecord = {
  id: bigint;
  eventId: bigint;
  title: string;
  startsAt: Date;
  endsAt: Date | null;
  location: EventLocationRecord | null;
  description: string | null;
  status: CandidateStatus;
  createdByMember: EventMemberRecord;
  commentCount: number;
  likeCount: number;
  createdAt: Date;
  updatedAt: Date;
};

export type EventDetailRecord = {
  id: bigint;
  title: string;
  eventDate: Date | null;
  location: EventLocationRecord | null;
  description: string | null;
  inviteUrl: string | null;
  createdBy: EventUserRecord;
  members: EventMemberRecord[];
  confirmedCandidateId: bigint | null;
  candidates: EventCandidateRecord[];
  createdAt: Date;
  updatedAt: Date;
};

export interface EventRepository {
  findUserById(userId: bigint): Promise<{ id: bigint } | null>;
  findEventsByUserId(userId: bigint): Promise<EventListRecord[]>;
  findEventMemberById(eventMemberId: bigint): Promise<EventMemberRecord | null>;
  findEventDetailById(eventId: bigint): Promise<EventDetailRecord | null>;
}
