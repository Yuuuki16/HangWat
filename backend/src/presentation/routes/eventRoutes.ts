import { Hono } from "hono";

import type { EventService } from "../../application/services/eventService.js";
import {
  errorResponse,
  handleRouteError,
  parseId,
  validationError,
} from "./routeHelper.js";

type EventRouteService = Pick<EventService, "getEventDetail">;

export function createEventRoutes(eventService: EventRouteService) {
  const app = new Hono();

  app.get("/events/:eventId", async (c) => {
    const eventId = parseId(
      c.req.param("eventId"),
      "eventId",
      "eventId が不正です",
    );
    if (!eventId.ok) {
      return validationError(c, [eventId.detail]);
    }

    const currentMemberId = validateCurrentMemberHeader(
      c.req.header("x-event-member-id"),
    );
    if (!currentMemberId.ok) {
      return errorResponse(c, "UNAUTHORIZED", "認証が必要です", 401);
    }

    try {
      const eventDetail = await eventService.getEventDetail({
        eventId: eventId.value,
        currentMemberId: currentMemberId.value,
      });

      return c.json(eventDetail);
    } catch (error) {
      return handleRouteError(c, error);
    }
  });

  return app;
}

function validateCurrentMemberHeader(
  headerValue: string | undefined,
): { ok: true; value: bigint } | { ok: false } {
  const parsed = parseId(
    headerValue,
    "x-event-member-id",
    "x-event-member-id が不正です",
  );
  if (!parsed.ok) {
    return { ok: false };
  }

  return { ok: true, value: parsed.value };
}
