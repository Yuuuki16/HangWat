export type InviteTokenRecord = {
  id: bigint;
  eventId: bigint;
  inviteToken: string;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
};

export type InviteTokenEventMember = {
  id: bigint;
  eventId: bigint;
  role: "OWNER" | "MEMBER";
};

export interface InviteTokenRepository {
  findEventMemberById(id: bigint): Promise<InviteTokenEventMember | null>;
  findEventById(id: bigint): Promise<{ id: bigint } | null>;
  createInviteToken(input: {
    eventId: bigint;
    inviteToken: string;
    expiresAt: Date;
  }): Promise<InviteTokenRecord>;
  findInviteTokenById(
    id: bigint,
  ): Promise<InviteTokenRecord | null>;
  revokeInviteToken(id: bigint, revokedAt: Date): Promise<void>;
}
