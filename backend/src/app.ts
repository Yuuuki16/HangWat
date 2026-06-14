import { createNodeWebSocket } from "@hono/node-ws";
import { Hono } from "hono";
import { cors } from "hono/cors";

import { AuthService } from "./application/services/authService.js";
import { CommentRealtimeService } from "./application/services/commentRealtimeService.js";
import { CommentService } from "./application/services/commentService.js";
import { EventMemberService } from "./application/services/eventMemberService.js";
import { EventService } from "./application/services/eventService.js";
import { HealthService } from "./application/services/healthService.js";
import { InviteJoinService } from "./application/services/inviteJoinService.js";
import { InviteTokenService } from "./application/services/inviteTokenService.js";
import { LocationService } from "./application/services/locationService.js";
import { ScheduleCandidateService } from "./application/services/scheduleCandidateService.js";
import { ScryptPasswordHasher } from "./infrastructure/auth/passwordHasher.js";
import { FetchGoogleMapsUrlResolver } from "./infrastructure/googleMaps/fetchGoogleMapsUrlResolver.js";
import { GooglePlacesApiClient } from "./infrastructure/googleMaps/googlePlacesApiClient.js";
import { PrismaAuthRepository } from "./infrastructure/prisma/prismaAuthRepository.js";
import { PrismaCommentRepository } from "./infrastructure/prisma/prismaCommentRepository.js";
import { PrismaEventMemberRepository } from "./infrastructure/prisma/prismaEventMemberRepository.js";
import { PrismaEventRepository } from "./infrastructure/prisma/prismaEventRepository.js";
import { PrismaHealthRepository } from "./infrastructure/prisma/prismaHealthRepository.js";
import { PrismaInviteJoinRepository } from "./infrastructure/prisma/prismaInviteJoinRepository.js";
import { PrismaInviteTokenRepository } from "./infrastructure/prisma/prismaInviteTokenRepository.js";
import { prisma } from "./infrastructure/prisma/prismaClient.js";
import { PrismaScheduleCandidateRepository } from "./infrastructure/prisma/prismaScheduleCandidateRepository.js";
import { InMemoryCommentRealtimeConnectionRepository } from "./infrastructure/realtime/inMemoryCommentRealtimeConnectionRepository.js";
import { createAuthRoutes } from "./presentation/routes/authRoutes.js";
import { createCommentRealtimeRoutes } from "./presentation/routes/commentRealtimeRoutes.js";
import { createCommentRoutes } from "./presentation/routes/commentRoutes.js";
import { createDocsRoutes } from "./presentation/routes/docsRoutes.js";
import { createEventMemberRoutes } from "./presentation/routes/eventMemberRoutes.js";
import { createEventRoutes } from "./presentation/routes/eventRoutes.js";
import { createHealthRoutes } from "./presentation/routes/healthRoutes.js";
import { createInviteJoinRoutes } from "./presentation/routes/inviteJoinRoutes.js";
import { createInviteTokenRoutes } from "./presentation/routes/inviteTokenRoutes.js";
import { createLocationRoutes } from "./presentation/routes/locationRoutes.js";
import { createScheduleCandidateRoutes } from "./presentation/routes/scheduleCandidateRoutes.js";

export function createApp() {
  if (process.env.DEPLOY_SMOKE_MODE === "true") {
    return createDeploySmokeApp();
  }

  const sessionSecret = process.env.SESSION_SECRET;
  if (sessionSecret === undefined || sessionSecret.length === 0) {
    throw new Error("SESSION_SECRET is not set");
  }

  const app = new Hono();

  const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });

  app.use(
    "*",
    cors({
      origin: process.env.FRONTEND_ORIGIN ?? "http://localhost:3000",
      credentials: true,
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

  const authRepository = new PrismaAuthRepository(prisma);
  const passwordHasher = new ScryptPasswordHasher();
  const authService = new AuthService(authRepository, passwordHasher);
  const commentRepository = new PrismaCommentRepository(prisma);
  const commentRealtimeConnectionRepository =
    new InMemoryCommentRealtimeConnectionRepository();
  const commentRealtimeService = new CommentRealtimeService(
    commentRealtimeConnectionRepository,
    commentRepository,
  );
  const commentService = new CommentService(
    commentRepository,
    commentRealtimeService,
  );
  const eventRepository = new PrismaEventRepository(
    prisma,
    process.env.FRONTEND_ORIGIN ?? "http://localhost:3000",
  );
  const eventService = new EventService(eventRepository);
  const eventMemberRepository = new PrismaEventMemberRepository(prisma);
  const eventMemberService = new EventMemberService(eventMemberRepository);
  const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (googleMapsApiKey === undefined || googleMapsApiKey.length === 0) {
    throw new Error("GOOGLE_MAPS_API_KEY is not set");
  }
  const googleMapsUrlResolver = new FetchGoogleMapsUrlResolver();
  const googlePlacesClient = new GooglePlacesApiClient(googleMapsApiKey);
  const locationService = new LocationService(
    googleMapsUrlResolver,
    eventMemberRepository,
    googlePlacesClient,
  );
  const scheduleCandidateRepository = new PrismaScheduleCandidateRepository(
    prisma,
  );
  const scheduleCandidateService = new ScheduleCandidateService(
    scheduleCandidateRepository,
  );
  const inviteJoinRepository = new PrismaInviteJoinRepository(prisma);
  const inviteJoinService = new InviteJoinService(inviteJoinRepository);
  const inviteTokenRepository = new PrismaInviteTokenRepository(prisma);
  const inviteTokenService = new InviteTokenService(
    inviteTokenRepository,
    process.env.FRONTEND_ORIGIN ?? "http://localhost:3000",
  );
  const healthRepository = new PrismaHealthRepository(prisma);
  const healthService = new HealthService(healthRepository);

  app.route("/api", createAuthRoutes(authService, sessionSecret));
  app.route("/api", createEventRoutes(eventService, sessionSecret));
  app.route("/api", createEventMemberRoutes(eventMemberService));
  app.route("/api", createInviteJoinRoutes(inviteJoinService));
  app.route("/api", createInviteTokenRoutes(inviteTokenService));
  app.route("/api", createLocationRoutes(locationService, sessionSecret));
  app.route("/api", createScheduleCandidateRoutes(scheduleCandidateService));
  app.route("/api", createCommentRoutes(commentService));
  app.route(
    "/",
    createCommentRealtimeRoutes({
      commentRealtimeService,
      upgradeWebSocket,
    }),
  );
  app.route("/", createDocsRoutes());
  app.route("/", createHealthRoutes(healthService));

  return { app, injectWebSocket };
}

function createDeploySmokeApp() {
  const app = new Hono();

  app.use(
    "*",
    cors({
      origin: process.env.FRONTEND_ORIGIN ?? "http://localhost:3000",
      credentials: true,
    }),
  );

  app.get("/", (c) => {
    return c.json({
      name: "HangWat API",
      mode: "deploy-smoke",
      endpoints: {
        docs: "/docs",
        openapi: "/openapi.json",
      },
    });
  });

  app.route("/", createDocsRoutes());

  return app;
}
