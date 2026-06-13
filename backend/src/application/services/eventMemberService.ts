import { ApplicationError } from "../errors/applicationError.js";
import type {
  CurrentEventMember,
  EventMemberRecord,
  EventMemberRepository,
  EventMemberRole,
} from "../../domain/repositories/eventMemberRepository.js";

export type EventMemberDto = {
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

export type CurrentEventMemberDto = {
  id: string;
  eventId: string;
  userId: string | null;
  displayName: string;
  role: "owner" | "member";
  memberType: "user" | "guest";
};

export class EventMemberService {
  constructor(
    private readonly eventMemberRepository: EventMemberRepository,
  ) {}

  async listMembers(input: {
    eventId: bigint;
    currentMemberId: bigint;
  }): Promise<EventMemberDto[]> {
    const currentMember = await this.resolveCurrentMember(
      input.currentMemberId,
    );
    const event = await this.eventMemberRepository.findEventById(input.eventId);
    if (event === null) {
      throw new ApplicationError("NOT_FOUND", "データが存在しません");
    }
    this.assertMemberBelongsToEvent(currentMember, event.id);

    const members = await this.eventMemberRepository.findMembersByEventId(
      event.id,
    );
    return members.map((m) => this.toEventMemberDto(m));
  }

  async getMyMember(input: {
    eventId: bigint;
    currentMemberId: bigint;
  }): Promise<CurrentEventMemberDto> {
    const currentMember = await this.resolveCurrentMember(
      input.currentMemberId,
    );
    const event = await this.eventMemberRepository.findEventById(input.eventId);
    if (event === null) {
      throw new ApplicationError("NOT_FOUND", "データが存在しません");
    }
    this.assertMemberBelongsToEvent(currentMember, event.id);

    return this.toCurrentEventMemberDto(currentMember);
  }

  private async resolveCurrentMember(currentMemberId: bigint) {
    const currentMember =
      await this.eventMemberRepository.findEventMemberById(currentMemberId);
    if (currentMember === null) {
      throw new ApplicationError("UNAUTHORIZED", "認証が必要です");
    }
    return currentMember;
  }

  private assertMemberBelongsToEvent(
    currentMember: CurrentEventMember,
    eventId: bigint,
  ) {
    if (currentMember.eventId !== eventId) {
      throw new ApplicationError(
        "FORBIDDEN",
        "この操作を行う権限がありません",
      );
    }
  }

  private toRoleDto(role: EventMemberRole): "owner" | "member" {
    return role === "OWNER" ? "owner" : "member";
  }

  private toEventMemberDto(member: EventMemberRecord): EventMemberDto {
    return {
      id: member.id.toString(),
      eventId: member.eventId.toString(),
      userId: member.userId?.toString() ?? null,
      displayName: member.displayName,
      role: this.toRoleDto(member.role),
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

  private toCurrentEventMemberDto(
    member: CurrentEventMember,
  ): CurrentEventMemberDto {
    return {
      id: member.id.toString(),
      eventId: member.eventId.toString(),
      userId: member.userId?.toString() ?? null,
      displayName: member.displayName,
      role: this.toRoleDto(member.role),
      memberType: member.userId === null ? "guest" : "user",
    };
  }
}
