export type ScheduleCandidateStatus = "pending" | "confirmed" | "cancelled";

export type ScheduleCandidate = {
  id: string;
  title: string;
  time: string;
  location: string;
  status: ScheduleCandidateStatus;
  commentCount: number;
  likeCount?: number;
};
