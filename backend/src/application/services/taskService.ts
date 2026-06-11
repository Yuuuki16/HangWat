import type { TaskRepository } from "../../domain/repositories/taskRepository.js";
import type { CreateTaskInput } from "../dto/taskDto.js";
import { toTaskResponse } from "../dto/taskDto.js";

export class TaskService {
  constructor(private readonly taskRepository: TaskRepository) {}

  async listTasks() {
    const tasks = await this.taskRepository.findManyOrderByCreatedAtDesc();
    return tasks.map(toTaskResponse);
  }

  async createTask(input: CreateTaskInput) {
    const task = await this.taskRepository.create({
      title: input.title,
      description: input.description?.trim() || null,
    });

    return toTaskResponse(task);
  }
}
