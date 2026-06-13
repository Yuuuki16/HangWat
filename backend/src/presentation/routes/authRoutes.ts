import { Hono } from "hono";
import type { Context } from "hono";

import { ApplicationError } from "../../application/errors/applicationError.js";
import type { AuthService } from "../../application/services/authService.js";

const maxNameLength = 50;
const maxEmailLength = 255;
const minPasswordLength = 8;
const maxPasswordLength = 100;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type AuthRouteService = Pick<AuthService, "register">;

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

export function createAuthRoutes(authService: AuthRouteService) {
  const app = new Hono();

  app.post("/auth/register", async (c) => {
    const body = await validateRegisterBody(c.req.json.bind(c.req));
    if (!body.ok) {
      return validationError(c, body.details);
    }

    try {
      const user = await authService.register(body.value);
      return c.json({ user }, 201);
    } catch (error) {
      return handleRouteError(c, error);
    }
  });

  return app;
}

async function validateRegisterBody(
  readJson: () => Promise<unknown>,
): Promise<
  | { ok: true; value: { name: string; email: string; password: string } }
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

  const name =
    typeof requestBody.name === "string" ? requestBody.name.trim() : null;
  if (name === null || name.length === 0) {
    details.push({ field: "name", message: "ユーザー名は必須です" });
  } else if (name.length > maxNameLength) {
    details.push({
      field: "name",
      message: `ユーザー名は${maxNameLength}文字以内で入力してください`,
    });
  }

  const email =
    typeof requestBody.email === "string" ? requestBody.email.trim() : null;
  if (email === null || email.length === 0) {
    details.push({ field: "email", message: "メールアドレスは必須です" });
  } else if (email.length > maxEmailLength || !emailPattern.test(email)) {
    details.push({
      field: "email",
      message: "メールアドレスの形式が正しくありません",
    });
  }

  const password =
    typeof requestBody.password === "string" ? requestBody.password : null;
  if (password === null || password.length === 0) {
    details.push({ field: "password", message: "パスワードは必須です" });
  } else if (
    password.length < minPasswordLength ||
    password.length > maxPasswordLength
  ) {
    details.push({
      field: "password",
      message: `パスワードは${minPasswordLength}文字以上${maxPasswordLength}文字以内で入力してください`,
    });
  }

  if (details.length > 0 || name === null || email === null || password === null) {
    return { ok: false, details };
  }

  return { ok: true, value: { name, email, password } };
}

function isObject(
  value: unknown,
): value is { name?: unknown; email?: unknown; password?: unknown } {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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
