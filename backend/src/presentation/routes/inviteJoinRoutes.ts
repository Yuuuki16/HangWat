import { Hono } from "hono";
import type { Context } from "hono";

import { ApplicationError } from "../../application/errors/applicationError.js";
import {
  InviteJoinError,
  type InviteJoinService,
} from "../../application/services/inviteJoinService.js";

const maxDisplayNameLength = 50;
const maxTokenLength = 512;

type InviteJoinRouteService = Pick<
  InviteJoinService,
  "getInviteEvent" | "joinByInviteToken" | "rejoinByMemberSession"
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
  | "INVITE_TOKEN_EXPIRED"
  | "INVITE_TOKEN_REVOKED"
  | "MEMBER_SESSION_EXPIRED"
  | "INTERNAL_SERVER_ERROR";

export function createInviteJoinRoutes(
  inviteJoinService: InviteJoinRouteService,
) {
  const app = new Hono();

  app.get("/invite-tokens/:inviteToken", async (c) => {
    const inviteToken = validatePathToken(c.req.param("inviteToken"));
    if (!inviteToken.ok) {
      return validationError(c, [inviteToken.detail]);
    }

    try {
      const result = await inviteJoinService.getInviteEvent({
        inviteToken: inviteToken.value,
      });
      return c.json(result);
    } catch (error) {
      return handleRouteError(c, error);
    }
  });

  app.post("/invite-tokens/:inviteToken/join", async (c) => {
    const inviteToken = validatePathToken(c.req.param("inviteToken"));
    if (!inviteToken.ok) {
      return validationError(c, [inviteToken.detail]);
    }

    const body = await validateJoinBody(c.req.json.bind(c.req));
    if (!body.ok) {
      return validationError(c, body.details);
    }

    try {
      const result = await inviteJoinService.joinByInviteToken({
        inviteToken: inviteToken.value,
        displayName: body.value.displayName,
      });
      return c.json(result, 201);
    } catch (error) {
      return handleRouteError(c, error);
    }
  });

  app.post("/invite-tokens/:inviteToken/rejoin", async (c) => {
    const inviteToken = validatePathToken(c.req.param("inviteToken"));
    if (!inviteToken.ok) {
      return validationError(c, [inviteToken.detail]);
    }

    const body = await validateRejoinBody(c.req.json.bind(c.req));
    if (!body.ok) {
      return validationError(c, body.details);
    }

    try {
      const result = await inviteJoinService.rejoinByMemberSession({
        inviteToken: inviteToken.value,
        memberSessionToken: body.value.memberSessionToken,
      });
      return c.json(result);
    } catch (error) {
      return handleRouteError(c, error);
    }
  });

  return app;
}

function validatePathToken(
  value: string | undefined,
): { ok: true; value: string } | { ok: false; detail: ValidationDetail } {
  if (value === undefined || value.trim().length === 0) {
    return {
      ok: false,
      detail: { field: "inviteToken", message: "inviteToken が不正です" },
    };
  }

  const token = value.trim();
  if (token.length > maxTokenLength) {
    return {
      ok: false,
      detail: { field: "inviteToken", message: "inviteToken が不正です" },
    };
  }

  return { ok: true, value: token };
}

async function validateJoinBody(
  readJson: () => Promise<unknown>,
): Promise<
  | { ok: true; value: { displayName: string } }
  | { ok: false; details: ValidationDetail[] }
> {
  const body = await readObjectBody(readJson);
  if (!body.ok) return body;

  const displayName =
    typeof body.value.displayName === "string"
      ? body.value.displayName.trim()
      : "";
  const details: ValidationDetail[] = [];
  if (displayName.length === 0) {
    details.push({ field: "displayName", message: "表示名は必須です" });
  } else if (displayName.length > maxDisplayNameLength) {
    details.push({
      field: "displayName",
      message: `表示名は${maxDisplayNameLength}文字以内で入力してください`,
    });
  }

  if (details.length > 0) return { ok: false, details };
  return { ok: true, value: { displayName } };
}

async function validateRejoinBody(
  readJson: () => Promise<unknown>,
): Promise<
  | { ok: true; value: { memberSessionToken: string } }
  | { ok: false; details: ValidationDetail[] }
> {
  const body = await readObjectBody(readJson);
  if (!body.ok) return body;

  const memberSessionToken =
    typeof body.value.memberSessionToken === "string"
      ? body.value.memberSessionToken.trim()
      : "";
  const details: ValidationDetail[] = [];
  if (memberSessionToken.length === 0) {
    details.push({
      field: "memberSessionToken",
      message: "memberSessionToken は必須です",
    });
  } else if (memberSessionToken.length > maxTokenLength) {
    details.push({
      field: "memberSessionToken",
      message: "memberSessionToken が不正です",
    });
  }

  if (details.length > 0) return { ok: false, details };
  return { ok: true, value: { memberSessionToken } };
}

async function readObjectBody(
  readJson: () => Promise<unknown>,
): Promise<
  | { ok: true; value: Record<string, unknown> }
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

  if (
    typeof requestBody !== "object" ||
    requestBody === null ||
    Array.isArray(requestBody)
  ) {
    return {
      ok: false,
      details: [
        { field: "body", message: "リクエストボディが正しくありません" },
      ],
    };
  }

  return { ok: true, value: requestBody as Record<string, unknown> };
}

function handleRouteError(c: Context, error: unknown) {
  if (error instanceof InviteJoinError) {
    return errorResponse(c, error.code, error.message, 410);
  }

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
  status: 401 | 403 | 404 | 409 | 410 | 500,
): Response {
  return c.json({ error: { code, message } }, status);
}
