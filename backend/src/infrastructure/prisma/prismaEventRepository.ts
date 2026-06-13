import type { PrismaClient } from "@prisma/client";

import type {
  EventListRecord,
  EventLocationRecord,
  EventRepository,
} from "../../domain/repositories/eventRepository.js";

type DecimalLike = { toNumber(): number };

type PrismaLocation = {
  name: string;
  address: string | null;
  googlePlaceId: string | null;
  latitude: DecimalLike | null;
  longitude: DecimalLike | null;
  googleMapsUrl: string | null;
};

export class PrismaEventRepository implements EventRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findUserById(userId: bigint) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
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
          select: {
            name: true,
            address: true,
            googlePlaceId: true,
            latitude: true,
            longitude: true,
            googleMapsUrl: true,
          },
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

  private toLocationRecord(
    location: PrismaLocation | null,
  ): EventLocationRecord | null {
    if (location === null) return null;
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
