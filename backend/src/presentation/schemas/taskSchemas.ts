import type { CreateTaskInput } from "../../application/dto/taskDto.js";

type ParseCreateTaskBodyResult =
  | {
      ok: true;
      data: CreateTaskInput;
    }
  | {
      ok: false;
      error: string;
    };

export function parseCreateTaskBody(body: unknown): ParseCreateTaskBodyResult {
  if (!isRecord(body)) {
    return { ok: false, error: "request body must be an object" };
  }

  const title = body.title;
  const description = body.description;

  if (typeof title !== "string" || !title.trim()) {
    return { ok: false, error: "title is required" };
  }

  if (description !== undefined && typeof description !== "string") {
    return { ok: false, error: "description must be a string" };
  }

  return {
    ok: true,
    data: {
      title: title.trim(),
      description: description?.trim(),
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
