import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { TaskService } from "../src/application/services/taskService.js";
import type { Task } from "../src/domain/entities/task.js";
import type {
  CreateTaskData,
  TaskRepository,
} from "../src/domain/repositories/taskRepository.js";

class InMemoryTaskRepository implements TaskRepository {
  private tasks: Task[] = [];
  private nextId = 1;

  async findManyOrderByCreatedAtDesc() {
    return [...this.tasks].sort(
      (left, right) => right.createdAt.getTime() - left.createdAt.getTime(),
    );
  }

  async create(data: CreateTaskData) {
    const now = new Date("2026-06-11T00:00:00.000Z");
    const task: Task = {
      id: this.nextId,
      title: data.title,
      description: data.description,
      completed: false,
      createdAt: now,
      updatedAt: now,
    };

    this.nextId += 1;
    this.tasks.push(task);

    return task;
  }
}

describe("TaskService", () => {
  it("creates a task through the repository", async () => {
    const service = new TaskService(new InMemoryTaskRepository());

    const task = await service.createTask({
      title: "Plan setup",
      description: "  Docker and CI  ",
    });

    assert.deepEqual(task, {
      id: 1,
      title: "Plan setup",
      description: "Docker and CI",
      completed: false,
      createdAt: "2026-06-11T00:00:00.000Z",
      updatedAt: "2026-06-11T00:00:00.000Z",
    });
  });
});
