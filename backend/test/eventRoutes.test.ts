import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { EventListItemDto } from "../src/application/services/eventService.js";
import { createEventRoutes } from "../src/presentation/routes/eventRoutes.js";

type EventRouteService = {
  listEvents(input: { userId: bigint }): Promise<{ events: EventListItemDto[] }>;
};

const sampleEvent: EventListItemDto = {
  id: "1",
  title: "梅田で昼ごはん",
  date: "2026-07-31",
  location: {
    name: "大阪駅",
    address: "大阪府大阪市北区梅田3丁目1-1",
    googlePlaceId: "ChIJxxxxxxxxxxxx",
    latitude: 34.702485,
    longitude: 135.495951,
    googleMapsUrl: "https://www.google.com/maps/place/osaka",
  },
  memberCount: 2,
  isConfirmed: false,
};

function createService(
  overrides: Partial<EventRouteService> = {},
): EventRouteService {
  return {
    async listEvents() {
      return { events: [sampleEvent] };
    },
    ...overrides,
  };
}

async function request(
  app: ReturnType<typeof createEventRoutes>,
  path: string,
  headers: Record<string, string> = {},
) {
  const req = new Request(`http://localhost${path}`, { headers });
  return app.fetch(req);
}

describe("GET /events", () => {
  it("x-user-id が有効な場合 200 とイベント一覧を返す", async () => {
    const app = createEventRoutes(createService());

    const res = await request(app, "/events", { "x-user-id": "1" });
    const body = await res.json();

    assert.equal(res.status, 200);
    assert.deepEqual(body, { events: [sampleEvent] });
  });

  it("x-user-id がない場合 401 を返す", async () => {
    const app = createEventRoutes(createService());

    const res = await request(app, "/events");
    const body = await res.json();

    assert.equal(res.status, 401);
    assert.equal(body.error.code, "UNAUTHORIZED");
  });

  it("x-user-id が数字でない場合 401 を返す", async () => {
    const app = createEventRoutes(createService());

    const res = await request(app, "/events", { "x-user-id": "invalid" });

    assert.equal(res.status, 401);
  });

  it("x-user-id が 0 の場合 401 を返す", async () => {
    const app = createEventRoutes(createService());

    const res = await request(app, "/events", { "x-user-id": "0" });

    assert.equal(res.status, 401);
  });

  it("service が UNAUTHORIZED を投げた場合 401 を返す", async () => {
    const { ApplicationError } = await import(
      "../src/application/errors/applicationError.js"
    );
    const app = createEventRoutes(
      createService({
        async listEvents() {
          throw new ApplicationError("UNAUTHORIZED", "認証が必要です");
        },
      }),
    );

    const res = await request(app, "/events", { "x-user-id": "999" });
    const body = await res.json();

    assert.equal(res.status, 401);
    assert.equal(body.error.code, "UNAUTHORIZED");
  });
});
