import type { EventLocation } from "@/features/events/types/location";

export type ScheduleCandidateStatus = "pending" | "confirmed" | "cancelled";

export type ScheduleCandidate = {
  id: string;
  eventId?: string;
  title: string;
  time: string;
  startAt?: string;
  endAt?: string | null;
  location: string;
  locationDetail?: EventLocation;
  description?: string | null;
  status: ScheduleCandidateStatus;
  commentCount: number;
  likeCount?: number;
};
