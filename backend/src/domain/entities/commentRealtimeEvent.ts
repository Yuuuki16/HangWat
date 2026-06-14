import type { CommentDto } from "../../application/services/commentService.js";

export type CommentRealtimeEvent =
  | {
      type: "comment.created";
      eventId: string;
      candidateId: string;
      comment: CommentDto;
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
