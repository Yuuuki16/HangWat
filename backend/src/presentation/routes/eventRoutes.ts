import { Hono } from "hono";
import type { Context } from "hono";

import { ApplicationError } from "../../application/errors/applicationError.js";
import type { EventService } from "../../application/services/eventService.js";

const maxPostgresBigInt = 9_223_372_036_854_775_807n;

type EventRouteService = Pick<EventService, "listEvents">;

type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "INTERNAL_SERVER_ERROR";

export function createEventRoutes(eventService: EventRouteService) {
  const app = new Hono();

  app.get("/events", async (c) => {
    const userId = validateUserIdHeader(c.req.header("x-user-id"));
    if (!userId.ok) {
      return errorResponse(c, "UNAUTHORIZED", "認証が必要です", 401);
    }

    try {
      const result = await eventService.listEvents({ userId: userId.value });
      return c.json(result);
    } catch (error) {
      return handleRouteError(c, error);
    }
  });

  return app;
}

function validateUserIdHeader(
  headerValue: string | undefined,
): { ok: true; value: bigint } | { ok: false } {
  if (headerValue === undefined || !/^\d+$/.test(headerValue)) {
    return { ok: false };
  }
  try {
    const value = BigInt(headerValue);
    if (value < 1n || value > maxPostgresBigInt) return { ok: false };
    return { ok: true, value };
  } catch {
    return { ok: false };
  }
}

function handleRouteError(c: Context, error: unknown) {
  if (error instanceof ApplicationError) {
    const statusByCode: Record<ApplicationError["code"], 401 | 403 | 404> = {
      UNAUTHORIZED: 401,
      FORBIDDEN: 403,
      NOT_FOUND: 404,
    };
    return errorResponse(
      c,
      error.code,
      error.message,
      statusByCode[error.code],
    );
  }
  console.error(error);
  return errorResponse(c, "INTERNAL_SERVER_ERROR", "サーバーエラー", 500);
}

function errorResponse(
  c: Context,
  code: ErrorCode,
  message: string,
  status: 401 | 403 | 404 | 500,
) {
  return c.json({ error: { code, message } }, status);
}
