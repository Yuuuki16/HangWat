import { Hono } from "hono";
import { cors } from "hono/cors";

import { HealthService } from "./application/services/healthService.js";
import { PrismaHealthRepository } from "./infrastructure/prisma/prismaHealthRepository.js";
import { prisma } from "./infrastructure/prisma/prismaClient.js";
import { createHealthRoutes } from "./presentation/routes/healthRoutes.js";

export function createApp() {
  const app = new Hono();

  app.use(
    "*",
    cors({
      origin: process.env.FRONTEND_ORIGIN ?? "http://localhost:3000",
    }),
  );

  app.onError((error, c) => {
    console.error(error);
    return c.json({ error: "internal server error" }, 500);
  });

  const healthRepository = new PrismaHealthRepository(prisma);
  const healthService = new HealthService(healthRepository);

  app.route("/", createHealthRoutes(healthService));

  return app;
}
