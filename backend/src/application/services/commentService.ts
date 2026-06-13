import { ApplicationError } from "../errors/applicationError.js";
import type {
  CommentCandidate,
  CommentEventMember,
  CommentLikeState,
  CommentRecord,
  CommentRecordWithEvent,
  CommentRepository,
} from "../../domain/repositories/commentRepository.js";

export type CommentDto = {
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

export type CommentLikeDto = {
  commentId: string;
  likedByMe: boolean;
  likeCount: number;
};

export class CommentService {
  constructor(private readonly commentRepository: CommentRepository) {}

  async listComments(input: {
    eventId: bigint;
    candidateId: bigint;
    currentMemberId: bigint;
  }) {
    const currentMember = await this.resolveCurrentMember(
      input.currentMemberId,
    );
    const candidate = await this.resolveCandidateInEvent(
      input.eventId,
      input.candidateId,
    );
    this.assertMemberBelongsToEvent(currentMember, candidate.eventId);

    const comments = await this.commentRepository.findCommentsByCandidateId(
      candidate.id,
      currentMember.id,
    );

    return comments.map((comment) => this.toCommentDto(comment));
  }

  async createComment(input: {
    eventId: bigint;
    candidateId: bigint;
    currentMemberId: bigint;
    body: string;
  }) {
    const currentMember = await this.resolveCurrentMember(
      input.currentMemberId,
    );
    const candidate = await this.resolveCandidateInEvent(
      input.eventId,
      input.candidateId,
    );
    this.assertMemberBelongsToEvent(currentMember, candidate.eventId);

    const comment = await this.commentRepository.createComment({
      candidateId: candidate.id,
      eventMemberId: currentMember.id,
      body: input.body.trim(),
    });

    return this.toCommentDto(comment);
  }

  async deleteComment(input: {
    commentId: bigint;
    currentMemberId: bigint;
  }) {
    const currentMember = await this.resolveCurrentMember(
      input.currentMemberId,
    );
    const comment = await this.resolveComment(
      input.commentId,
      currentMember.id,
    );

    this.assertMemberBelongsToEvent(currentMember, comment.eventId);
    this.assertCanDeleteComment(currentMember, comment);

    await this.commentRepository.deleteCommentById(comment.id);
  }

  async likeComment(input: {
    commentId: bigint;
    currentMemberId: bigint;
  }) {
    const currentMember = await this.resolveCurrentMember(
      input.currentMemberId,
    );
    const comment = await this.resolveComment(
      input.commentId,
      currentMember.id,
    );

    this.assertMemberBelongsToEvent(currentMember, comment.eventId);

    const likeState = await this.commentRepository.likeComment({
      commentId: comment.id,
      eventMemberId: currentMember.id,
    });
    if (likeState === null) {
      throw new ApplicationError("NOT_FOUND", "データが存在しません");
    }

    return this.toCommentLikeDto(likeState);
  }

  async unlikeComment(input: {
    commentId: bigint;
    currentMemberId: bigint;
  }) {
    const currentMember = await this.resolveCurrentMember(
      input.currentMemberId,
    );
    const comment = await this.resolveComment(
      input.commentId,
      currentMember.id,
    );

    this.assertMemberBelongsToEvent(currentMember, comment.eventId);

    const likeState = await this.commentRepository.unlikeComment({
      commentId: comment.id,
      eventMemberId: currentMember.id,
    });
    if (likeState === null) {
      throw new ApplicationError("NOT_FOUND", "データが存在しません");
    }

    return this.toCommentLikeDto(likeState);
  }

  private async resolveCurrentMember(currentMemberId: bigint) {
    const currentMember =
      await this.commentRepository.findEventMemberById(currentMemberId);
    if (currentMember === null) {
      throw new ApplicationError("UNAUTHORIZED", "認証が必要です");
    }

    return currentMember;
  }

  private assertMemberBelongsToEvent(
    currentMember: CommentEventMember,
    eventId: bigint,
  ) {
    if (currentMember.eventId !== eventId) {
      throw new ApplicationError(
        "FORBIDDEN",
        "この操作を行う権限がありません",
      );
    }
  }

  protected async resolveCurrentMemberForEvent(
    eventId: bigint,
    currentMemberId: bigint,
  ) {
    const currentMember = await this.resolveCurrentMember(currentMemberId);
    this.assertMemberBelongsToEvent(currentMember, eventId);
    return currentMember;
  }

  private async resolveCandidateInEvent(eventId: bigint, candidateId: bigint) {
    const event = await this.commentRepository.findEventById(eventId);
    if (event === null) {
      throw new ApplicationError("NOT_FOUND", "データが存在しません");
    }

    const candidate = await this.commentRepository.findCandidateById(
      candidateId,
    );
    if (candidate === null || candidate.eventId !== event.id) {
      throw new ApplicationError("NOT_FOUND", "データが存在しません");
    }

    return candidate satisfies CommentCandidate;
  }

  private async resolveComment(commentId: bigint, currentMemberId: bigint) {
    const comment = await this.commentRepository.findCommentById(
      commentId,
      currentMemberId,
    );
    if (comment === null) {
      throw new ApplicationError("NOT_FOUND", "データが存在しません");
    }

    return comment;
  }

  private assertCanDeleteComment(
    currentMember: CommentEventMember,
    comment: CommentRecordWithEvent,
  ) {
    if (
      currentMember.id !== comment.eventMemberId &&
      currentMember.role !== "OWNER"
    ) {
      throw new ApplicationError(
        "FORBIDDEN",
        "この操作を行う権限がありません",
      );
    }
  }

  private toCommentDto(comment: CommentRecord): CommentDto {
    return {
      id: comment.id.toString(),
      candidateId: comment.candidateId.toString(),
      body: comment.body,
      authorMember: {
        id: comment.authorMember.id.toString(),
        displayName: comment.authorMember.displayName,
        memberType: comment.authorMember.userId === null ? "guest" : "user",
      },
      likeCount: comment.likeCount,
      likedByMe: comment.likedByCurrentMember,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
    };
  }

  private toCommentLikeDto(likeState: CommentLikeState): CommentLikeDto {
    return {
      commentId: likeState.commentId.toString(),
      likedByMe: likeState.likedByCurrentMember,
      likeCount: likeState.likeCount,
    };
  }
}
