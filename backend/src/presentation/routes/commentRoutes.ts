import { Hono } from "hono";

import type { CommentService } from "../../application/services/commentService.js";
import {
  errorResponse,
  handleRouteError,
  parseId,
  validationError,
  type ValidationDetail,
} from "./routeHelper.js";

const maxCommentBodyLength = 1000;

type CommentRouteService = Pick<
  CommentService,
  | "listComments"
  | "createComment"
  | "deleteComment"
  | "likeComment"
  | "unlikeComment"
>;

export function createCommentRoutes(commentService: CommentRouteService) {
  const app = new Hono();

  app.get("/events/:eventId/candidates/:candidateId/comments", async (c) => {
    const ids = validateEventCandidatePath(c.req.param());
    if (!ids.ok) {
      return validationError(c, ids.details);
    }

    const currentMemberId = validateCurrentMemberHeader(
      c.req.header("x-event-member-id"),
    );
    if (!currentMemberId.ok) {
      return errorResponse(c, "UNAUTHORIZED", "認証が必要です", 401);
    }

    try {
      const comments = await commentService.listComments({
        eventId: ids.eventId,
        candidateId: ids.candidateId,
        currentMemberId: currentMemberId.value,
      });

      return c.json({ comments });
    } catch (error) {
      return handleRouteError(c, error);
    }
  });

  app.post("/events/:eventId/candidates/:candidateId/comments", async (c) => {
    const ids = validateEventCandidatePath(c.req.param());
    if (!ids.ok) {
      return validationError(c, ids.details);
    }

    const currentMemberId = validateCurrentMemberHeader(
      c.req.header("x-event-member-id"),
    );
    if (!currentMemberId.ok) {
      return errorResponse(c, "UNAUTHORIZED", "認証が必要です", 401);
    }

    const body = await validatePostCommentBody(c.req.json.bind(c.req));
    if (!body.ok) {
      return validationError(c, body.details);
    }

    try {
      const comment = await commentService.createComment({
        eventId: ids.eventId,
        candidateId: ids.candidateId,
        currentMemberId: currentMemberId.value,
        body: body.value,
      });

      return c.json({ comment }, 201);
    } catch (error) {
      return handleRouteError(c, error);
    }
  });

  app.delete("/comments/:commentId", async (c) => {
    const commentId = parseId(
      c.req.param("commentId"),
      "commentId",
      "commentId が不正です",
    );
    if (!commentId.ok) {
      return validationError(c, [commentId.detail]);
    }

    const currentMemberId = validateCurrentMemberHeader(
      c.req.header("x-event-member-id"),
    );
    if (!currentMemberId.ok) {
      return errorResponse(c, "UNAUTHORIZED", "認証が必要です", 401);
    }

    try {
      await commentService.deleteComment({
        commentId: commentId.value,
        currentMemberId: currentMemberId.value,
      });

      return c.json({ message: "コメントを削除しました" });
    } catch (error) {
      return handleRouteError(c, error);
    }
  });

  app.put("/comments/:commentId/like", async (c) => {
    const commentId = parseId(
      c.req.param("commentId"),
      "commentId",
      "commentId が不正です",
    );
    if (!commentId.ok) {
      return validationError(c, [commentId.detail]);
    }

    const currentMemberId = validateCurrentMemberHeader(
      c.req.header("x-event-member-id"),
    );
    if (!currentMemberId.ok) {
      return errorResponse(c, "UNAUTHORIZED", "認証が必要です", 401);
    }

    try {
      const likeState = await commentService.likeComment({
        commentId: commentId.value,
        currentMemberId: currentMemberId.value,
      });

      return c.json(likeState);
    } catch (error) {
      return handleRouteError(c, error);
    }
  });

  app.delete("/comments/:commentId/like", async (c) => {
    const commentId = parseId(
      c.req.param("commentId"),
      "commentId",
      "commentId が不正です",
    );
    if (!commentId.ok) {
      return validationError(c, [commentId.detail]);
    }

    const currentMemberId = validateCurrentMemberHeader(
      c.req.header("x-event-member-id"),
    );
    if (!currentMemberId.ok) {
      return errorResponse(c, "UNAUTHORIZED", "認証が必要です", 401);
    }

    try {
      const likeState = await commentService.unlikeComment({
        commentId: commentId.value,
        currentMemberId: currentMemberId.value,
      });

      return c.json(likeState);
    } catch (error) {
      return handleRouteError(c, error);
    }
  });

  return app;
}

function validateEventCandidatePath(params: {
  eventId?: string;
  candidateId?: string;
}):
  | { ok: true; eventId: bigint; candidateId: bigint }
  | { ok: false; details: ValidationDetail[] } {
  const details: ValidationDetail[] = [];
  const eventId = parseId(params.eventId, "eventId", "eventId が不正です");
  const candidateId = parseId(
    params.candidateId,
    "candidateId",
    "candidateId が不正です",
  );

  if (!eventId.ok) {
    details.push(eventId.detail);
  }

  if (!candidateId.ok) {
    details.push(candidateId.detail);
  }

  if (!eventId.ok || !candidateId.ok) {
    return { ok: false, details };
  }

  return {
    ok: true,
    eventId: eventId.value,
    candidateId: candidateId.value,
  };
}

function validateCurrentMemberHeader(
  headerValue: string | undefined,
): { ok: true; value: bigint } | { ok: false } {
  const parsed = parseId(
    headerValue,
    "x-event-member-id",
    "x-event-member-id が不正です",
  );
  if (!parsed.ok) {
    return { ok: false };
  }

  return { ok: true, value: parsed.value };
}

async function validatePostCommentBody(
  readJson: () => Promise<unknown>,
): Promise<
  | { ok: true; value: string }
  | { ok: false; details: ValidationDetail[] }
> {
  let requestBody: unknown;
  try {
    requestBody = await readJson();
  } catch {
    return {
      ok: false,
      details: [
        {
          field: "body",
          message: "リクエストボディが正しくありません",
        },
      ],
    };
  }

  if (!isObject(requestBody) || typeof requestBody.body !== "string") {
    return {
      ok: false,
      details: [
        {
          field: "body",
          message: "コメント本文は文字列で指定してください",
        },
      ],
    };
  }

  const trimmedBody = requestBody.body.trim();
  if (trimmedBody.length === 0) {
    return {
      ok: false,
      details: [{ field: "body", message: "コメント本文は必須です" }],
    };
  }

  if (trimmedBody.length > maxCommentBodyLength) {
    return {
      ok: false,
      details: [
        {
          field: "body",
          message: `コメント本文は${maxCommentBodyLength}文字以内で入力してください`,
        },
      ],
    };
  }

  return { ok: true, value: trimmedBody };
}

function isObject(value: unknown): value is { body?: unknown } {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
