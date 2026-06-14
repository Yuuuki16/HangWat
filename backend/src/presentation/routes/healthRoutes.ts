import { Hono } from "hono";

import type { HealthService } from "../../application/services/healthService.js";

export function createHealthRoutes(healthService: HealthService) {
  const app = new Hono();

  app.get("/", (c) => {
    return c.json({
      name: "HangWat API",
      endpoints: {
        comment: "/api/comments/:commentId",
        comments: "/api/events/:eventId/candidates/:candidateId/comments",
        docs: "/docs",
        health: "/health",
        openapi: "/openapi.json",
        tasks: "/tasks",
      },
    });
  });

  app.get("/health", async (c) => {
    await healthService.check();
    return c.json({ ok: true });
  });

  return app;
}
