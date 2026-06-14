import { Hono } from "hono";
import type { Context } from "hono";

import { ApplicationError } from "../../application/errors/applicationError.js";
import type { EventMemberService } from "../../application/services/eventMemberService.js";

const maxPostgresBigInt = 9_223_372_036_854_775_807n;
const maxDisplayNameLength = 50;

type EventMemberRouteService = Pick<
  EventMemberService,
  "listMembers" | "getMyMember" | "updateDisplayName" | "deleteMember"
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

export function createEventMemberRoutes(
  eventMemberService: EventMemberRouteService,
) {
  const app = new Hono();

  app.get("/events/:eventId/members", async (c) => {
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
      const members = await eventMemberService.listMembers({
        eventId: eventId.value,
        currentMemberId: currentMemberId.value,
      });

      return c.json({ members });
    } catch (error) {
      return handleRouteError(c, error);
    }
  });

  app.get("/events/:eventId/me/member", async (c) => {
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
      const eventMember = await eventMemberService.getMyMember({
        eventId: eventId.value,
        currentMemberId: currentMemberId.value,
      });

      return c.json({ eventMember });
    } catch (error) {
      return handleRouteError(c, error);
    }
  });

  app.patch("/events/:eventId/members/:memberId", async (c) => {
    const eventId = parseId(
      c.req.param("eventId"),
      "eventId",
      "eventId が不正です",
    );
    if (!eventId.ok) {
      return validationError(c, [eventId.detail]);
    }

    const memberId = parseId(
      c.req.param("memberId"),
      "memberId",
      "memberId が不正です",
    );
    if (!memberId.ok) {
      return validationError(c, [memberId.detail]);
    }

    const currentMemberId = validateCurrentMemberHeader(
      c.req.header("x-event-member-id"),
    );
    if (!currentMemberId.ok) {
      return errorResponse(c, "UNAUTHORIZED", "認証が必要です", 401);
    }

    const body = await c.req.json().catch(() => null);
    const displayName =
      typeof body?.displayName === "string"
        ? body.displayName.trim()
        : undefined;

    const details: ValidationDetail[] = [];
    if (displayName === undefined || displayName.length === 0) {
      details.push({ field: "displayName", message: "表示名は必須です" });
    } else if (displayName.length > maxDisplayNameLength) {
      details.push({
        field: "displayName",
        message: `表示名は${maxDisplayNameLength}文字以内で入力してください`,
      });
    }
    if (details.length > 0) {
      return validationError(c, details);
    }

    try {
      const eventMember = await eventMemberService.updateDisplayName({
        eventId: eventId.value,
        memberId: memberId.value,
        currentMemberId: currentMemberId.value,
        displayName: displayName as string,
      });

      return c.json({ eventMember });
    } catch (error) {
      return handleRouteError(c, error);
    }
  });

  app.delete("/events/:eventId/members/:memberId", async (c) => {
    const eventId = parseId(
      c.req.param("eventId"),
      "eventId",
      "eventId が不正です",
    );
    if (!eventId.ok) {
      return validationError(c, [eventId.detail]);
    }

    const memberId = parseId(
      c.req.param("memberId"),
      "memberId",
      "memberId が不正です",
    );
    if (!memberId.ok) {
      return validationError(c, [memberId.detail]);
    }

    const currentMemberId = validateCurrentMemberHeader(
      c.req.header("x-event-member-id"),
    );
    if (!currentMemberId.ok) {
      return errorResponse(c, "UNAUTHORIZED", "認証が必要です", 401);
    }

    try {
      await eventMemberService.deleteMember({
        eventId: eventId.value,
        memberId: memberId.value,
        currentMemberId: currentMemberId.value,
      });

      return c.json({ message: "イベントメンバーを削除しました" });
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
    const statusByCode: Record<ApplicationError["code"], 401 | 403 | 404 | 409> =
      {
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
): Response {
  return c.json({ error: { code, message } }, status);
}
