import { apiClient } from "@/lib/apiClient";
import type { EventMember } from "@/features/events/types/eventMember";

type EventMemberResponse = {
  eventMember: EventMember;
};

type EventMembersResponse = {
  members: EventMember[];
};

const eventMemberHeaders = (eventMemberId: string) => ({
  "x-event-member-id": eventMemberId,
});

export async function getEventMembers(
  eventId: string,
  eventMemberId: string,
): Promise<EventMember[]> {
  const response = await apiClient<EventMembersResponse>(
    `/api/events/${encodeURIComponent(eventId)}/members`,
    {
      headers: eventMemberHeaders(eventMemberId),
    },
  );

  return response.members;
}

export async function getMyEventMember(
  eventId: string,
  eventMemberId: string,
): Promise<EventMember> {
  const response = await apiClient<EventMemberResponse>(
    `/api/events/${encodeURIComponent(eventId)}/me/member`,
    {
      headers: eventMemberHeaders(eventMemberId),
    },
  );

  return response.eventMember;
}

export async function updateEventMemberDisplayName(input: {
  eventId: string;
  memberId: string;
  currentMemberId: string;
  displayName: string;
}): Promise<EventMember> {
  const response = await apiClient<EventMemberResponse>(
    `/api/events/${encodeURIComponent(input.eventId)}/members/${encodeURIComponent(
      input.memberId,
    )}`,
    {
      method: "PATCH",
      headers: eventMemberHeaders(input.currentMemberId),
      body: {
        displayName: input.displayName,
      },
    },
  );

  return response.eventMember;
}

export async function deleteEventMember(input: {
  eventId: string;
  memberId: string;
  currentMemberId: string;
}): Promise<void> {
  await apiClient<{ message: string }>(
    `/api/events/${encodeURIComponent(input.eventId)}/members/${encodeURIComponent(
      input.memberId,
    )}`,
    {
      method: "DELETE",
      headers: eventMemberHeaders(input.currentMemberId),
    },
  );
}
