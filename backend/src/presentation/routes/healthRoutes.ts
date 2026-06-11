import { Hono } from "hono";

import type { HealthService } from "../../application/services/healthService.js";

export function createHealthRoutes(healthService: HealthService) {
  const app = new Hono();

  app.get("/health", async (c) => {
    await healthService.check();
    return c.json({ ok: true });
  });

  return app;
}
