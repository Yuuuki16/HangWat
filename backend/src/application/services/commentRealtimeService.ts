import type { CommentRealtimeEvent } from "../../domain/entities/commentRealtimeEvent.js";
import type { CommentRealtimeConnectionRepository } from "../../domain/repositories/commentRealtimeConnectionRepository.js";

export class CommentRealtimeService {
  constructor(
    private readonly connectionRepository: CommentRealtimeConnectionRepository,
  ) {}

  subscribe(candidateId: string, connection: WebSocket): void {
    this.connectionRepository.addConnection(candidateId, connection);
  }

  unsubscribe(candidateId: string, connection: WebSocket): void {
    this.connectionRepository.removeConnection(candidateId, connection);
  }

  publish(candidateId: string, event: CommentRealtimeEvent): void {
    this.connectionRepository.broadcastToCandidate(candidateId, event);
  }
}
