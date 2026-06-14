import type { PrismaClient } from "@prisma/client";

import type {
  CurrentEventMember,
  EventMemberRecord,
  EventMemberRepository,
  EventMemberTarget,
} from "../../domain/repositories/eventMemberRepository.js";

export class PrismaEventMemberRepository implements EventMemberRepository {
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

    return eventMember satisfies CurrentEventMember | null;
  }

  async findEventById(eventId: bigint) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true },
    });

    return event;
  }

  async findMembersByEventId(eventId: bigint): Promise<EventMemberRecord[]> {
    const members = await this.prisma.eventMember.findMany({
      where: { eventId },
      orderBy: { createdAt: "asc" },
      select: {
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
      },
    });

    return members;
  }

  async findMemberInEvent(
    eventId: bigint,
    memberId: bigint,
  ): Promise<EventMemberTarget | null> {
    const member = await this.prisma.eventMember.findFirst({
      where: { id: memberId, eventId },
      select: {
        id: true,
        eventId: true,
        userId: true,
        displayName: true,
        role: true,
        updatedAt: true,
      },
    });

    return member;
  }

  async isDisplayNameTaken(
    eventId: bigint,
    displayName: string,
    excludeMemberId: bigint,
  ): Promise<boolean> {
    const existing = await this.prisma.eventMember.findFirst({
      where: {
        eventId,
        displayName,
        id: { not: excludeMemberId },
      },
      select: { id: true },
    });

    return existing !== null;
  }

  async updateDisplayName(
    memberId: bigint,
    displayName: string,
  ): Promise<EventMemberTarget> {
    return await this.prisma.eventMember.update({
      where: { id: memberId },
      data: { displayName },
      select: {
        id: true,
        eventId: true,
        userId: true,
        displayName: true,
        role: true,
        updatedAt: true,
      },
    });
  }

  async deleteEventMember(memberId: bigint): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.eventMemberSession.deleteMany({
        where: { eventMemberId: memberId },
      });
      await tx.eventMember.delete({ where: { id: memberId } });
    });
  }
}
