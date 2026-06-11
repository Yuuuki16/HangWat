import type { Task } from "../entities/task.js";

export type CreateTaskData = {
  title: string;
  description: string | null;
};

export interface TaskRepository {
  create(data: CreateTaskData): Promise<Task>;
  findManyOrderByCreatedAtDesc(): Promise<Task[]>;
}
