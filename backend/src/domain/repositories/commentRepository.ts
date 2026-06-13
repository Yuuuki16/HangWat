export type CommentEventMemberRole = "OWNER" | "MEMBER";

export type CommentEventMember = {
  id: bigint;
  eventId: bigint;
  userId: bigint | null;
  displayName: string;
  role: CommentEventMemberRole;
};

export interface CommentRepository {
  findEventMemberById(eventMemberId: bigint): Promise<CommentEventMember | null>;
}
