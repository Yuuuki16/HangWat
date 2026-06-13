import { ApplicationError } from "../errors/applicationError.js";
import type {
  CandidateStatus,
  EventCandidateRecord,
  EventDetailRecord,
  EventListRecord,
  EventLocationRecord,
  EventMemberRecord,
  EventRepository,
  EventUpdatedRecord,
} from "../../domain/repositories/eventRepository.js";
import { EventUserNotFoundError } from "../../domain/repositories/eventRepository.js";

export type EventCreatedDto = {
  event: {
    id: string;
    title: string;
    date: string | null;
    location: LocationDto | null;
    description: string | null;
    inviteUrl: null;
    confirmedCandidateId: null;
    myMember: EventMemberDto;
    createdAt: string;
    updatedAt: string;
  };
};

type LocationDto = {
  name: string;
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

type EventMemberDto = {
  id: string;
  eventId: string;
  userId: string | null;
  displayName: string;
  role: "owner" | "member";
  memberType: "user" | "guest";
  user: {
    id: string;
    name: string;
    avatarUrl: string | null;
  } | null;
};

export type EventDetailDto = {
  event: {
    id: string;
    title: string;
    date: string | null;
    location: LocationDto | null;
    description: string | null;
    inviteUrl: string | null;
    createdBy: {
      id: string;
      name: string;
      avatarUrl: string | null;
    };
    members: EventMemberDto[];
    myMember: EventMemberDto;
    confirmedCandidateId: string | null;
    createdAt: string;
    updatedAt: string;
  };
  candidates: {
    id: string;
    eventId: string;
    title: string;
    startAt: string;
    endAt: string | null;
    location: LocationDto | null;
    description: string | null;
    status: "pending" | "confirmed" | "cancelled";
    createdByMember: EventMemberDto;
    commentCount: number;
    likeCount: number;
    createdAt: string;
    updatedAt: string;
  }[];
};

export type EventUpdatedDto = {
  event: {
    id: string;
    title: string;
    date: string | null;
    location: LocationDto | null;
    description: string | null;
    updatedAt: string;
  };
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

  async createEvent(input: {
    userId: bigint;
    title: string;
    date: string | null;
    location: EventLocationRecord | null;
    description: string | null;
  }): Promise<EventCreatedDto> {
    const eventDate = input.date === null ? null : new Date(input.date);

    let event;
    try {
      event = await this.eventRepository.createEvent({
        userId: input.userId,
        title: input.title,
        eventDate,
        location: input.location,
        description: input.description,
      });
    } catch (error) {
      if (error instanceof EventUserNotFoundError) {
        throw new ApplicationError("UNAUTHORIZED", "認証が必要です");
      }
      throw error;
    }

    return {
      event: {
        id: event.id.toString(),
        title: event.title,
        date: event.eventDate === null ? null : formatDate(event.eventDate),
        location: toLocationDto(event.location),
        description: event.description,
        inviteUrl: null,
        confirmedCandidateId: null,
        myMember: toEventMemberDto(event.myMember),
        createdAt: event.createdAt.toISOString(),
        updatedAt: event.updatedAt.toISOString(),
      },
    };
  }

  async updateEvent(input: {
    userId: bigint;
    eventId: bigint;
    title: string;
    date: string | null;
    location: EventLocationRecord | null;
    description: string | null;
  }): Promise<EventUpdatedDto> {
    const event = await this.eventRepository.findEventDetailById(input.eventId);
    if (event === null) {
      throw new ApplicationError("NOT_FOUND", "イベントが存在しません");
    }

    const member = await this.eventRepository.findEventMemberByUserAndEvent(
      input.eventId,
      input.userId,
    );
    if (member === null || member.role !== "OWNER") {
      throw new ApplicationError("FORBIDDEN", "編集権限がありません");
    }

    const eventDate = input.date === null ? null : new Date(input.date);
    const updated = await this.eventRepository.updateEvent({
      eventId: input.eventId,
      title: input.title,
      eventDate,
      location: input.location,
      description: input.description,
    });

    return toEventUpdatedDto(updated);
  }

  async getEventDetail(input: {
    eventId: bigint;
    currentMemberId: bigint;
  }): Promise<EventDetailDto> {
    const currentMember = await this.eventRepository.findEventMemberById(
      input.currentMemberId,
    );
    if (currentMember === null) {
      throw new ApplicationError("UNAUTHORIZED", "認証が必要です");
    }

    const event = await this.eventRepository.findEventDetailById(input.eventId);
    if (event === null) {
      throw new ApplicationError("NOT_FOUND", "イベントが存在しません");
    }

    if (currentMember.eventId !== event.id) {
      throw new ApplicationError(
        "FORBIDDEN",
        "このイベントを参照する権限がありません",
      );
    }

    return this.toEventDetailDto(event, currentMember);
  }

  private toEventListItemDto(event: EventListRecord): EventListItemDto {
    return {
      id: event.id.toString(),
      title: event.title,
      date: event.eventDate === null ? null : formatDate(event.eventDate),
      location: toLocationDto(event.location),
      memberCount: event.memberCount,
      isConfirmed: event.confirmedCandidateId !== null,
    };
  }

  private toEventDetailDto(
    event: EventDetailRecord,
    currentMember: EventMemberRecord,
  ): EventDetailDto {
    return {
      event: {
        id: event.id.toString(),
        title: event.title,
        date: event.eventDate === null ? null : formatDate(event.eventDate),
        location: toLocationDto(event.location),
        description: event.description,
        inviteUrl: event.inviteUrl,
        createdBy: {
          id: event.createdBy.id.toString(),
          name: event.createdBy.name,
          avatarUrl: event.createdBy.avatarUrl,
        },
        members: event.members.map((member) => toEventMemberDto(member)),
        myMember: toEventMemberDto(currentMember),
        confirmedCandidateId:
          event.confirmedCandidateId === null
            ? null
            : event.confirmedCandidateId.toString(),
        createdAt: event.createdAt.toISOString(),
        updatedAt: event.updatedAt.toISOString(),
      },
      candidates: event.candidates.map((candidate) =>
        toCandidateDto(candidate),
      ),
    };
  }
}

function toEventUpdatedDto(record: EventUpdatedRecord): EventUpdatedDto {
  return {
    event: {
      id: record.id.toString(),
      title: record.title,
      date: record.eventDate === null ? null : formatDate(record.eventDate),
      location: toLocationDto(record.location),
      description: record.description,
      updatedAt: record.updatedAt.toISOString(),
    },
  };
}

function toCandidateDto(candidate: EventCandidateRecord) {
  return {
    id: candidate.id.toString(),
    eventId: candidate.eventId.toString(),
    title: candidate.title,
    startAt: candidate.startsAt.toISOString(),
    endAt: candidate.endsAt === null ? null : candidate.endsAt.toISOString(),
    location: toLocationDto(candidate.location),
    description: candidate.description,
    status: toCandidateStatusDto(candidate.status),
    createdByMember: toEventMemberDto(candidate.createdByMember),
    commentCount: candidate.commentCount,
    likeCount: candidate.likeCount,
    createdAt: candidate.createdAt.toISOString(),
    updatedAt: candidate.updatedAt.toISOString(),
  };
}

function toEventMemberDto(member: EventMemberRecord): EventMemberDto {
  return {
    id: member.id.toString(),
    eventId: member.eventId.toString(),
    userId: member.userId === null ? null : member.userId.toString(),
    displayName: member.displayName,
    role: member.role === "OWNER" ? "owner" : "member",
    memberType: member.userId === null ? "guest" : "user",
    user:
      member.user === null
        ? null
        : {
            id: member.user.id.toString(),
            name: member.user.name,
            avatarUrl: member.user.avatarUrl,
          },
  };
}

function toLocationDto(
  location: EventLocationRecord | null,
): LocationDto | null {
  return location;
}

function toCandidateStatusDto(
  status: CandidateStatus,
): "pending" | "confirmed" | "cancelled" {
  switch (status) {
    case "PROPOSED":
      return "pending";
    case "CONFIRMED":
      return "confirmed";
    case "REJECTED":
      return "cancelled";
  }
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
