import { Hono } from "hono";
import type { Context } from "hono";
import { getSignedCookie } from "hono/cookie";

import { ApplicationError } from "../../application/errors/applicationError.js";
import type { EventService } from "../../application/services/eventService.js";
import type { EventLocationRecord } from "../../domain/repositories/eventRepository.js";

const maxPostgresBigInt = 9_223_372_036_854_775_807n;
const maxTitleLength = 100;
const maxDescriptionLength = 1000;
const sessionCookieName = "session_token";

type EventRouteService = Pick<
  EventService,
  "listEvents" | "createEvent" | "getEventDetail" | "updateEvent" | "deleteEvent"
>;

type ValidationDetail = {
  field: string;
  message: string;
};

type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INTERNAL_SERVER_ERROR";

export function createEventRoutes(
  eventService: EventRouteService,
  sessionSecret: string,
) {
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

  app.post("/events", async (c) => {
    const sessionUserId = await getSignedCookie(
      c,
      sessionSecret,
      sessionCookieName,
    );
    if (!sessionUserId) {
      return errorResponse(c, "UNAUTHORIZED", "認証が必要です", 401);
    }

    const userId = parseUserId(sessionUserId);
    if (userId === null) {
      return errorResponse(c, "UNAUTHORIZED", "認証が必要です", 401);
    }

    const body = await validateEventBody(c.req.json.bind(c.req));
    if (!body.ok) {
      return validationError(c, body.details);
    }

    try {
      const result = await eventService.createEvent({
        userId,
        ...body.value,
      });
      return c.json(result, 201);
    } catch (error) {
      return handleRouteError(c, error);
    }
  });

  app.patch("/events/:eventId", async (c) => {
    const sessionUserId = await getSignedCookie(
      c,
      sessionSecret,
      sessionCookieName,
    );
    if (!sessionUserId) {
      return errorResponse(c, "UNAUTHORIZED", "認証が必要です", 401);
    }

    const userId = parseUserId(sessionUserId);
    if (userId === null) {
      return errorResponse(c, "UNAUTHORIZED", "認証が必要です", 401);
    }

    const eventId = parseId(
      c.req.param("eventId"),
      "eventId",
      "eventId が不正です",
    );
    if (!eventId.ok) {
      return validationError(c, [eventId.detail]);
    }

    const body = await validateEventBody(c.req.json.bind(c.req));
    if (!body.ok) {
      return validationError(c, body.details);
    }

    try {
      const result = await eventService.updateEvent({
        userId,
        eventId: eventId.value,
        ...body.value,
      });
      return c.json(result, 200);
    } catch (error) {
      return handleRouteError(c, error);
    }
  });

  app.delete("/events/:eventId", async (c) => {
    const sessionUserId = await getSignedCookie(
      c,
      sessionSecret,
      sessionCookieName,
    );
    if (!sessionUserId) {
      return errorResponse(c, "UNAUTHORIZED", "認証が必要です", 401);
    }

    const userId = parseUserId(sessionUserId);
    if (userId === null) {
      return errorResponse(c, "UNAUTHORIZED", "認証が必要です", 401);
    }

    const eventId = parseId(
      c.req.param("eventId"),
      "eventId",
      "eventId が不正です",
    );
    if (!eventId.ok) {
      return validationError(c, [eventId.detail]);
    }

    try {
      await eventService.deleteEvent({ userId, eventId: eventId.value });
      return c.json({ message: "イベントを削除しました" }, 200);
    } catch (error) {
      return handleRouteError(c, error);
    }
  });

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

function validateUserIdHeader(
  headerValue: string | undefined,
): { ok: true; value: bigint } | { ok: false } {
  const parsed = parseId(
    headerValue,
    "x-user-id",
    "x-user-id が不正です",
  );
  if (!parsed.ok) {
    return { ok: false };
  }

  return { ok: true, value: parsed.value };
}

function parseUserId(value: string): bigint | null {
  if (!/^[1-9][0-9]*$/.test(value)) {
    return null;
  }
  try {
    const parsed = BigInt(value);
    if (parsed > maxPostgresBigInt) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
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

async function validateEventBody(
  readJson: () => Promise<unknown>,
): Promise<
  | {
      ok: true;
      value: {
        title: string;
        date: string | null;
        location: EventLocationRecord | null;
        description: string | null;
      };
    }
  | { ok: false; details: ValidationDetail[] }
> {
  let requestBody: unknown;
  try {
    requestBody = await readJson();
  } catch {
    return {
      ok: false,
      details: [
        { field: "body", message: "リクエストボディが正しくありません" },
      ],
    };
  }

  if (!isObject(requestBody)) {
    return {
      ok: false,
      details: [
        { field: "body", message: "リクエストボディが正しくありません" },
      ],
    };
  }

  const details: ValidationDetail[] = [];

  const title =
    typeof requestBody.title === "string" ? requestBody.title.trim() : null;
  if (title === null || title.length === 0) {
    details.push({ field: "title", message: "イベント名は必須です" });
  } else if (title.length > maxTitleLength) {
    details.push({
      field: "title",
      message: `イベント名は${maxTitleLength}文字以内で入力してください`,
    });
  }

  let date: string | null = null;
  if (requestBody.date !== undefined && requestBody.date !== null) {
    if (
      typeof requestBody.date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(requestBody.date) ||
      !isValidCalendarDate(requestBody.date)
    ) {
      details.push({
        field: "date",
        message: "date は YYYY-MM-DD 形式で指定してください",
      });
    } else {
      date = requestBody.date;
    }
  }

  let location: EventLocationRecord | null = null;
  if (requestBody.location !== undefined && requestBody.location !== null) {
    const loc = requestBody.location;
    if (
      !isObject(loc) ||
      typeof loc.name !== "string" ||
      loc.name.trim().length === 0
    ) {
      details.push({
        field: "location.name",
        message: "location.name は必須です",
      });
    } else {
      location = {
        name: loc.name.trim(),
        address: typeof loc.address === "string" ? loc.address : null,
        googlePlaceId:
          typeof loc.googlePlaceId === "string" ? loc.googlePlaceId : null,
        latitude: typeof loc.latitude === "number" ? loc.latitude : null,
        longitude: typeof loc.longitude === "number" ? loc.longitude : null,
        googleMapsUrl:
          typeof loc.googleMapsUrl === "string" ? loc.googleMapsUrl : null,
      };
    }
  }

  let description: string | null = null;
  if (
    requestBody.description !== undefined &&
    requestBody.description !== null
  ) {
    if (typeof requestBody.description !== "string") {
      details.push({
        field: "description",
        message: "description は文字列で指定してください",
      });
    } else {
      const trimmed = requestBody.description.trim();
      if (trimmed.length > maxDescriptionLength) {
        details.push({
          field: "description",
          message: `description は${maxDescriptionLength}文字以内で入力してください`,
        });
      } else {
        description = trimmed.length > 0 ? trimmed : null;
      }
    }
  }

  if (details.length > 0 || title === null) {
    return { ok: false, details };
  }

  return { ok: true, value: { title, date, location, description } };
}

function parseId(
  value: string | undefined,
  field: string,
  message: string,
):
  | { ok: true; value: bigint }
  | { ok: false; detail: ValidationDetail } {
  if (value === undefined || !/^\d+$/.test(value)) {
    return { ok: false, detail: { field, message } };
  }

  try {
    const parsedValue = BigInt(value);
    if (parsedValue < 1n || parsedValue > maxPostgresBigInt) {
      return { ok: false, detail: { field, message } };
    }

    return { ok: true, value: parsedValue };
  } catch {
    return { ok: false, detail: { field, message } };
  }
}

function handleRouteError(c: Context, error: unknown) {
  if (error instanceof ApplicationError) {
    const statusByCode: Record<
      ApplicationError["code"],
      401 | 403 | 404 | 409
    > = {
      UNAUTHORIZED: 401,
      FORBIDDEN: 403,
      NOT_FOUND: 404,
      CONFLICT: 409,
    };
    const status = statusByCode[error.code];

    return errorResponse(c, error.code, error.message, status);
  }

  console.error(error);
  return errorResponse(c, "INTERNAL_SERVER_ERROR", "サーバーエラー", 500);
}

function validationError(c: Context, details: ValidationDetail[]) {
  return c.json(
    {
      error: {
        code: "VALIDATION_ERROR" satisfies ErrorCode,
        message: "入力内容が正しくありません",
        details,
      },
    },
    400,
  );
}

function errorResponse(
  c: Context,
  code: Exclude<ErrorCode, "VALIDATION_ERROR">,
  message: string,
  status: 401 | 403 | 404 | 409 | 500,
) {
  return c.json({ error: { code, message } }, status);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidCalendarDate(dateStr: string): boolean {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  return (
    d.getUTCFullYear() === year &&
    d.getUTCMonth() === month - 1 &&
    d.getUTCDate() === day
  );
}
