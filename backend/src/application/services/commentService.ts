import { ApplicationError } from "../errors/applicationError.js";
import type {
  CommentEventMember,
  CommentRepository,
} from "../../domain/repositories/commentRepository.js";

export class CommentService {
  constructor(private readonly commentRepository: CommentRepository) {}

  private async resolveCurrentMember(currentMemberId: bigint) {
    const currentMember =
      await this.commentRepository.findEventMemberById(currentMemberId);
    if (currentMember === null) {
      throw new ApplicationError("UNAUTHORIZED", "認証が必要です");
    }

    return currentMember;
  }

  private assertMemberBelongsToEvent(
    currentMember: CommentEventMember,
    eventId: bigint,
  ) {
    if (currentMember.eventId !== eventId) {
      throw new ApplicationError(
        "FORBIDDEN",
        "この操作を行う権限がありません",
      );
    }
  }

  protected async resolveCurrentMemberForEvent(
    eventId: bigint,
    currentMemberId: bigint,
  ) {
    const currentMember = await this.resolveCurrentMember(currentMemberId);
    this.assertMemberBelongsToEvent(currentMember, eventId);
    return currentMember;
  }
}
