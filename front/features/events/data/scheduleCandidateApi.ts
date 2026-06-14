import { apiClient } from "@/lib/apiClient";
import type { EventMember } from "@/features/events/types/eventMember";
import type { EventLocation } from "@/features/events/types/location";
import type { ScheduleCandidate } from "@/features/events/types/scheduleCandidate";

export type ScheduleCandidateRequest = {
  title: string;
  startAt: string;
  endAt: string | null;
  location: EventLocation;
  description: string | null;
};

export type ApiScheduleCandidate = {
  id: string;
  eventId: string;
  title: string;
  startAt: string;
  endAt: string | null;
  location: EventLocation;
  description: string | null;
  status: "pending" | "confirmed" | "cancelled";
  createdByMember: EventMember | Pick<EventMember, "id" | "displayName" | "memberType">;
  commentCount: number;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
};

type ScheduleCandidateResponse = {
  candidate: ApiScheduleCandidate;
};

export type ScheduleCandidateConfirmation = {
  event: {
    id: string;
    confirmedCandidateId: string | null;
  };
  candidate: {
    id: string;
    status: "pending" | "confirmed" | "cancelled";
  };
};

const eventMemberHeaders = (eventMemberId: string) => ({
  "x-event-member-id": eventMemberId,
});

export const formatScheduleCandidateTime = (startAt: string) => {
  const date = new Date(startAt);

  if (!Number.isNaN(date.getTime())) {
    return new Intl.DateTimeFormat("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
  }

  return startAt.includes("T")
    ? startAt.split("T")[1]?.slice(0, 5) ?? ""
    : startAt.slice(0, 5);
};

export const getLocationText = (location: EventLocation) => {
  if (!location) {
    return "場所未定";
  }

  return location.name || location.address || "場所未定";
};

export const toScheduleCandidate = (
  candidate: ApiScheduleCandidate,
): ScheduleCandidate => ({
  id: candidate.id,
  eventId: candidate.eventId,
  title: candidate.title,
  time: formatScheduleCandidateTime(candidate.startAt),
  startAt: candidate.startAt,
  endAt: candidate.endAt,
  location: getLocationText(candidate.location),
  locationDetail: candidate.location,
  description: candidate.description,
  status: candidate.status,
  commentCount: candidate.commentCount,
  likeCount: candidate.likeCount,
});

export const sortScheduleCandidates = (candidates: ScheduleCandidate[]) =>
  [...candidates].sort((left, right) =>
    (left.startAt ?? left.time).localeCompare(right.startAt ?? right.time),
  );

export async function createScheduleCandidate(input: {
  eventId: string;
  currentMemberId: string;
  candidate: ScheduleCandidateRequest;
}): Promise<ScheduleCandidate> {
  const response = await apiClient<ScheduleCandidateResponse>(
    `/api/events/${encodeURIComponent(input.eventId)}/candidates`,
    {
      method: "POST",
      headers: eventMemberHeaders(input.currentMemberId),
      body: input.candidate,
    },
  );

  return toScheduleCandidate(response.candidate);
}

export async function updateScheduleCandidate(input: {
  eventId: string;
  candidateId: string;
  currentMemberId: string;
  candidate: ScheduleCandidateRequest;
}): Promise<ScheduleCandidate> {
  const response = await apiClient<ScheduleCandidateResponse>(
    `/api/events/${encodeURIComponent(input.eventId)}/candidates/${encodeURIComponent(
      input.candidateId,
    )}`,
    {
      method: "PATCH",
      headers: eventMemberHeaders(input.currentMemberId),
      body: input.candidate,
    },
  );

  return toScheduleCandidate(response.candidate);
}

export async function deleteScheduleCandidate(input: {
  eventId: string;
  candidateId: string;
  currentMemberId: string;
}): Promise<void> {
  await apiClient<{ message: string }>(
    `/api/events/${encodeURIComponent(input.eventId)}/candidates/${encodeURIComponent(
      input.candidateId,
    )}`,
    {
      method: "DELETE",
      headers: eventMemberHeaders(input.currentMemberId),
    },
  );
}

export async function confirmScheduleCandidate(input: {
  eventId: string;
  candidateId: string;
  currentMemberId: string;
}): Promise<ScheduleCandidateConfirmation> {
  return apiClient<ScheduleCandidateConfirmation>(
    `/api/events/${encodeURIComponent(input.eventId)}/candidates/${encodeURIComponent(
      input.candidateId,
    )}/confirm`,
    {
      method: "POST",
      headers: eventMemberHeaders(input.currentMemberId),
    },
  );
}

export async function cancelScheduleCandidateConfirmation(input: {
  eventId: string;
  candidateId: string;
  currentMemberId: string;
}): Promise<ScheduleCandidateConfirmation> {
  return apiClient<ScheduleCandidateConfirmation>(
    `/api/events/${encodeURIComponent(input.eventId)}/candidates/${encodeURIComponent(
      input.candidateId,
    )}/cancel-confirm`,
    {
      method: "POST",
      headers: eventMemberHeaders(input.currentMemberId),
    },
  );
}
