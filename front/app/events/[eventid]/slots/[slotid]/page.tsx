import { CandidateThread } from "@/features/events/components/candidateThread";

type TimeSlotCommentPageProps = {
  params: Promise<{
    eventid: string;
    slotid: string;
  }>;
};

export default async function TimeSlotCommentPage({
  params,
}: TimeSlotCommentPageProps) {
  const { eventid, slotid } = await params;

  return <CandidateThread eventId={eventid} candidateId={slotid} />;
}
