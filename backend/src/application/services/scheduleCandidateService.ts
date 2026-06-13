import { ApplicationError } from "../errors/applicationError.js";
import type {
  ScheduleCandidateEventMember,
  ScheduleCandidateLocation,
  ScheduleCandidateLocationInput,
  ScheduleCandidateRecord,
  ScheduleCandidateRepository,
  ScheduleCandidateStatus,
} from "../../domain/repositories/scheduleCandidateRepository.js";

export type ScheduleCandidateDto = {
  id: string;
  eventId: string;
  title: string;
  startAt: string;
  endAt: string | null;
  location: {
    name: string;
    address: string | null;
    googlePlaceId: string | null;
    latitude: number | null;
    longitude: number | null;
    googleMapsUrl: string | null;
  } | null;
  description: string | null;
  status: "pending" | "confirmed" | "cancelled";
  createdByMember: {
    id: string;
    displayName: string;
    memberType: "user" | "guest";
  };
  commentCount: number;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
};

export class ScheduleCandidateService {
  constructor(
    private readonly scheduleCandidateRepository: ScheduleCandidateRepository,
  ) {}

  async createScheduleCandidate(input: {
    eventId: bigint;
    currentMemberId: bigint;
    title: string;
    startAt: Date;
    endAt: Date | null;
    location: ScheduleCandidateLocationInput | null;
    description: string | null;
  }) {
    const currentMember = await this.resolveCurrentMember(
      input.currentMemberId,
    );
    const event = await this.scheduleCandidateRepository.findEventById(
      input.eventId,
    );
    if (event === null) {
      throw new ApplicationError("NOT_FOUND", "データが存在しません");
    }
    this.assertMemberBelongsToEvent(currentMember, event.id);

    const candidate =
      await this.scheduleCandidateRepository.createScheduleCandidate({
        eventId: event.id,
        createdByMemberId: currentMember.id,
        title: input.title.trim(),
        startsAt: input.startAt,
        endsAt: input.endAt,
        location: input.location,
        description: input.description?.trim() || null,
      });

    return this.toScheduleCandidateDto(candidate);
  }

  async updateScheduleCandidate(input: {
    eventId: bigint;
    candidateId: bigint;
    currentMemberId: bigint;
    title: string;
    startAt: Date;
    endAt: Date | null;
    location: ScheduleCandidateLocationInput | null;
    description: string | null;
  }) {
    const currentMember = await this.resolveCurrentMember(
      input.currentMemberId,
    );
    const event = await this.scheduleCandidateRepository.findEventById(
      input.eventId,
    );
    if (event === null) {
      throw new ApplicationError("NOT_FOUND", "データが存在しません");
    }
    this.assertMemberBelongsToEvent(currentMember, event.id);

    const existingCandidate =
      await this.scheduleCandidateRepository.findScheduleCandidateById(
        input.candidateId,
      );
    if (
      existingCandidate === null ||
      existingCandidate.eventId !== event.id
    ) {
      throw new ApplicationError("NOT_FOUND", "データが存在しません");
    }

    this.assertCanUpdateCandidate(currentMember, existingCandidate);

    const candidate =
      await this.scheduleCandidateRepository.updateScheduleCandidate({
        candidateId: existingCandidate.id,
        title: input.title.trim(),
        startsAt: input.startAt,
        endsAt: input.endAt,
        location: input.location,
        description: input.description?.trim() || null,
      });

    return this.toScheduleCandidateDto(candidate);
  }

  private async resolveCurrentMember(currentMemberId: bigint) {
    const currentMember =
      await this.scheduleCandidateRepository.findEventMemberById(
        currentMemberId,
      );
    if (currentMember === null) {
      throw new ApplicationError("UNAUTHORIZED", "認証が必要です");
    }

    return currentMember;
  }

  private assertMemberBelongsToEvent(
    currentMember: ScheduleCandidateEventMember,
    eventId: bigint,
  ) {
    if (currentMember.eventId !== eventId) {
      throw new ApplicationError(
        "FORBIDDEN",
        "この操作を行う権限がありません",
      );
    }
  }

  private assertCanUpdateCandidate(
    currentMember: ScheduleCandidateEventMember,
    candidate: ScheduleCandidateRecord,
  ) {
    if (
      currentMember.id !== candidate.createdByMemberId &&
      currentMember.role !== "OWNER"
    ) {
      throw new ApplicationError(
        "FORBIDDEN",
        "この操作を行う権限がありません",
      );
    }
  }

  private toScheduleCandidateDto(
    candidate: ScheduleCandidateRecord,
  ): ScheduleCandidateDto {
    return {
      id: candidate.id.toString(),
      eventId: candidate.eventId.toString(),
      title: candidate.title,
      startAt: candidate.startsAt.toISOString(),
      endAt: candidate.endsAt?.toISOString() ?? null,
      location: this.toLocationDto(candidate.location),
      description: candidate.description,
      status: this.toStatusDto(candidate.status),
      createdByMember: {
        id: candidate.createdByMember.id.toString(),
        displayName: candidate.createdByMember.displayName,
        memberType:
          candidate.createdByMember.userId === null ? "guest" : "user",
      },
      commentCount: candidate.commentCount,
      likeCount: 0,
      createdAt: candidate.createdAt.toISOString(),
      updatedAt: candidate.updatedAt.toISOString(),
    };
  }

  private toLocationDto(location: ScheduleCandidateLocation | null) {
    if (location === null) {
      return null;
    }

    return {
      name: location.name,
      address: location.address,
      googlePlaceId: location.googlePlaceId,
      latitude: location.latitude,
      longitude: location.longitude,
      googleMapsUrl: location.googleMapsUrl,
    };
  }

  private toStatusDto(status: ScheduleCandidateStatus) {
    const statusMap = {
      PROPOSED: "pending",
      CONFIRMED: "confirmed",
      REJECTED: "cancelled",
    } as const satisfies Record<
      ScheduleCandidateStatus,
      ScheduleCandidateDto["status"]
    >;

    return statusMap[status];
  }
}
