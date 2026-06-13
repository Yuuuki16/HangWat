export type CommentEventMemberRole = "OWNER" | "MEMBER";

export type CommentEventMember = {
  id: bigint;
  eventId: bigint;
  userId: bigint | null;
  displayName: string;
  role: CommentEventMemberRole;
};

export type CommentEvent = {
  id: bigint;
};

export type CommentCandidate = {
  id: bigint;
  eventId: bigint;
};

export type CommentAuthorMember = {
  id: bigint;
  userId: bigint | null;
  displayName: string;
};

export type CommentRecord = {
  id: bigint;
  candidateId: bigint;
  eventMemberId: bigint;
  body: string;
  authorMember: CommentAuthorMember;
  likeCount: number;
  likedByCurrentMember: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export interface CommentRepository {
  findEventMemberById(eventMemberId: bigint): Promise<CommentEventMember | null>;
  findEventById(eventId: bigint): Promise<CommentEvent | null>;
  findCandidateById(candidateId: bigint): Promise<CommentCandidate | null>;
  findCommentsByCandidateId(
    candidateId: bigint,
    currentMemberId: bigint,
  ): Promise<CommentRecord[]>;
  createComment(input: {
    candidateId: bigint;
    eventMemberId: bigint;
    body: string;
  }): Promise<CommentRecord>;
}
