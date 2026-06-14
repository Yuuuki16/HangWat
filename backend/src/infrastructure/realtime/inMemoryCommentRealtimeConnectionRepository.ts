import type { CommentRealtimeEvent } from "../../domain/entities/commentRealtimeEvent.js";
import type {
  CommentRealtimeConnectionRepository,
  RealtimeConnection,
} from "../../domain/repositories/commentRealtimeConnectionRepository.js";

const WS_OPEN = 1;

export class InMemoryCommentRealtimeConnectionRepository
  implements CommentRealtimeConnectionRepository
{
  private readonly connectionsByCandidateId = new Map<
    string,
    Set<RealtimeConnection>
  >();

  addConnection(candidateId: string, connection: RealtimeConnection): void {
    const connections =
      this.connectionsByCandidateId.get(candidateId) ??
      new Set<RealtimeConnection>();
    connections.add(connection);
    this.connectionsByCandidateId.set(candidateId, connections);
  }

  removeConnection(candidateId: string, connection: RealtimeConnection): void {
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
      if (connection.readyState !== WS_OPEN) {
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
