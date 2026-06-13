import { Prisma, type PrismaClient } from "@prisma/client";

import type {
  CommentCandidate,
  CommentEvent,
  CommentEventMember,
  CommentLikeState,
  CommentRecord,
  CommentRecordWithEvent,
  CommentRepository,
} from "../../domain/repositories/commentRepository.js";

type PrismaCommentForResponse = {
  id: bigint;
  candidateId: bigint;
  eventMemberId: bigint;
  body: string;
  eventMember: {
    id: bigint;
    userId: bigint | null;
    displayName: string;
  };
  likes: { id: bigint }[];
  _count: {
    likes: number;
  };
  createdAt: Date;
  updatedAt: Date;
};

type PrismaCommentWithEvent = PrismaCommentForResponse & {
  candidate: {
    eventId: bigint;
  };
};

export class PrismaCommentRepository implements CommentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findEventMemberById(eventMemberId: bigint) {
    const eventMember = await this.prisma.eventMember.findUnique({
      where: { id: eventMemberId },
      select: {
        id: true,
        eventId: true,
        userId: true,
        displayName: true,
        role: true,
      },
    });

    return eventMember satisfies CommentEventMember | null;
  }

  async findEventById(eventId: bigint) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true },
    });

    return event satisfies CommentEvent | null;
  }

  async findCandidateById(candidateId: bigint) {
    const candidate = await this.prisma.scheduleCandidate.findUnique({
      where: { id: candidateId },
      select: { id: true, eventId: true },
    });

    return candidate satisfies CommentCandidate | null;
  }

  async findCommentsByCandidateId(
    candidateId: bigint,
    currentMemberId: bigint,
  ) {
    const comments = await this.prisma.comment.findMany({
      where: { candidateId },
      orderBy: { createdAt: "asc" },
      select: this.commentResponseSelect(currentMemberId),
    });

    return comments.map((comment) => this.toCommentRecord(comment));
  }

  async createComment(input: {
    candidateId: bigint;
    eventMemberId: bigint;
    body: string;
  }) {
    const comment = await this.prisma.comment.create({
      data: input,
      select: this.commentResponseSelect(input.eventMemberId),
    });

    return this.toCommentRecord(comment);
  }

  async findCommentById(commentId: bigint, currentMemberId: bigint) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      select: {
        ...this.commentResponseSelect(currentMemberId),
        candidate: {
          select: { eventId: true },
        },
      },
    });

    if (comment === null) {
      return null;
    }

    return this.toCommentRecordWithEvent(comment);
  }

  async likeComment(input: { commentId: bigint; eventMemberId: bigint }) {
    try {
      await this.prisma.commentLike.upsert({
        where: {
          commentId_eventMemberId: {
            commentId: input.commentId,
            eventMemberId: input.eventMemberId,
          },
        },
        create: input,
        update: {},
      });
    } catch (error) {
      if (isMissingCommentLikeTargetError(error)) {
        return null;
      }

      throw error;
    }

    return this.findCommentLikeState(input.commentId, input.eventMemberId);
  }

  async unlikeComment(input: { commentId: bigint; eventMemberId: bigint }) {
    await this.prisma.commentLike.deleteMany({
      where: {
        commentId: input.commentId,
        eventMemberId: input.eventMemberId,
      },
    });

    return this.findCommentLikeState(input.commentId, input.eventMemberId);
  }

  async deleteCommentById(commentId: bigint) {
    await this.prisma.$transaction([
      this.prisma.commentLike.deleteMany({ where: { commentId } }),
      this.prisma.comment.delete({ where: { id: commentId } }),
    ]);
  }

  private commentResponseSelect(currentMemberId: bigint) {
    return {
      id: true,
      candidateId: true,
      eventMemberId: true,
      body: true,
      eventMember: {
        select: {
          id: true,
          userId: true,
          displayName: true,
        },
      },
      likes: {
        where: { eventMemberId: currentMemberId },
        select: { id: true },
        take: 1,
      },
      _count: {
        select: { likes: true },
      },
      createdAt: true,
      updatedAt: true,
    } as const;
  }

  private async findCommentLikeState(
    commentId: bigint,
    currentMemberId: bigint,
  ): Promise<CommentLikeState | null> {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      select: {
        id: true,
        likes: {
          where: { eventMemberId: currentMemberId },
          select: { id: true },
          take: 1,
        },
        _count: {
          select: { likes: true },
        },
      },
    });
    if (comment === null) {
      return null;
    }

    return {
      commentId: comment.id,
      likedByCurrentMember: comment.likes.length > 0,
      likeCount: comment._count.likes,
    };
  }

  private toCommentRecord(comment: PrismaCommentForResponse): CommentRecord {
    return {
      id: comment.id,
      candidateId: comment.candidateId,
      eventMemberId: comment.eventMemberId,
      body: comment.body,
      authorMember: {
        id: comment.eventMember.id,
        userId: comment.eventMember.userId,
        displayName: comment.eventMember.displayName,
      },
      likeCount: comment._count.likes,
      likedByCurrentMember: comment.likes.length > 0,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    };
  }

  private toCommentRecordWithEvent(
    comment: PrismaCommentWithEvent,
  ): CommentRecordWithEvent {
    return {
      ...this.toCommentRecord(comment),
      eventId: comment.candidate.eventId,
    };
  }
}

function isMissingCommentLikeTargetError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P2003" || error.code === "P2025")
  );
}
