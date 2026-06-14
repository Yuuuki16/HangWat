import type { PrismaClient } from "@prisma/client";

import type {
  InviteTokenEventMember,
  InviteTokenRecord,
  InviteTokenRepository,
} from "../../domain/repositories/inviteTokenRepository.js";

export class PrismaInviteTokenRepository implements InviteTokenRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findEventMemberById(
    id: bigint,
  ): Promise<InviteTokenEventMember | null> {
    return this.prisma.eventMember.findUnique({
      where: { id },
      select: { id: true, eventId: true, role: true },
    });
  }

  async findEventById(id: bigint): Promise<{ id: bigint } | null> {
    return this.prisma.event.findUnique({
      where: { id },
      select: { id: true },
    });
  }

  async createInviteToken(input: {
    eventId: bigint;
    inviteToken: string;
    expiresAt: Date;
  }): Promise<InviteTokenRecord> {
    return this.prisma.eventInviteToken.create({
      data: {
        eventId: input.eventId,
        inviteToken: input.inviteToken,
        expiresAt: input.expiresAt,
      },
      select: {
        id: true,
        eventId: true,
        inviteToken: true,
        expiresAt: true,
        revokedAt: true,
        createdAt: true,
      },
    });
  }

  async findInviteTokenById(id: bigint): Promise<InviteTokenRecord | null> {
    return this.prisma.eventInviteToken.findUnique({
      where: { id },
      select: {
        id: true,
        eventId: true,
        inviteToken: true,
        expiresAt: true,
        revokedAt: true,
        createdAt: true,
      },
    });
  }

  async revokeInviteToken(id: bigint, revokedAt: Date): Promise<void> {
    await this.prisma.eventInviteToken.update({
      where: { id },
      data: { revokedAt },
    });
  }
}
