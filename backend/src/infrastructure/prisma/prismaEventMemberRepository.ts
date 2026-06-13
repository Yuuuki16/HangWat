import type { PrismaClient } from "@prisma/client";

import type {
  CurrentEventMember,
  EventMemberRecord,
  EventMemberRepository,
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
}
