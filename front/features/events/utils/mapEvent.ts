import type { EventListItemApi } from "@/features/events/services/eventApi";
import type { Event } from "@/features/events/types/event";

export function mapEventListItem(item: EventListItemApi): Event {
  return {
    id: item.id,
    title: item.title,
    date: item.date ?? "",
    location: item.location?.name ?? "",
    details: "",
    participantCount: item.memberCount,
    participationUrl: "",
    myRole: "member",
  };
}
