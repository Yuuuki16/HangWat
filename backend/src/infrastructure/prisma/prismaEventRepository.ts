import type { PrismaClient } from "@prisma/client";

import {
  EventUserNotFoundError,
} from "../../domain/repositories/eventRepository.js";
import type {
  EventCandidateRecord,
  EventCreateInput,
  EventCreatedRecord,
  EventDetailRecord,
  EventListRecord,
  EventLocationRecord,
  EventMemberRecord,
  EventRepository,
  EventUpdateInput,
  EventUpdatedRecord,
} from "../../domain/repositories/eventRepository.js";

type DecimalLike = {
  toNumber(): number;
};

type PrismaLocation = {
  name: string;
  address: string | null;
  googlePlaceId: string | null;
  latitude: DecimalLike | null;
  longitude: DecimalLike | null;
  googleMapsUrl: string | null;
};

type PrismaMember = {
  id: bigint;
  eventId: bigint;
  userId: bigint | null;
  displayName: string;
  role: "OWNER" | "MEMBER";
  user: {
    id: bigint;
    name: string;
    avatarUrl: string | null;
  } | null;
};

type PrismaCandidate = {
  id: bigint;
  eventId: bigint;
  title: string;
  startsAt: Date;
  endsAt: Date | null;
  location: PrismaLocation | null;
  description: string | null;
  status: "PROPOSED" | "CONFIRMED" | "REJECTED";
  createdByMember: PrismaMember;
  _count: {
    comments: number;
  };
  createdAt: Date;
  updatedAt: Date;
};

type PrismaEventDetail = {
  id: bigint;
  title: string;
  eventDate: Date | null;
  location: PrismaLocation | null;
  description: string | null;
  inviteTokens: {
    inviteToken: string;
  }[];
  creator: {
    id: bigint;
    name: string;
    avatarUrl: string | null;
  };
  members: PrismaMember[];
  confirmedCandidateId: bigint | null;
  scheduleCandidates: PrismaCandidate[];
  createdAt: Date;
  updatedAt: Date;
};

