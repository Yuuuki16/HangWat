import type { CommentRealtimeEvent } from "../../domain/entities/commentRealtimeEvent.js";
import type {
  CommentRealtimeConnectionRepository,
  RealtimeConnection,
} from "../../domain/repositories/commentRealtimeConnectionRepository.js";
import type { CommentRepository } from "../../domain/repositories/commentRepository.js";

export class CommentRealtimeService {
  constructor(
    private readonly connectionRepository: CommentRealtimeConnectionRepository,
    private readonly commentRepository: CommentRepository,
  ) {}

  async subscribeIfAuthorized(input: {
    eventId: bigint;
    candidateId: bigint;
    memberId: bigint;
    connection: RealtimeConnection;
  }): Promise<{ ok: true; candidateIdStr: string } | { ok: false; reason: string }> {
    const event = await this.commentRepository.findEventById(input.eventId);
    if (event === null) {
      return { ok: false, reason: "Event not found" };
    }

    const candidate = await this.commentRepository.findCandidateById(input.candidateId);
    if (candidate === null || candidate.eventId !== event.id) {
      return { ok: false, reason: "Candidate not found" };
    }

    const member = await this.commentRepository.findEventMemberById(input.memberId);
    if (member === null || member.eventId !== event.id) {
      return { ok: false, reason: "Unauthorized" };
    }

    const candidateIdStr = input.candidateId.toString();
    this.connectionRepository.addConnection(candidateIdStr, input.connection);
    return { ok: true, candidateIdStr };
  }

  unsubscribe(candidateId: string, connection: RealtimeConnection): void {
    this.connectionRepository.removeConnection(candidateId, connection);
  }

  publish(candidateId: string, event: CommentRealtimeEvent): void {
    this.connectionRepository.broadcastToCandidate(candidateId, event);
  }
}
