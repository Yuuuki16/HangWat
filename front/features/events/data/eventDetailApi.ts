import { apiClient } from "@/lib/apiClient";
import {
  getLocationText,
  toScheduleCandidate,
  type ApiScheduleCandidate,
} from "@/features/events/data/scheduleCandidateApi";
import type { Event } from "@/features/events/types/event";
import type { EventLocation } from "@/features/events/types/location";
import type { ScheduleCandidate } from "@/features/events/types/scheduleCandidate";

type EventDetailResponse = {
  event: {
    id: string;
    title: string;
    date: string | null;
    location: EventLocation;
    description: string | null;
    inviteUrl: string | null;
    members: unknown[];
  };
  candidates: ApiScheduleCandidate[];
};

type EventDetail = {
  event: Event;
  candidates: ScheduleCandidate[];
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
      .slice()
      .sort(
        (left, right) =>
          new Date(left.startAt).getTime() - new Date(right.startAt).getTime(),
      )
      .map(toScheduleCandidate),
  };
}
