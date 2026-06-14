import { InviteEventView } from "@/features/events/components/inviteEventView";

type InviteEventPageProps = {
  params: Promise<{
    inviteToken: string;
  }>;
};

export default async function InviteEventPage({
  params,
}: InviteEventPageProps) {
  const { inviteToken } = await params;

  return <InviteEventView inviteToken={inviteToken} />;
}
