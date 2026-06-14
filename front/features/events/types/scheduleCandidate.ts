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

export type Comment = {
  id: string;
  candidateId: string;
  body: string;
  authorMember: {
    id: string;
    displayName: string;
    memberType: "user" | "guest";
  };
  likeCount: number;
  likedByMe: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CommentLikeState = {
  commentId: string;
  likedByMe: boolean;
  likeCount: number;
};
