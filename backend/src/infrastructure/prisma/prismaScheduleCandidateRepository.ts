import { Prisma, type PrismaClient } from "@prisma/client";

import type {
  ScheduleCandidateEvent,
  ScheduleCandidateEventMember,
  ScheduleCandidateLocationInput,
  ScheduleCandidateRecord,
  ScheduleCandidateRepository,
} from "../../domain/repositories/scheduleCandidateRepository.js";

type PrismaScheduleCandidateForResponse = {
  id: bigint;
  eventId: bigint;
  createdByMemberId: bigint;
  title: string;
  startsAt: Date;
  endsAt: Date | null;
  location: {
    id: bigint;
    name: string;
    address: string | null;
    googlePlaceId: string | null;
    latitude: Prisma.Decimal | null;
    longitude: Prisma.Decimal | null;
    googleMapsUrl: string | null;
  } | null;
  description: string | null;
  status: "PROPOSED" | "CONFIRMED" | "REJECTED";
  createdByMember: {
    id: bigint;
    userId: bigint | null;
    displayName: string;
  };
  _count: {
    comments: number;
  };
  createdAt: Date;
  updatedAt: Date;
};

export class PrismaScheduleCandidateRepository
  implements ScheduleCandidateRepository
{
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

    return eventMember satisfies ScheduleCandidateEventMember | null;
  }

  async findEventById(eventId: bigint) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, confirmedCandidateId: true },
    });

    return event satisfies ScheduleCandidateEvent | null;
  }

  async findScheduleCandidateById(candidateId: bigint) {
    const candidate = await this.prisma.scheduleCandidate.findUnique({
      where: { id: candidateId },
      select: this.scheduleCandidateResponseSelect(),
    });

    return candidate === null ? null : this.toScheduleCandidateRecord(candidate);
  }

  async createScheduleCandidate(input: {
    eventId: bigint;
    createdByMemberId: bigint;
    title: string;
    startsAt: Date;
    endsAt: Date | null;
    location: ScheduleCandidateLocationInput | null;
    description: string | null;
  }) {
    const candidate = await this.prisma.$transaction(async (tx) => {
      const location =
        input.location === null
          ? null
          : await tx.location.create({
              data: {
                name: input.location.name,
                address: input.location.address,
                googlePlaceId: input.location.googlePlaceId,
                googleMapsUrl: input.location.googleMapsUrl,
                latitude:
                  input.location.latitude === null
                    ? null
                    : new Prisma.Decimal(input.location.latitude),
                longitude:
                  input.location.longitude === null
                    ? null
                    : new Prisma.Decimal(input.location.longitude),
              },
              select: { id: true },
            });

      return tx.scheduleCandidate.create({
        data: {
          eventId: input.eventId,
          createdByMemberId: input.createdByMemberId,
          locationId: location?.id ?? null,
          title: input.title,
          description: input.description,
          startsAt: input.startsAt,
          endsAt: input.endsAt,
          status: "PROPOSED",
        },
        select: this.scheduleCandidateResponseSelect(),
      });
    });

    return this.toScheduleCandidateRecord(candidate);
  }

  async updateScheduleCandidate(input: {
    candidateId: bigint;
    title: string;
    startsAt: Date;
    endsAt: Date | null;
    location: ScheduleCandidateLocationInput | null;
    description: string | null;
  }) {
    const candidate = await this.prisma.$transaction(async (tx) => {
      const location =
        input.location === null
          ? null
          : await tx.location.create({
              data: {
                name: input.location.name,
                address: input.location.address,
                googlePlaceId: input.location.googlePlaceId,
                googleMapsUrl: input.location.googleMapsUrl,
                latitude:
                  input.location.latitude === null
                    ? null
                    : new Prisma.Decimal(input.location.latitude),
                longitude:
                  input.location.longitude === null
                    ? null
                    : new Prisma.Decimal(input.location.longitude),
              },
              select: { id: true },
            });

      return tx.scheduleCandidate.update({
        where: { id: input.candidateId },
        data: {
          locationId: location?.id ?? null,
          title: input.title,
          description: input.description,
          startsAt: input.startsAt,
          endsAt: input.endsAt,
        },
        select: this.scheduleCandidateResponseSelect(),
      });
    });

    return this.toScheduleCandidateRecord(candidate);
  }

  async deleteScheduleCandidateById(candidateId: bigint) {
    await this.prisma.$transaction(async (tx) => {
      const comments = await tx.comment.findMany({
        where: { candidateId },
        select: { id: true },
      });
      const commentIds = comments.map((comment) => comment.id);

      await tx.commentLike.deleteMany({
        where: { commentId: { in: commentIds } },
      });
      await tx.comment.deleteMany({ where: { candidateId } });
      await tx.scheduleCandidate.deleteMany({ where: { id: candidateId } });
    });
  }

  private scheduleCandidateResponseSelect() {
    return {
      id: true,
      eventId: true,
      createdByMemberId: true,
      title: true,
      startsAt: true,
      endsAt: true,
      location: {
        select: {
          id: true,
          name: true,
          address: true,
          googlePlaceId: true,
          latitude: true,
          longitude: true,
          googleMapsUrl: true,
        },
      },
      description: true,
      status: true,
      createdByMember: {
        select: {
          id: true,
          userId: true,
          displayName: true,
        },
      },
      _count: {
        select: { comments: true },
      },
      createdAt: true,
      updatedAt: true,
    } as const;
  }

  private toScheduleCandidateRecord(
    candidate: PrismaScheduleCandidateForResponse,
  ): ScheduleCandidateRecord {
    return {
      id: candidate.id,
      eventId: candidate.eventId,
      createdByMemberId: candidate.createdByMemberId,
      title: candidate.title,
      startsAt: candidate.startsAt,
      endsAt: candidate.endsAt,
      location:
        candidate.location === null
          ? null
          : {
              id: candidate.location.id,
              name: candidate.location.name,
              address: candidate.location.address,
              googlePlaceId: candidate.location.googlePlaceId,
              latitude: candidate.location.latitude?.toNumber() ?? null,
              longitude: candidate.location.longitude?.toNumber() ?? null,
              googleMapsUrl: candidate.location.googleMapsUrl,
            },
      description: candidate.description,
      status: candidate.status,
      createdByMember: {
        id: candidate.createdByMember.id,
        userId: candidate.createdByMember.userId,
        displayName: candidate.createdByMember.displayName,
      },
      commentCount: candidate._count.comments,
      createdAt: candidate.createdAt,
      updatedAt: candidate.updatedAt,
    };
  }
}
