export type ScheduleCandidateEventMemberRole = "OWNER" | "MEMBER";

export type ScheduleCandidateEventMember = {
  id: bigint;
  eventId: bigint;
  userId: bigint | null;
  displayName: string;
  role: ScheduleCandidateEventMemberRole;
};

export type ScheduleCandidateEvent = {
  id: bigint;
  confirmedCandidateId: bigint | null;
};

export type ScheduleCandidateLocationInput = {
  name: string;
  address: string | null;
  googlePlaceId: string | null;
  latitude: number | null;
  longitude: number | null;
  googleMapsUrl: string | null;
};

export type ScheduleCandidateLocation = ScheduleCandidateLocationInput & {
  id: bigint;
};

export type ScheduleCandidateStatus = "PROPOSED" | "CONFIRMED" | "REJECTED";

export type ScheduleCandidateRecord = {
  id: bigint;
  eventId: bigint;
  createdByMemberId: bigint;
  title: string;
  startsAt: Date;
  endsAt: Date | null;
  location: ScheduleCandidateLocation | null;
  description: string | null;
  status: ScheduleCandidateStatus;
  createdByMember: {
    id: bigint;
    userId: bigint | null;
    displayName: string;
  };
  commentCount: number;
  createdAt: Date;
  updatedAt: Date;
};

export interface ScheduleCandidateRepository {
  findEventMemberById(
    eventMemberId: bigint,
  ): Promise<ScheduleCandidateEventMember | null>;
  findEventById(eventId: bigint): Promise<ScheduleCandidateEvent | null>;
  findScheduleCandidateById(
    candidateId: bigint,
  ): Promise<ScheduleCandidateRecord | null>;
  createScheduleCandidate(input: {
    eventId: bigint;
    createdByMemberId: bigint;
    title: string;
    startsAt: Date;
    endsAt: Date | null;
    location: ScheduleCandidateLocationInput | null;
    description: string | null;
  }): Promise<ScheduleCandidateRecord>;
  updateScheduleCandidate(input: {
    candidateId: bigint;
    title: string;
    startsAt: Date;
    endsAt: Date | null;
    location: ScheduleCandidateLocationInput | null;
    description: string | null;
  }): Promise<ScheduleCandidateRecord>;
  deleteScheduleCandidateById(candidateId: bigint): Promise<void>;
}
