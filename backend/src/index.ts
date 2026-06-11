import "dotenv/config";

import { serve } from "@hono/node-server";
import { PrismaClient } from "@prisma/client";
import { Hono } from "hono";
import { cors } from "hono/cors";

const prisma = new PrismaClient();
const app = new Hono();

app.use(
  "*",
  cors({
    origin: process.env.FRONTEND_ORIGIN ?? "http://localhost:3000",
  }),
);

app.get("/health", async (c) => {
  await prisma.$queryRaw`SELECT 1`;
  return c.json({ ok: true });
});

app.get("/tasks", async (c) => {
  const tasks = await prisma.task.findMany({
    orderBy: { createdAt: "desc" },
  });

  return c.json({ tasks });
});

app.post("/tasks", async (c) => {
  const body = await c.req.json<{
    title?: string;
    description?: string;
  }>();

  if (!body.title?.trim()) {
    return c.json({ error: "title is required" }, 400);
  }

  const task = await prisma.task.create({
    data: {
      title: body.title.trim(),
      description: body.description?.trim() || null,
    },
  });

  return c.json({ task }, 201);
});

const port = Number(process.env.PORT ?? process.env.BACKEND_PORT ?? 4000);

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`Backend listening on http://localhost:${info.port}`);
  },
);
