import { Hono } from "hono";
import type { Context } from "hono";

import { ApplicationError } from "../../application/errors/applicationError.js";
import type { ScheduleCandidateService } from "../../application/services/scheduleCandidateService.js";
import type { ScheduleCandidateLocationInput } from "../../domain/repositories/scheduleCandidateRepository.js";

const maxTitleLength = 100;
const maxDescriptionLength = 1000;
const maxPostgresBigInt = 9_223_372_036_854_775_807n;
const isoDateTimePattern =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

type ScheduleCandidateRouteService = Pick<
  ScheduleCandidateService,
  "createScheduleCandidate"
>;

type ValidationDetail = {
  field: string;
  message: string;
};

type FieldValidation = {
  field: string;
  message: string;
};

type CreateScheduleCandidateBody = {
  title: string;
  startAt: Date;
  endAt: Date | null;
  location: ScheduleCandidateLocationInput | null;
  description: string | null;
};

type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "INTERNAL_SERVER_ERROR";

export function createScheduleCandidateRoutes(
  scheduleCandidateService: ScheduleCandidateRouteService,
) {
  const app = new Hono();

  app.post("/events/:eventId/candidates", async (c) => {
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

    const body = await validateCreateScheduleCandidateBody(
      c.req.json.bind(c.req),
    );
    if (!body.ok) {
      return validationError(c, body.details);
    }

    try {
      const candidate =
        await scheduleCandidateService.createScheduleCandidate({
          eventId: eventId.value,
          currentMemberId: currentMemberId.value,
          title: body.value.title,
          startAt: body.value.startAt,
          endAt: body.value.endAt,
          location: body.value.location,
          description: body.value.description,
        });

      return c.json({ candidate }, 201);
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

async function validateCreateScheduleCandidateBody(
  readJson: () => Promise<unknown>,
): Promise<
  | { ok: true; value: CreateScheduleCandidateBody }
  | { ok: false; details: ValidationDetail[] }
> {
  let requestBody: unknown;
  try {
    requestBody = await readJson();
  } catch {
    return {
      ok: false,
      details: [
        {
          field: "body",
          message: "リクエストボディが正しくありません",
        },
      ],
    };
  }

  if (!isObject(requestBody)) {
    return {
      ok: false,
      details: [
        {
          field: "body",
          message: "リクエストボディが正しくありません",
        },
      ],
    };
  }

  const details: ValidationDetail[] = [];
  const title = validateRequiredString(
    requestBody.title,
    {
      field: "title",
      message: "タイトルは文字列で指定してください",
    },
    "タイトルは必須です",
    maxTitleLength,
    `タイトルは${maxTitleLength}文字以内で入力してください`,
    details,
  );
  const startAt = validateDateTime(requestBody.startAt, "startAt", details);
  const endAt = validateOptionalDateTime(
    requestBody.endAt,
    "endAt",
    details,
  );
  const description = validateOptionalString(
    requestBody.description,
    {
      field: "description",
      message: "説明は文字列で指定してください",
    },
    details,
    maxDescriptionLength,
    `説明は${maxDescriptionLength}文字以内で入力してください`,
  );
  const location = validateLocation(requestBody.location, details);

  if (startAt !== null && endAt !== null && endAt <= startAt) {
    details.push({
      field: "endAt",
      message: "終了日時は開始日時より後にしてください",
    });
  }

  if (details.length > 0 || title === null || startAt === null) {
    return { ok: false, details };
  }

  return {
    ok: true,
    value: {
      title,
      startAt,
      endAt,
      location,
      description,
    },
  };
}

function validateRequiredString(
  value: unknown,
  typeValidation: FieldValidation,
  requiredMessage: string,
  maxLength: number | null,
  maxLengthMessage: string | null,
  details: ValidationDetail[],
) {
  if (typeof value !== "string") {
    details.push(typeValidation);
    return null;
  }

  const trimmedValue = value.trim();
  if (trimmedValue.length === 0) {
    details.push({ field: typeValidation.field, message: requiredMessage });
    return null;
  }

  if (
    maxLength !== null &&
    maxLengthMessage !== null &&
    trimmedValue.length > maxLength
  ) {
    details.push({ field: typeValidation.field, message: maxLengthMessage });
    return null;
  }

  return trimmedValue;
}

function validateDateTime(
  value: unknown,
  field: string,
  details: ValidationDetail[],
) {
  if (typeof value !== "string") {
    details.push({ field, message: `${field} は日時文字列で指定してください` });
    return null;
  }

  const date = isoDateTimePattern.test(value) ? new Date(value) : null;
  if (date === null || Number.isNaN(date.getTime())) {
    details.push({ field, message: `${field} が不正です` });
    return null;
  }

  return date;
}

function validateOptionalDateTime(
  value: unknown,
  field: string,
  details: ValidationDetail[],
) {
  if (value === undefined || value === null) {
    return null;
  }

  return validateDateTime(value, field, details);
}

function validateOptionalString(
  value: unknown,
  typeValidation: FieldValidation,
  details: ValidationDetail[],
  maxLength: number | null = null,
  maxLengthMessage: string | null = null,
) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string") {
    details.push(typeValidation);
    return null;
  }

  const trimmedValue = value.trim();
  if (trimmedValue.length === 0) {
    return null;
  }

  if (
    maxLength !== null &&
    maxLengthMessage !== null &&
    trimmedValue.length > maxLength
  ) {
    details.push({ field: typeValidation.field, message: maxLengthMessage });
    return null;
  }

  return trimmedValue;
}

function validateLocation(
  value: unknown,
  details: ValidationDetail[],
): ScheduleCandidateLocationInput | null {
  if (value === undefined || value === null) {
    return null;
  }

  if (!isObject(value)) {
    details.push({ field: "location", message: "場所はobjectで指定してください" });
    return null;
  }

  const name = validateRequiredString(
    value.name,
    {
      field: "location.name",
      message: "場所名は文字列で指定してください",
    },
    "場所名は必須です",
    null,
    null,
    details,
  );
  const address = validateOptionalString(
    value.address,
    { field: "location.address", message: "住所は文字列で指定してください" },
    details,
  );
  const googlePlaceId = validateOptionalString(
    value.googlePlaceId,
    {
      field: "location.googlePlaceId",
      message: "Google Place IDは文字列で指定してください",
    },
    details,
  );
  const googleMapsUrl = validateOptionalString(
    value.googleMapsUrl,
    {
      field: "location.googleMapsUrl",
      message: "Google Maps URLは文字列で指定してください",
    },
    details,
  );
  const latitude = validateOptionalNumberInRange(
    value.latitude,
    "location.latitude",
    "緯度は数値で指定してください",
    -90,
    90,
    details,
  );
  const longitude = validateOptionalNumberInRange(
    value.longitude,
    "location.longitude",
    "経度は数値で指定してください",
    -180,
    180,
    details,
  );

  if (name === null) {
    return null;
  }

  return {
    name,
    address,
    googlePlaceId,
    latitude,
    longitude,
    googleMapsUrl,
  };
}

function validateOptionalNumberInRange(
  value: unknown,
  field: string,
  message: string,
  min: number,
  max: number,
  details: ValidationDetail[],
) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "number" || !Number.isFinite(value)) {
    details.push({ field, message });
    return null;
  }

  if (value < min || value > max) {
    details.push({
      field,
      message: `${field} は${min}以上${max}以下で指定してください`,
    });
    return null;
  }

  return value;
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

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function handleRouteError(c: Context, error: unknown) {
  if (error instanceof ApplicationError) {
    const statusByCode: Record<ApplicationError["code"], 401 | 403 | 404> = {
      UNAUTHORIZED: 401,
      FORBIDDEN: 403,
      NOT_FOUND: 404,
    };
    const status = statusByCode[error.code];

    return errorResponse(c, error.code, error.message, status);
  }

  console.error(error);
  return errorResponse(
    c,
    "INTERNAL_SERVER_ERROR",
    "サーバーエラー",
    500,
  );
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
  status: 401 | 403 | 404 | 500,
) {
  return c.json({ error: { code, message } }, status);
}
