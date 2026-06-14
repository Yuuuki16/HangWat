import { Hono } from "hono";
import type { Context } from "hono";
import { getSignedCookie } from "hono/cookie";

import { ApplicationError } from "../../application/errors/applicationError.js";
import type { LocationService } from "../../application/services/locationService.js";

const maxPostgresBigInt = 9_223_372_036_854_775_807n;
const maxUrlLength = 2048;
const sessionCookieName = "session_token";

const maxGooglePlaceIdLength = 300;
const maxSearchInputLength = 200;

type LocationRouteService = Pick<
  LocationService,
  | "resolveGoogleMapsUrl"
  | "resolveEventGoogleMapsUrl"
  | "getGooglePlaceAutocomplete"
  | "getGooglePlaceDetails"
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

export function createLocationRoutes(
  locationService: LocationRouteService,
  sessionSecret: string,
) {
  const app = new Hono();

  app.post("/locations/resolve-google-maps-url", async (c) => {
    const sessionUserId = await getSignedCookie(
      c,
      sessionSecret,
      sessionCookieName,
    );
    if (!sessionUserId || parseUserId(sessionUserId) === null) {
      return errorResponse(c, "UNAUTHORIZED", "認証が必要です", 401);
    }

    const body = await validateResolveGoogleMapsUrlBody(c.req.json.bind(c.req));
    if (!body.ok) {
      return validationError(c, body.details);
    }

    try {
      const location = await locationService.resolveGoogleMapsUrl({
        url: body.value.url,
      });

      return c.json({ location });
    } catch (error) {
      return handleRouteError(c, error);
    }
  });

  app.post("/events/:eventId/locations/resolve-google-maps-url", async (c) => {
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

    const body = await validateResolveGoogleMapsUrlBody(c.req.json.bind(c.req));
    if (!body.ok) {
      return validationError(c, body.details);
    }

    try {
      const location = await locationService.resolveEventGoogleMapsUrl({
        eventId: eventId.value,
        currentMemberId: currentMemberId.value,
        url: body.value.url,
      });

      return c.json({ location });
    } catch (error) {
      return handleRouteError(c, error);
    }
  });

  app.get("/events/:eventId/locations/google-place-autocomplete", async (c) => {
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

    const searchInput = c.req.query("input")?.trim() ?? "";
    if (searchInput.length === 0) {
      return validationError(c, [
        { field: "input", message: "検索文字列は必須です" },
      ]);
    }
    if (searchInput.length > maxSearchInputLength) {
      return validationError(c, [
        { field: "input", message: "検索文字列が長すぎます" },
      ]);
    }

    try {
      const predictions = await locationService.getGooglePlaceAutocomplete({
        eventId: eventId.value,
        currentMemberId: currentMemberId.value,
        searchInput,
      });

      return c.json({ predictions });
    } catch (error) {
      return handleRouteError(c, error);
    }
  });

  app.get("/events/:eventId/locations/google-place-details", async (c) => {
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

    const googlePlaceId = c.req.query("googlePlaceId")?.trim() ?? "";
    if (googlePlaceId.length === 0) {
      return validationError(c, [
        { field: "googlePlaceId", message: "Google Place ID は必須です" },
      ]);
    }
    if (googlePlaceId.length > maxGooglePlaceIdLength) {
      return validationError(c, [
        { field: "googlePlaceId", message: "Google Place ID が不正です" },
      ]);
    }

    try {
      const location = await locationService.getGooglePlaceDetails({
        eventId: eventId.value,
        currentMemberId: currentMemberId.value,
        googlePlaceId,
      });

      return c.json({ location });
    } catch (error) {
      return handleRouteError(c, error);
    }
  });

  return app;
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

async function validateResolveGoogleMapsUrlBody(
  readJson: () => Promise<unknown>,
): Promise<
  | { ok: true; value: { url: string } }
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

  const url = typeof requestBody.url === "string" ? requestBody.url.trim() : "";
  const details: ValidationDetail[] = [];
  if (url.length === 0) {
    details.push({ field: "url", message: "Google Maps URL は必須です" });
  } else if (url.length > maxUrlLength || !isAllowedGoogleMapsUrl(url)) {
    details.push({
      field: "url",
      message: "Google Maps URL の形式が正しくありません",
    });
  }

  if (details.length > 0) {
    return { ok: false, details };
  }

  return { ok: true, value: { url } };
}

function isAllowedGoogleMapsUrl(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }

  if (url.protocol !== "https:") {
    return false;
  }

  const hostname = url.hostname.toLowerCase();
  if (hostname === "maps.app.goo.gl") return true;
  if (hostname === "goo.gl" && url.pathname.startsWith("/maps")) return true;
  if (/^maps\.google\.(?:[a-z]{2,3}|co\.[a-z]{2})$/.test(hostname)) return true;
  if (hostname === "google.com" || hostname === "www.google.com") {
    return url.pathname.startsWith("/maps");
  }

  return false;
}

function parseId(
  value: string | undefined,
  field: string,
  message: string,
):
  | { ok: true; value: bigint }
  | { ok: false; detail: ValidationDetail } {
  if (value === undefined || !/^[1-9]\d*$/.test(value)) {
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

function isObject(value: unknown): value is { url?: unknown } {
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
