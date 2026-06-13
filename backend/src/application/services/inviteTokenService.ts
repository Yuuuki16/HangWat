import { ApplicationError } from "../errors/applicationError.js";
import type {
  InviteTokenRecord,
  InviteTokenRepository,
} from "../../domain/repositories/inviteTokenRepository.js";

export type InviteTokenDto = {
  id: string;
  eventId: string;
  inviteToken: string;
  url: string;
  expiresAt: string;
  revokedAt: string | null;
  createdAt: string;
};

export class InviteTokenService {
  constructor(
    private readonly inviteTokenRepository: InviteTokenRepository,
    private readonly frontendOrigin: string,
  ) {}

  async createInviteToken(input: {
    eventId: bigint;
    currentMemberId: bigint;
    expiresAt: Date;
  }): Promise<{ inviteToken: InviteTokenDto }> {
    const currentMember = await this.inviteTokenRepository.findEventMemberById(
      input.currentMemberId,
    );
    if (currentMember === null) {
      throw new ApplicationError("UNAUTHORIZED", "認証が必要です");
    }

    const event = await this.inviteTokenRepository.findEventById(input.eventId);
    if (event === null) {
      throw new ApplicationError("NOT_FOUND", "イベントが存在しません");
    }

    if (currentMember.eventId !== event.id) {
      throw new ApplicationError("FORBIDDEN", "招待URLを発行する権限がありません");
    }
    if (currentMember.role !== "OWNER") {
      throw new ApplicationError("FORBIDDEN", "招待URLを発行する権限がありません");
    }

    const token = crypto.randomUUID();
    const record = await this.inviteTokenRepository.createInviteToken({
      eventId: event.id,
      inviteToken: token,
      expiresAt: input.expiresAt,
    });

    return { inviteToken: this.toDto(record) };
  }

  async revokeInviteToken(input: {
    eventId: bigint;
    tokenId: bigint;
    currentMemberId: bigint;
  }): Promise<void> {
    const currentMember = await this.inviteTokenRepository.findEventMemberById(
      input.currentMemberId,
    );
    if (currentMember === null) {
      throw new ApplicationError("UNAUTHORIZED", "認証が必要です");
    }

    const event = await this.inviteTokenRepository.findEventById(input.eventId);
    if (event === null) {
      throw new ApplicationError("NOT_FOUND", "イベントが存在しません");
    }

    if (currentMember.eventId !== event.id) {
      throw new ApplicationError(
        "FORBIDDEN",
        "招待URLを無効化する権限がありません",
      );
    }
    if (currentMember.role !== "OWNER") {
      throw new ApplicationError(
        "FORBIDDEN",
        "招待URLを無効化する権限がありません",
      );
    }

    const inviteToken = await this.inviteTokenRepository.findInviteTokenById(
      input.tokenId,
    );
    if (inviteToken === null || inviteToken.eventId !== event.id) {
      throw new ApplicationError("NOT_FOUND", "招待URLが存在しません");
    }

    await this.inviteTokenRepository.revokeInviteToken(
      input.tokenId,
      new Date(),
    );
  }

  private toDto(record: InviteTokenRecord): InviteTokenDto {
    return {
      id: record.id.toString(),
      eventId: record.eventId.toString(),
      inviteToken: record.inviteToken,
      url: `${this.frontendOrigin}/invite/${record.inviteToken}`,
      expiresAt: record.expiresAt.toISOString(),
      revokedAt: record.revokedAt?.toISOString() ?? null,
      createdAt: record.createdAt.toISOString(),
    };
  }
}
