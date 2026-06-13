import { Hono } from "hono";
import type { Context } from "hono";

import { ApplicationError } from "../../application/errors/applicationError.js";
import type { InviteTokenService } from "../../application/services/inviteTokenService.js";

const maxPostgresBigInt = 9_223_372_036_854_775_807n;

type InviteTokenRouteService = Pick<
  InviteTokenService,
  "createInviteToken" | "revokeInviteToken"
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

export function createInviteTokenRoutes(
  inviteTokenService: InviteTokenRouteService,
) {
  const app = new Hono();

  app.post("/events/:eventId/invite-tokens", async (c) => {
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

    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return validationError(c, [
        { field: "body", message: "リクエストボディが正しくありません" },
      ]);
    }

    if (!isObject(body)) {
      return validationError(c, [
        { field: "body", message: "リクエストボディが正しくありません" },
      ]);
    }

    const expiresAt = parseExpiresAt(body.expiresAt);
    if (!expiresAt.ok) {
      return validationError(c, [expiresAt.detail]);
    }

    try {
      const result = await inviteTokenService.createInviteToken({
        eventId: eventId.value,
        currentMemberId: currentMemberId.value,
        expiresAt: expiresAt.value,
      });
      return c.json(result, 201);
    } catch (error) {
      return handleRouteError(c, error);
    }
  });

  app.delete("/events/:eventId/invite-tokens/:tokenId", async (c) => {
    const eventId = parseId(
      c.req.param("eventId"),
      "eventId",
      "eventId が不正です",
    );
    if (!eventId.ok) {
      return validationError(c, [eventId.detail]);
    }

    const tokenId = parseId(
      c.req.param("tokenId"),
      "tokenId",
      "tokenId が不正です",
    );
    if (!tokenId.ok) {
      return validationError(c, [tokenId.detail]);
    }

    const currentMemberId = validateCurrentMemberHeader(
      c.req.header("x-event-member-id"),
    );
    if (!currentMemberId.ok) {
      return errorResponse(c, "UNAUTHORIZED", "認証が必要です", 401);
    }

    try {
      await inviteTokenService.revokeInviteToken({
        eventId: eventId.value,
        tokenId: tokenId.value,
        currentMemberId: currentMemberId.value,
      });
      return c.json({ message: "招待URLを無効化しました" }, 200);
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
): { ok: true; value: bigint } | { ok: false; detail: ValidationDetail } {
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

function parseExpiresAt(
  value: unknown,
): { ok: true; value: Date } | { ok: false; detail: ValidationDetail } {
  if (typeof value !== "string" || value.length === 0) {
    return {
      ok: false,
      detail: { field: "expiresAt", message: "expiresAt は必須です" },
    };
  }
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return {
      ok: false,
      detail: {
        field: "expiresAt",
        message: "expiresAt は有効な日時形式で指定してください",
      },
    };
  }
  return { ok: true, value: date };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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
