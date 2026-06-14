import { apiClient } from "@/lib/apiClient";
import type { Event } from "@/features/events/types/event";
import type { ScheduleCandidate } from "@/features/events/types/scheduleCandidate";

type ApiLocation = {
  name: string;
  address: string | null;
  googlePlaceId: string | null;
  latitude: number | null;
  longitude: number | null;
  googleMapsUrl: string | null;
} | null;

type EventDetailResponse = {
  event: {
    id: string;
    title: string;
    date: string | null;
    location: ApiLocation;
    description: string | null;
    inviteUrl: string | null;
    members: unknown[];
  };
  candidates: {
    id: string;
    title: string;
    startAt: string;
    location: ApiLocation;
    status: "pending" | "confirmed" | "cancelled";
    commentCount: number;
    likeCount: number;
  }[];
};

type EventDetail = {
  event: Event;
  candidates: ScheduleCandidate[];
};

const formatTime = (startAt: string) => {
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

const getLocationText = (location: ApiLocation) => {
  if (!location) {
    return "場所未定";
  }

  return location.name || location.address || "場所未定";
};

const toEvent = (event: EventDetailResponse["event"]): Event => ({
  id: event.id,
  title: event.title,
  date: event.date ?? "",
  location: getLocationText(event.location),
  details: event.description ?? "",
  participantCount: event.members.length,
  participationUrl: event.inviteUrl ?? "",
});

const toScheduleCandidate = (
  candidate: EventDetailResponse["candidates"][number],
): ScheduleCandidate => ({
  id: candidate.id,
  title: candidate.title,
  time: formatTime(candidate.startAt),
  location: getLocationText(candidate.location),
  status: candidate.status,
  commentCount: candidate.commentCount,
  likeCount: candidate.likeCount,
});

export async function getEventDetail(
  eventId: string,
  eventMemberId: string,
): Promise<EventDetail> {
  const response = await apiClient<EventDetailResponse>(
    `/api/events/${encodeURIComponent(eventId)}`,
    {
      headers: {
        "x-event-member-id": eventMemberId,
      },
    },
  );

  return {
    event: toEvent(response.event),
    candidates: response.candidates
      .map(toScheduleCandidate)
      .sort((left, right) => left.time.localeCompare(right.time)),
  };
}
