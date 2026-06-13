import { Hono } from "hono";
import { cors } from "hono/cors";

import { CommentService } from "./application/services/commentService.js";
import { HealthService } from "./application/services/healthService.js";
import { ScheduleCandidateService } from "./application/services/scheduleCandidateService.js";
import { PrismaCommentRepository } from "./infrastructure/prisma/prismaCommentRepository.js";
import { PrismaHealthRepository } from "./infrastructure/prisma/prismaHealthRepository.js";
import { prisma } from "./infrastructure/prisma/prismaClient.js";
import { PrismaScheduleCandidateRepository } from "./infrastructure/prisma/prismaScheduleCandidateRepository.js";
import { createCommentRoutes } from "./presentation/routes/commentRoutes.js";
import { createDocsRoutes } from "./presentation/routes/docsRoutes.js";
import { createHealthRoutes } from "./presentation/routes/healthRoutes.js";
import { createScheduleCandidateRoutes } from "./presentation/routes/scheduleCandidateRoutes.js";

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
    return c.json(
      {
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "サーバーエラー",
        },
      },
      500,
    );
  });

  const commentRepository = new PrismaCommentRepository(prisma);
  const commentService = new CommentService(commentRepository);
  const scheduleCandidateRepository = new PrismaScheduleCandidateRepository(
    prisma,
  );
  const scheduleCandidateService = new ScheduleCandidateService(
    scheduleCandidateRepository,
  );
  const healthRepository = new PrismaHealthRepository(prisma);
  const healthService = new HealthService(healthRepository);

  app.route("/api", createScheduleCandidateRoutes(scheduleCandidateService));
  app.route("/api", createCommentRoutes(commentService));
  app.route("/", createDocsRoutes());
  app.route("/", createHealthRoutes(healthService));

  return app;
}
