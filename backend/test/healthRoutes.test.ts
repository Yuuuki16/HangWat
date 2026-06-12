import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createHealthRoutes } from "../src/presentation/routes/healthRoutes.js";

const healthService = {
  async check() {
    return undefined;
  },
};

describe("healthRoutes", () => {
  it("returns API information at root", async () => {
    const app = createHealthRoutes(healthService);
    const response = await app.request("/");

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      name: "HangWat API",
      endpoints: {
        health: "/health",
        tasks: "/tasks",
      },
    });
  });

  it("returns health status", async () => {
    const app = createHealthRoutes(healthService);
    const response = await app.request("/health");

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true });
  });
});
