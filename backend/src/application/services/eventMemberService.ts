import { ApplicationError } from "../errors/applicationError.js";
import type {
  CurrentEventMember,
  EventMemberRecord,
  EventMemberRepository,
  EventMemberRole,
  EventMemberTarget,
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

export type UpdatedEventMemberDto = {
  id: string;
  eventId: string;
  userId: string | null;
  displayName: string;
  role: "owner" | "member";
  memberType: "user" | "guest";
  updatedAt: string;
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

  async updateDisplayName(input: {
    eventId: bigint;
    memberId: bigint;
    currentMemberId: bigint;
    displayName: string;
  }): Promise<UpdatedEventMemberDto> {
    const currentMember = await this.resolveCurrentMember(
      input.currentMemberId,
    );
    const event = await this.eventMemberRepository.findEventById(input.eventId);
    if (event === null) {
      throw new ApplicationError("NOT_FOUND", "データが存在しません");
    }
    this.assertMemberBelongsToEvent(currentMember, event.id);

    const target = await this.eventMemberRepository.findMemberInEvent(
      event.id,
      input.memberId,
    );
    if (target === null) {
      throw new ApplicationError("NOT_FOUND", "データが存在しません");
    }

    this.assertCanModifyMember(currentMember, target);

    const isTaken = await this.eventMemberRepository.isDisplayNameTaken(
      event.id,
      input.displayName,
      target.id,
    );
    if (isTaken) {
      throw new ApplicationError(
        "CONFLICT",
        "同じイベント内で同じ表示名が既に使われています",
      );
    }

    const updated = await this.eventMemberRepository.updateDisplayName(
      target.id,
      input.displayName,
    );
    return this.toUpdatedEventMemberDto(updated);
  }

  async deleteMember(input: {
    eventId: bigint;
    memberId: bigint;
    currentMemberId: bigint;
  }): Promise<void> {
    const currentMember = await this.resolveCurrentMember(
      input.currentMemberId,
    );
    const event = await this.eventMemberRepository.findEventById(input.eventId);
    if (event === null) {
      throw new ApplicationError("NOT_FOUND", "データが存在しません");
    }
    this.assertMemberBelongsToEvent(currentMember, event.id);

    const target = await this.eventMemberRepository.findMemberInEvent(
      event.id,
      input.memberId,
    );
    if (target === null) {
      throw new ApplicationError("NOT_FOUND", "データが存在しません");
    }

    this.assertCanModifyMember(currentMember, target);

    if (target.role === "OWNER") {
      throw new ApplicationError("CONFLICT", "ownerは退出できません");
    }

    await this.eventMemberRepository.deleteEventMember(target.id);
  }

  private assertCanModifyMember(
    currentMember: CurrentEventMember,
    target: { id: bigint; eventId: bigint },
  ) {
    const isSelf = currentMember.id === target.id;
    const isOwner = currentMember.role === "OWNER";
    if (!isSelf && !isOwner) {
      throw new ApplicationError(
        "FORBIDDEN",
        "この操作を行う権限がありません",
      );
    }
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

  private toUpdatedEventMemberDto(
    member: EventMemberTarget,
  ): UpdatedEventMemberDto {
    return {
      id: member.id.toString(),
      eventId: member.eventId.toString(),
      userId: member.userId?.toString() ?? null,
      displayName: member.displayName,
      role: this.toRoleDto(member.role),
      memberType: member.userId === null ? "guest" : "user",
      updatedAt: member.updatedAt.toISOString(),
    };
  }
}
