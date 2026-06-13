import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { serializeSigned } from "hono/utils/cookie";

import { ApplicationError } from "../src/application/errors/applicationError.js";
import type {
  LocationDto,
  LocationService,
} from "../src/application/services/locationService.js";
import { createLocationRoutes } from "../src/presentation/routes/locationRoutes.js";

type LocationRouteService = Pick<
  LocationService,
  "resolveGoogleMapsUrl" | "resolveEventGoogleMapsUrl"
>;

const testSessionSecret = "test-secret";

const sampleLocation: LocationDto = {
  name: "大阪駅",
  address: "大阪府大阪市北区梅田3丁目1-1",
  googlePlaceId: "ChIJxxxxxxxxxxxx",
  latitude: 34.702485,
  longitude: 135.495951,
  googleMapsUrl: "https://www.google.com/maps/place/osaka",
};

function createRouteService(
  overrides: Partial<LocationRouteService> = {},
): LocationRouteService {
  return {
    async resolveGoogleMapsUrl() {
      return sampleLocation;
    },
    async resolveEventGoogleMapsUrl() {
      return sampleLocation;
    },
    ...overrides,
  };
}

async function makeSessionCookie(userId: string) {
  return serializeSigned("session_token", userId, testSessionSecret);
}

function requestLoggedInResolve(
  app: ReturnType<typeof createLocationRoutes>,
  options: { cookie?: string; body?: unknown } = {},
) {
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (options.cookie !== undefined) {
    headers.cookie = options.cookie;
  }

  return app.request("/locations/resolve-google-maps-url", {
    method: "POST",
    headers,
    body: JSON.stringify(
      options.body ?? { url: "https://maps.app.goo.gl/xxxxxx" },
    ),
  });
}

function requestEventResolve(
  app: ReturnType<typeof createLocationRoutes>,
  options: {
    eventId?: string;
    currentMemberId?: string;
    body?: unknown;
  } = {},
) {
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (options.currentMemberId !== undefined) {
    headers["x-event-member-id"] = options.currentMemberId;
  }

  return app.request(
    `/events/${options.eventId ?? "1"}/locations/resolve-google-maps-url`,
    {
      method: "POST",
      headers,
      body: JSON.stringify(
        options.body ?? { url: "https://www.google.com/maps/place/osaka" },
      ),
    },
  );
}

describe("POST /locations/resolve-google-maps-url", () => {
  it("returns resolved location", async () => {
    let receivedUrl: string | undefined;
    const app = createLocationRoutes(
      createRouteService({
        async resolveGoogleMapsUrl(input) {
          receivedUrl = input.url;
          return sampleLocation;
        },
      }),
      testSessionSecret,
    );

    const response = await requestLoggedInResolve(app, {
      cookie: await makeSessionCookie("1"),
    });

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { location: sampleLocation });
    assert.equal(receivedUrl, "https://maps.app.goo.gl/xxxxxx");
  });

  it("returns 401 without session cookie", async () => {
    const app = createLocationRoutes(createRouteService(), testSessionSecret);
    const response = await requestLoggedInResolve(app);

    assert.equal(response.status, 401);
  });

  it("returns 400 when URL is not Google Maps URL", async () => {
    const app = createLocationRoutes(createRouteService(), testSessionSecret);
    const response = await requestLoggedInResolve(app, {
      cookie: await makeSessionCookie("1"),
      body: { url: "https://example.com/maps" },
    });

    assert.equal(response.status, 400);
    const body = (await response.json()) as { error: { code: string } };
    assert.equal(body.error.code, "VALIDATION_ERROR");
  });

  it("maps not found error to 404", async () => {
    const app = createLocationRoutes(
      createRouteService({
        async resolveGoogleMapsUrl() {
          throw new ApplicationError("NOT_FOUND", "場所情報を取得できません");
        },
      }),
      testSessionSecret,
    );

    const response = await requestLoggedInResolve(app, {
      cookie: await makeSessionCookie("1"),
    });

    assert.equal(response.status, 404);
  });
});

describe("POST /events/:eventId/locations/resolve-google-maps-url", () => {
  it("returns resolved location", async () => {
    let receivedInput:
      | Parameters<LocationRouteService["resolveEventGoogleMapsUrl"]>[0]
      | undefined;
    const app = createLocationRoutes(
      createRouteService({
        async resolveEventGoogleMapsUrl(input) {
          receivedInput = input;
          return sampleLocation;
        },
      }),
      testSessionSecret,
    );

    const response = await requestEventResolve(app, { currentMemberId: "10" });

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { location: sampleLocation });
    assert.deepEqual(receivedInput, {
      eventId: 1n,
      currentMemberId: 10n,
      url: "https://www.google.com/maps/place/osaka",
    });
  });

  it("returns 401 without x-event-member-id", async () => {
    const app = createLocationRoutes(createRouteService(), testSessionSecret);
    const response = await requestEventResolve(app);

    assert.equal(response.status, 401);
  });

  it("returns 400 with invalid eventId", async () => {
    const app = createLocationRoutes(createRouteService(), testSessionSecret);
    const response = await requestEventResolve(app, {
      eventId: "abc",
      currentMemberId: "10",
    });

    assert.equal(response.status, 400);
  });

  it("maps forbidden error to 403", async () => {
    const app = createLocationRoutes(
      createRouteService({
        async resolveEventGoogleMapsUrl() {
          throw new ApplicationError(
            "FORBIDDEN",
            "この操作を行う権限がありません",
          );
        },
      }),
      testSessionSecret,
    );

    const response = await requestEventResolve(app, { currentMemberId: "10" });

    assert.equal(response.status, 403);
  });
});
