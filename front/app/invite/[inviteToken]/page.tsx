import { notFound } from "next/navigation";
import { InviteEventView } from "@/features/events/components/inviteEventView";
import { mockEvents } from "@/features/events/data/mockEvents";

type InviteEventPageProps = {
  params: Promise<{
    inviteToken: string;
  }>;
};

export default async function InviteEventPage({
  params,
}: InviteEventPageProps) {
  const { inviteToken } = await params;
  const event = mockEvents.find(
    (mockEvent) =>
      mockEvent.id === inviteToken ||
      mockEvent.participationUrl.endsWith(`/${inviteToken}`),
  );

  if (!event) {
    notFound();
  }

  return <InviteEventView event={event} />;
}
