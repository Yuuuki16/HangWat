import type { PrismaClient } from "@prisma/client";

import type {
  CommentCandidate,
  CommentEvent,
  CommentEventMember,
  CommentRecord,
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
}
