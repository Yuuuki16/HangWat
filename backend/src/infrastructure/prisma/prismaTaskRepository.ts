import type { PrismaClient } from "@prisma/client";

import type { Task } from "../../domain/entities/task.js";
import type {
  CreateTaskData,
  TaskRepository,
} from "../../domain/repositories/taskRepository.js";

export class PrismaTaskRepository implements TaskRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findManyOrderByCreatedAtDesc(): Promise<Task[]> {
    return this.prisma.task.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async create(data: CreateTaskData): Promise<Task> {
    return this.prisma.task.create({
      data,
    });
  }
}
