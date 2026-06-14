export type CommentAuthorMember = {
  id: string;
  displayName: string;
  memberType: "user" | "guest";
};

export type CommentForRealtime = {
  id: string;
  candidateId: string;
  body: string;
  authorMember: CommentAuthorMember;
  likeCount: number;
  likedByMe: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CommentRealtimeEvent =
  | {
      type: "comment.created";
      eventId: string;
      candidateId: string;
      comment: CommentForRealtime;
    }
  | {
      type: "comment.deleted";
      eventId: string;
      candidateId: string;
      commentId: string;
    }
  | {
      type: "comment.like.updated";
      eventId: string;
      candidateId: string;
      commentId: string;
      likeCount: number;
    };
