export type InviteJoinLocationRecord = {
  name: string;
  address: string | null;
  googlePlaceId: string | null;
  latitude: number | null;
  longitude: number | null;
  googleMapsUrl: string | null;
};

export type InviteJoinTokenRecord = {
  inviteToken: string;
  eventId: bigint;
  expiresAt: Date;
  revokedAt: Date | null;
  event: {
    id: bigint;
    title: string;
    eventDate: Date | null;
    description: string | null;
    location: InviteJoinLocationRecord | null;
  };
};

export type InviteJoinEventMemberRecord = {
  id: bigint;
  eventId: bigint;
  userId: bigint | null;
  displayName: string;
  role: "OWNER" | "MEMBER";
  createdAt: Date;
  updatedAt: Date;
};

export type InviteJoinMemberSessionRecord = {
  eventMember: InviteJoinEventMemberRecord;
  expiresAt: Date;
  revokedAt: Date | null;
};

export interface InviteJoinRepository {
  findInviteToken(inviteToken: string): Promise<InviteJoinTokenRecord | null>;
  isDisplayNameTaken(eventId: bigint, displayName: string): Promise<boolean>;
  createGuestMemberWithSession(input: {
    eventId: bigint;
    displayName: string;
    sessionTokenHash: string;
    sessionExpiresAt: Date;
  }): Promise<{
    eventMember: InviteJoinEventMemberRecord;
    memberSession: { expiresAt: Date };
  }>;
  findMemberSessionByTokenHash(
    sessionTokenHash: string,
  ): Promise<InviteJoinMemberSessionRecord | null>;
  updateMemberSessionLastUsedAt(
    sessionTokenHash: string,
    lastUsedAt: Date,
  ): Promise<void>;
}
