import { Hono } from "hono";
import type { Context } from "hono";

import { ApplicationError } from "../../application/errors/applicationError.js";
import type { CommentService } from "../../application/services/commentService.js";

const maxCommentBodyLength = 1000;
const maxPostgresBigInt = 9_223_372_036_854_775_807n;

type CommentRouteService = Pick<
  CommentService,
  | "listComments"
  | "createComment"
  | "deleteComment"
  | "likeComment"
  | "unlikeComment"
>;

type ValidationDetail = {
  field: string;
  message: string;
};

type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "INTERNAL_SERVER_ERROR";

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

function parseId(
  value: string | undefined,
  field: string,
  message: string,
):
  | { ok: true; value: bigint }
  | { ok: false; detail: ValidationDetail } {
  if (value === undefined || !/^\d+$/.test(value)) {
    return { ok: false, detail: { field, message } };
  }

  try {
    const parsedValue = BigInt(value);
    if (parsedValue < 1n || parsedValue > maxPostgresBigInt) {
      return { ok: false, detail: { field, message } };
    }

    return { ok: true, value: parsedValue };
  } catch {
    return { ok: false, detail: { field, message } };
  }
}

function isObject(value: unknown): value is { body?: unknown } {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function handleRouteError(c: Context, error: unknown) {
  if (error instanceof ApplicationError) {
    const statusByCode: Record<ApplicationError["code"], 401 | 403 | 404> = {
      UNAUTHORIZED: 401,
      FORBIDDEN: 403,
      NOT_FOUND: 404,
    };
    const status = statusByCode[error.code];

    return errorResponse(c, error.code, error.message, status);
  }

  console.error(error);
  return errorResponse(
    c,
    "INTERNAL_SERVER_ERROR",
    "サーバーエラー",
    500,
  );
}

function validationError(
  c: Context,
  details: ValidationDetail[],
) {
  return c.json(
    {
      error: {
        code: "VALIDATION_ERROR" satisfies ErrorCode,
        message: "入力内容が正しくありません",
        details,
      },
    },
    400,
  );
}

function errorResponse(
  c: Context,
  code: Exclude<ErrorCode, "VALIDATION_ERROR">,
  message: string,
  status: 401 | 403 | 404 | 500,
) {
  return c.json({ error: { code, message } }, status);
}
