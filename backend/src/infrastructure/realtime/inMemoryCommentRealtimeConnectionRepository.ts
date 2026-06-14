import { WebSocket } from "ws";

import type { CommentRealtimeEvent } from "../../domain/entities/commentRealtimeEvent.js";
import type { CommentRealtimeConnectionRepository } from "../../domain/repositories/commentRealtimeConnectionRepository.js";

export class InMemoryCommentRealtimeConnectionRepository
  implements CommentRealtimeConnectionRepository
{
  private readonly connectionsByCandidateId = new Map<string, Set<WebSocket>>();

  addConnection(candidateId: string, connection: WebSocket): void {
    const connections =
      this.connectionsByCandidateId.get(candidateId) ?? new Set<WebSocket>();
    connections.add(connection);
    this.connectionsByCandidateId.set(candidateId, connections);
  }

  removeConnection(candidateId: string, connection: WebSocket): void {
    const connections = this.connectionsByCandidateId.get(candidateId);
    if (!connections) {
      return;
    }
    connections.delete(connection);
    if (connections.size === 0) {
      this.connectionsByCandidateId.delete(candidateId);
    }
  }

  broadcastToCandidate(
    candidateId: string,
    event: CommentRealtimeEvent,
  ): void {
    const connections = this.connectionsByCandidateId.get(candidateId);
    if (!connections) {
      return;
    }
    const message = JSON.stringify(event);
    for (const connection of connections) {
      if (connection.readyState !== WebSocket.OPEN) {
        connections.delete(connection);
        continue;
      }
      try {
        connection.send(message);
      } catch {
        connections.delete(connection);
      }
    }
    if (connections.size === 0) {
      this.connectionsByCandidateId.delete(candidateId);
    }
  }
}
