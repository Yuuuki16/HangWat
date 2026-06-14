import type { CommentRealtimeEvent } from "../entities/commentRealtimeEvent.js";

export interface RealtimeConnection {
  readyState: number;
  send(data: string): void;
}

export interface CommentRealtimeConnectionRepository {
  addConnection(candidateId: string, connection: RealtimeConnection): void;
  removeConnection(candidateId: string, connection: RealtimeConnection): void;
  broadcastToCandidate(candidateId: string, event: CommentRealtimeEvent): void;
}
