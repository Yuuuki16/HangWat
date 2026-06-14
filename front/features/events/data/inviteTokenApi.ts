import { apiClient } from "@/lib/apiClient";

export async function createInviteToken(
  eventId: string,
  memberId: string,
): Promise<{ inviteUrl: string }> {
  return apiClient<{ inviteUrl: string }>(
    `/api/events/${encodeURIComponent(eventId)}/invite-tokens`,
    {
      method: "POST",
      headers: { "x-event-member-id": memberId },
      body: {
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    },
  );
}
