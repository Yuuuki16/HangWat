export type CommentPayload = {
  id: string;
  candidateId: string;
  body: string;
  authorMember: {
    id: string;
    displayName: string;
    memberType: "user" | "guest";
  };
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
      comment: CommentPayload;
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
