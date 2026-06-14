import type { CommentRealtimeEvent } from "../entities/commentRealtimeEvent.js";

export interface CommentRealtimeConnectionRepository {
  addConnection(candidateId: string, connection: WebSocket): void;
  removeConnection(candidateId: string, connection: WebSocket): void;
  broadcastToCandidate(candidateId: string, event: CommentRealtimeEvent): void;
}
