import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createTaskRoutes } from "../src/presentation/routes/taskRoutes.js";

const taskService = {
  async listTasks() {
    return [];
  },
  async createTask() {
    return {
      id: 1,
      title: "Task",
      description: null,
      completed: false,
      createdAt: "2026-06-11T00:00:00.000Z",
      updatedAt: "2026-06-11T00:00:00.000Z",
    };
  },
};

describe("taskRoutes", () => {
  it("returns 400 for malformed JSON", async () => {
    const app = createTaskRoutes(taskService);
    const response = await app.request("/tasks", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: "{",
    });

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: "invalid json" });
  });
});
