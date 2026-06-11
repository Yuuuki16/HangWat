import { Hono } from "hono";
import { cors } from "hono/cors";

import { HealthService } from "./application/services/healthService.js";
import { TaskService } from "./application/services/taskService.js";
import { PrismaHealthRepository } from "./infrastructure/prisma/prismaHealthRepository.js";
import { prisma } from "./infrastructure/prisma/prismaClient.js";
import { PrismaTaskRepository } from "./infrastructure/prisma/prismaTaskRepository.js";
import { createHealthRoutes } from "./presentation/routes/healthRoutes.js";
import { createTaskRoutes } from "./presentation/routes/taskRoutes.js";

export function createApp() {
  const app = new Hono();

  app.use(
    "*",
    cors({
      origin: process.env.FRONTEND_ORIGIN ?? "http://localhost:3000",
    }),
  );

  const taskRepository = new PrismaTaskRepository(prisma);
  const healthRepository = new PrismaHealthRepository(prisma);
  const taskService = new TaskService(taskRepository);
  const healthService = new HealthService(healthRepository);

  app.route("/", createHealthRoutes(healthService));
  app.route("/", createTaskRoutes(taskService));

  return app;
}
