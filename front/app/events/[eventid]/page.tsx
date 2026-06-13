import { notFound } from "next/navigation";
import { EventDetail } from "@/features/events/components/eventDetail";
import { mockEvents } from "@/features/events/data/mockEvents";

type EventTimelinePageProps = {
  params: Promise<{
    eventid: string;
  }>;
};

export default async function EventTimelinePage({
  params,
}: EventTimelinePageProps) {
  const { eventid } = await params;
  const event = mockEvents.find((mockEvent) => mockEvent.id === eventid);

  if (!event) {
    notFound();
  }

  return <EventDetail initialEvent={event} />;
}
