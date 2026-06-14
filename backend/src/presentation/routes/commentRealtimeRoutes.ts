import { Hono } from "hono";
import type { UpgradeWebSocket } from "hono/ws";

import type { CommentRealtimeService } from "../../application/services/commentRealtimeService.js";
import type { RealtimeConnection } from "../../domain/repositories/commentRealtimeConnectionRepository.js";

type Dependencies = {
  commentRealtimeService: CommentRealtimeService;
  upgradeWebSocket: UpgradeWebSocket;
};

const maxPostgresBigInt = 9_223_372_036_854_775_807n;

function parseId(value: string | undefined | null): bigint | null {
  if (!value || !/^\d+$/.test(value)) {
    return null;
  }
  try {
    const parsed = BigInt(value);
    if (parsed < 1n || parsed > maxPostgresBigInt) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function createCommentRealtimeRoutes({
  commentRealtimeService,
  upgradeWebSocket,
}: Dependencies) {
  const app = new Hono();

  app.get(
    "/ws/events/:eventId/candidates/:candidateId",
    upgradeWebSocket(async (c) => {
      const eventId = parseId(c.req.param("eventId"));
      const candidateId = parseId(c.req.param("candidateId"));
      const memberId = parseId(c.req.query("memberId"));

      let candidateIdStr: string | null = null;

      return {
        async onOpen(_event, ws) {
          if (eventId === null || candidateId === null || memberId === null) {
            ws.close(1008, "Invalid parameters");
            return;
          }

          try {
            const result = await commentRealtimeService.subscribeIfAuthorized({
              eventId,
              candidateId,
              memberId,
              connection: ws.raw as unknown as RealtimeConnection,
            });

            if (!result.ok) {
              ws.close(1008, result.reason);
              return;
            }

            candidateIdStr = result.candidateIdStr;
          } catch (error) {
            console.error(error);
            ws.close(1011, "Server error");
          }
        },

        onClose(_event, ws) {
          if (candidateIdStr !== null) {
            commentRealtimeService.unsubscribe(
              candidateIdStr,
              ws.raw as unknown as RealtimeConnection,
            );
          }
        },
      };
    }),
  );

  return app;
}