export class PrismaEventRepository implements EventRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly frontendOrigin: string,
  ) {}

  async findUserById(userId: bigint) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true },
    });
  }

  async findEventsByUserId(userId: bigint): Promise<EventListRecord[]> {
    const events = await this.prisma.event.findMany({
      where: { members: { some: { userId } } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        eventDate: true,
        location: {
          select: this.locationSelect(),
        },
        _count: { select: { members: true } },
        confirmedCandidateId: true,
      },
    });

    return events.map((event) => ({
      id: event.id,
      title: event.title,
      eventDate: event.eventDate,
      location: this.toLocationRecord(event.location),
      memberCount: event._count.members,
      confirmedCandidateId: event.confirmedCandidateId,
    }));
  }


  async createEvent(input: EventCreateInput): Promise<EventCreatedRecord> {
    const result = await this.prisma.$transaction(async (tx) => {
      let locationId: bigint | null = null;
      if (input.location !== null) {
        const location = await tx.location.create({
          data: {
            name: input.location.name,
            address: input.location.address,
            googlePlaceId: input.location.googlePlaceId,
            latitude: input.location.latitude,
            longitude: input.location.longitude,
            googleMapsUrl: input.location.googleMapsUrl,
          },
        });
        locationId = location.id;
      }

      const event = await tx.event.create({
        data: {
          createdByUserId: input.userId,
          locationId,
          title: input.title,
          eventDate: input.eventDate,
          description: input.description,
        },
        select: {
          id: true,
          title: true,
          eventDate: true,
          description: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      const user = await tx.user.findUnique({
        where: { id: input.userId },
        select: { name: true },
      });
      if (user === null) throw new EventUserNotFoundError();

      const member = await tx.eventMember.create({
        data: {
          eventId: event.id,
          userId: input.userId,
          displayName: user.name,
          role: "OWNER",
        },
        select: this.memberSelect(),
      });

      return { event, member };
    });

    return {
      id: result.event.id,
      title: result.event.title,
      eventDate: result.event.eventDate,
      location: input.location,
      description: result.event.description,
      inviteUrl: null,
      confirmedCandidateId: null,
      myMember: this.toEventMemberRecord(result.member),
      createdAt: result.event.createdAt,
      updatedAt: result.event.updatedAt,
    };
  }

  async findEventMemberByUserAndEvent(
    eventId: bigint,
    userId: bigint,
  ): Promise<EventMemberRecord | null> {
    const member = await this.prisma.eventMember.findFirst({
      where: { eventId, userId },
      select: this.memberSelect(),
    });
    return member === null ? null : this.toEventMemberRecord(member);
  }

  async updateEvent(input: EventUpdateInput): Promise<EventUpdatedRecord> {
    return await this.prisma.$transaction(async (tx) => {
      let locationId: bigint | null = null;
      if (input.location !== null) {
        const location = await tx.location.create({
          data: {
            name: input.location.name,
            address: input.location.address,
            googlePlaceId: input.location.googlePlaceId,
            latitude: input.location.latitude,
            longitude: input.location.longitude,
            googleMapsUrl: input.location.googleMapsUrl,
          },
        });
        locationId = location.id;
      }

      const event = await tx.event.update({
        where: { id: input.eventId },
        data: {
          title: input.title,
          eventDate: input.eventDate,
          locationId,
          description: input.description,
        },
        select: {
          id: true,
          title: true,
          eventDate: true,
          location: { select: this.locationSelect() },
          description: true,
          updatedAt: true,
        },
      });

      return {
        id: event.id,
        title: event.title,
        eventDate: event.eventDate,
        location: this.toLocationRecord(event.location),
        description: event.description,
        updatedAt: event.updatedAt,
      };
    });
  }

  async findEventMemberById(eventMemberId: bigint) {
    const eventMember = await this.prisma.eventMember.findUnique({
      where: { id: eventMemberId },
      select: this.memberSelect(),
    });

    return eventMember === null ? null : this.toEventMemberRecord(eventMember);
  }

  async findEventDetailById(eventId: bigint) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        eventDate: true,
        location: { select: this.locationSelect() },
        description: true,
        inviteTokens: {
          where: {
            revokedAt: null,
            expiresAt: { gt: new Date() },
          },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { inviteToken: true },
        },
        creator: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        members: {
          orderBy: { createdAt: "asc" },
          select: this.memberSelect(),
        },
        confirmedCandidateId: true,
        scheduleCandidates: {
          orderBy: { startsAt: "asc" },
          select: {
            id: true,
            eventId: true,
            title: true,
            startsAt: true,
            endsAt: true,
            location: { select: this.locationSelect() },
            description: true,
            status: true,
            createdByMember: {
              select: this.memberSelect(),
            },
            _count: {
              select: { comments: true },
            },
            createdAt: true,
            updatedAt: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    return event === null ? null : this.toEventDetailRecord(event);
  }

  private memberSelect() {
    return {
      id: true,
      eventId: true,
      userId: true,
      displayName: true,
      role: true,
      user: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
        },
      },
    } as const;
  }

  private locationSelect() {
    return {
      name: true,
      address: true,
      googlePlaceId: true,
      latitude: true,
      longitude: true,
      googleMapsUrl: true,
    } as const;
  }

  private toEventDetailRecord(event: PrismaEventDetail): EventDetailRecord {
    return {
      id: event.id,
      title: event.title,
      eventDate: event.eventDate,
      location: this.toLocationRecord(event.location),
      description: event.description,
      inviteUrl:
        event.inviteTokens.length === 0
          ? null
          : `${this.frontendOrigin}/invite/${event.inviteTokens[0].inviteToken}`,
      createdBy: event.creator,
      members: event.members.map((member) => this.toEventMemberRecord(member)),
      confirmedCandidateId: event.confirmedCandidateId,
      candidates: event.scheduleCandidates.map((candidate) =>
        this.toCandidateRecord(candidate),
      ),
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    };
  }

  private toCandidateRecord(
    candidate: PrismaCandidate,
  ): EventCandidateRecord {
    return {
      id: candidate.id,
      eventId: candidate.eventId,
      title: candidate.title,
      startsAt: candidate.startsAt,
      endsAt: candidate.endsAt,
      location: this.toLocationRecord(candidate.location),
      description: candidate.description,
      status: candidate.status,
      createdByMember: this.toEventMemberRecord(candidate.createdByMember),
      commentCount: candidate._count.comments,
      likeCount: 0,
      createdAt: candidate.createdAt,
      updatedAt: candidate.updatedAt,
    };
  }

  private toEventMemberRecord(member: PrismaMember): EventMemberRecord {
    return {
      id: member.id,
      eventId: member.eventId,
      userId: member.userId,
      displayName: member.displayName,
      role: member.role,
      user: member.user,
    };
  }

  async deleteEvent(eventId: bigint): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // Comment likes → comments → candidates の順で削除
      const candidateIds = await tx.scheduleCandidate.findMany({
        where: { eventId },
        select: { id: true },
      });
      const candidateIdList = candidateIds.map((c) => c.id);

      if (candidateIdList.length > 0) {
        await tx.commentLike.deleteMany({
          where: { comment: { candidateId: { in: candidateIdList } } },
        });
        await tx.comment.deleteMany({
          where: { candidateId: { in: candidateIdList } },
        });
      }

      // confirmedCandidateId の参照を解除してから candidates 削除
      await tx.event.update({
        where: { id: eventId },
        data: { confirmedCandidateId: null },
      });
      await tx.scheduleCandidate.deleteMany({ where: { eventId } });

      // EventMember 関連を削除
      const memberIds = await tx.eventMember.findMany({
        where: { eventId },
        select: { id: true },
      });
      const memberIdList = memberIds.map((m) => m.id);

      if (memberIdList.length > 0) {
        await tx.eventMemberSession.deleteMany({
          where: { eventMemberId: { in: memberIdList } },
        });
      }
      await tx.eventMember.deleteMany({ where: { eventId } });

      await tx.eventInviteToken.deleteMany({ where: { eventId } });
      await tx.event.delete({ where: { id: eventId } });
    });
  }

  private toLocationRecord(
    location: PrismaLocation | null,
  ): EventLocationRecord | null {
    if (location === null) {
      return null;
    }

    return {
      name: location.name,
      address: location.address,
      googlePlaceId: location.googlePlaceId,
      latitude: location.latitude?.toNumber() ?? null,
      longitude: location.longitude?.toNumber() ?? null,
      googleMapsUrl: location.googleMapsUrl,
    };
  }
}
