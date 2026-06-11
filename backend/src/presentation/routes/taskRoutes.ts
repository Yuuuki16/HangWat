import { Hono } from "hono";

import type { TaskService } from "../../application/services/taskService.js";
import { parseCreateTaskBody } from "../schemas/taskSchemas.js";

export function createTaskRoutes(taskService: TaskService) {
  const app = new Hono();

  app.get("/tasks", async (c) => {
    const tasks = await taskService.listTasks();
    return c.json({ tasks });
  });

  app.post("/tasks", async (c) => {
    const body = await c.req.json<unknown>();
    const parseResult = parseCreateTaskBody(body);

    if (!parseResult.ok) {
      return c.json({ error: parseResult.error }, 400);
    }

    const task = await taskService.createTask(parseResult.data);
    return c.json({ task }, 201);
  });

  return app;
}
