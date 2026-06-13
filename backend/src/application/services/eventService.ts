import { ApplicationError } from "../errors/applicationError.js";
import type {
  EventListRecord,
  EventLocationRecord,
  EventRepository,
} from "../../domain/repositories/eventRepository.js";

type LocationDto = {
  name: string | null;
  address: string | null;
  googlePlaceId: string | null;
  latitude: number | null;
  longitude: number | null;
  googleMapsUrl: string | null;
};

export type EventListItemDto = {
  id: string;
  title: string;
  date: string | null;
  location: LocationDto | null;
  memberCount: number;
  isConfirmed: boolean;
};

export class EventService {
  constructor(private readonly eventRepository: EventRepository) {}

  async listEvents(input: {
    userId: bigint;
  }): Promise<{ events: EventListItemDto[] }> {
    const user = await this.eventRepository.findUserById(input.userId);
    if (user === null) {
      throw new ApplicationError("UNAUTHORIZED", "認証が必要です");
    }

    const events = await this.eventRepository.findEventsByUserId(input.userId);
    return { events: events.map((event) => this.toEventListItemDto(event)) };
  }

  private toEventListItemDto(event: EventListRecord): EventListItemDto {
    return {
      id: event.id.toString(),
      title: event.title,
      date:
        event.eventDate === null
          ? null
          : event.eventDate.toISOString().slice(0, 10),
      location: toLocationDto(event.location),
      memberCount: event.memberCount,
      isConfirmed: event.confirmedCandidateId !== null,
    };
  }
}

function toLocationDto(
  location: EventLocationRecord | null,
): LocationDto | null {
  return location;
}
