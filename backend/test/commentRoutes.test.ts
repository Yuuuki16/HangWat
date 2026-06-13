import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ApplicationError } from "../src/application/errors/applicationError.js";
import type {
  CommentDto,
  CommentLikeDto,
  CommentService,
} from "../src/application/services/commentService.js";
import { createCommentRoutes } from "../src/presentation/routes/commentRoutes.js";

type CommentRouteService = Pick<
  CommentService,
  | "listComments"
  | "createComment"
  | "deleteComment"
  | "likeComment"
  | "unlikeComment"
>;

const sampleComment: CommentDto = {
  id: "1",
  candidateId: "10",
  body: "ここ良さそう",
  authorMember: {
    id: "5",
    displayName: "たくや",
    memberType: "guest",
  },
  likeCount: 3,
  likedByMe: false,
  createdAt: "2026-07-31T10:00:00.000Z",
  updatedAt: "2026-07-31T10:00:00.000Z",
};

const sampleLikeState: CommentLikeDto = {
  commentId: "3",
  likedByMe: true,
  likeCount: 4,
};

const sampleUnlikeState: CommentLikeDto = {
  commentId: "3",
  likedByMe: false,
  likeCount: 3,
};

function createRouteService(
  overrides: Partial<CommentRouteService> = {},
): CommentRouteService {
  return {
    async listComments() {
      return [sampleComment];
    },
    async createComment() {
      return sampleComment;
    },
    async deleteComment() {
      return undefined;
    },
    async likeComment() {
      return sampleLikeState;
    },
    async unlikeComment() {
      return sampleUnlikeState;
    },
    ...overrides,
  };
}

describe("commentRoutes", () => {
  it("returns comments", async () => {
    let receivedInput:
      | Parameters<CommentRouteService["listComments"]>[0]
      | undefined;
    const app = createCommentRoutes(
      createRouteService({
        async listComments(input) {
          receivedInput = input;
          return [sampleComment];
        },
      }),
    );

    const response = await app.request("/events/1/candidates/10/comments", {
      headers: { "x-event-member-id": "5" },
    });

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { comments: [sampleComment] });
    assert.deepEqual(receivedInput, {
      eventId: 1n,
      candidateId: 10n,
      currentMemberId: 5n,
    });
  });

  it("creates a trimmed comment", async () => {
    let receivedInput:
      | Parameters<CommentRouteService["createComment"]>[0]
      | undefined;
    const app = createCommentRoutes(
      createRouteService({
        async createComment(input) {
          receivedInput = input;
          return { ...sampleComment, body: input.body };
        },
      }),
    );

    const response = await app.request("/events/1/candidates/10/comments", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-event-member-id": "5",
      },
      body: JSON.stringify({ body: "  この前の店どう？  " }),
    });

    assert.equal(response.status, 201);
    assert.deepEqual(await response.json(), {
      comment: { ...sampleComment, body: "この前の店どう？" },
    });
    assert.deepEqual(receivedInput, {
      eventId: 1n,
      candidateId: 10n,
      currentMemberId: 5n,
      body: "この前の店どう？",
    });
  });

  it("deletes a comment", async () => {
    let receivedInput:
      | Parameters<CommentRouteService["deleteComment"]>[0]
      | undefined;
    const app = createCommentRoutes(
      createRouteService({
        async deleteComment(input) {
          receivedInput = input;
        },
      }),
    );

    const response = await app.request("/comments/3", {
      method: "DELETE",
      headers: { "x-event-member-id": "5" },
    });

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      message: "コメントを削除しました",
    });
    assert.deepEqual(receivedInput, {
      commentId: 3n,
      currentMemberId: 5n,
    });
  });

  it("likes a comment", async () => {
    let receivedInput:
      | Parameters<CommentRouteService["likeComment"]>[0]
      | undefined;
    const app = createCommentRoutes(
      createRouteService({
        async likeComment(input) {
          receivedInput = input;
          return sampleLikeState;
        },
      }),
    );

    const response = await app.request("/comments/3/like", {
      method: "PUT",
      headers: { "x-event-member-id": "5" },
    });

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), sampleLikeState);
    assert.deepEqual(receivedInput, {
      commentId: 3n,
      currentMemberId: 5n,
    });
  });

  it("unlikes a comment", async () => {
    let receivedInput:
      | Parameters<CommentRouteService["unlikeComment"]>[0]
      | undefined;
    const app = createCommentRoutes(
      createRouteService({
        async unlikeComment(input) {
          receivedInput = input;
          return sampleUnlikeState;
        },
      }),
    );

    const response = await app.request("/comments/3/like", {
      method: "DELETE",
      headers: { "x-event-member-id": "5" },
    });

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), sampleUnlikeState);
    assert.deepEqual(receivedInput, {
      commentId: 3n,
      currentMemberId: 5n,
    });
  });

  it("returns 401 without x-event-member-id", async () => {
    const app = createCommentRoutes(createRouteService());
    const response = await app.request("/events/1/candidates/10/comments");

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), {
      error: {
        code: "UNAUTHORIZED",
        message: "認証が必要です",
      },
    });
  });

  it("returns 401 without x-event-member-id when liking comment", async () => {
    const app = createCommentRoutes(createRouteService());
    const response = await app.request("/comments/3/like", {
      method: "PUT",
    });

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), {
      error: {
        code: "UNAUTHORIZED",
        message: "認証が必要です",
      },
    });
  });

  it("returns 401 without x-event-member-id when unliking comment", async () => {
    const app = createCommentRoutes(createRouteService());
    const response = await app.request("/comments/3/like", {
      method: "DELETE",
    });

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), {
      error: {
        code: "UNAUTHORIZED",
        message: "認証が必要です",
      },
    });
  });

  it("returns 401 with invalid x-event-member-id", async () => {
    const app = createCommentRoutes(createRouteService());
    const response = await app.request("/events/1/candidates/10/comments", {
      headers: { "x-event-member-id": "member_5" },
    });

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), {
      error: {
        code: "UNAUTHORIZED",
        message: "認証が必要です",
      },
    });
  });

  it("returns 401 with out-of-range x-event-member-id", async () => {
    const app = createCommentRoutes(createRouteService());
    const response = await app.request("/events/1/candidates/10/comments", {
      headers: { "x-event-member-id": "9223372036854775808" },
    });

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), {
      error: {
        code: "UNAUTHORIZED",
        message: "認証が必要です",
      },
    });
  });

  it("returns 400 with invalid path id", async () => {
    const app = createCommentRoutes(createRouteService());
    const response = await app.request("/events/abc/candidates/10/comments", {
      headers: { "x-event-member-id": "5" },
    });

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      error: {
        code: "VALIDATION_ERROR",
        message: "入力内容が正しくありません",
        details: [{ field: "eventId", message: "eventId が不正です" }],
      },
    });
  });

  it("returns 400 with out-of-range event id", async () => {
    const app = createCommentRoutes(createRouteService());
    const response = await app.request(
      "/events/9223372036854775808/candidates/10/comments",
      {
        headers: { "x-event-member-id": "5" },
      },
    );

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      error: {
        code: "VALIDATION_ERROR",
        message: "入力内容が正しくありません",
        details: [{ field: "eventId", message: "eventId が不正です" }],
      },
    });
  });

  it("returns 400 with zero comment id", async () => {
    const app = createCommentRoutes(createRouteService());
    const response = await app.request("/comments/0", {
      method: "DELETE",
      headers: { "x-event-member-id": "5" },
    });

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      error: {
        code: "VALIDATION_ERROR",
        message: "入力内容が正しくありません",
        details: [{ field: "commentId", message: "commentId が不正です" }],
      },
    });
  });

  it("returns 400 with invalid comment id when liking comment", async () => {
    const app = createCommentRoutes(createRouteService());
    const response = await app.request("/comments/abc/like", {
      method: "PUT",
      headers: { "x-event-member-id": "5" },
    });

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      error: {
        code: "VALIDATION_ERROR",
        message: "入力内容が正しくありません",
        details: [{ field: "commentId", message: "commentId が不正です" }],
      },
    });
  });

  it("returns 400 with invalid comment id when unliking comment", async () => {
    const app = createCommentRoutes(createRouteService());
    const response = await app.request("/comments/abc/like", {
      method: "DELETE",
      headers: { "x-event-member-id": "5" },
    });

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      error: {
        code: "VALIDATION_ERROR",
        message: "入力内容が正しくありません",
        details: [{ field: "commentId", message: "commentId が不正です" }],
      },
    });
  });

  it("returns 400 with empty body", async () => {
    const app = createCommentRoutes(createRouteService());
    const response = await app.request("/events/1/candidates/10/comments", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-event-member-id": "5",
      },
      body: JSON.stringify({ body: "   " }),
    });

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      error: {
        code: "VALIDATION_ERROR",
        message: "入力内容が正しくありません",
        details: [{ field: "body", message: "コメント本文は必須です" }],
      },
    });
  });

  it("returns 400 with too long body", async () => {
    const app = createCommentRoutes(createRouteService());
    const response = await app.request("/events/1/candidates/10/comments", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-event-member-id": "5",
      },
      body: JSON.stringify({ body: "あ".repeat(1001) }),
    });

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      error: {
        code: "VALIDATION_ERROR",
        message: "入力内容が正しくありません",
        details: [
          {
            field: "body",
            message: "コメント本文は1000文字以内で入力してください",
          },
        ],
      },
    });
  });

  it("maps service errors to common error response", async () => {
    const app = createCommentRoutes(
      createRouteService({
        async listComments() {
          throw new ApplicationError(
            "FORBIDDEN",
            "この操作を行う権限がありません",
          );
        },
      }),
    );

    const response = await app.request("/events/1/candidates/10/comments", {
      headers: { "x-event-member-id": "5" },
    });

    assert.equal(response.status, 403);
    assert.deepEqual(await response.json(), {
      error: {
        code: "FORBIDDEN",
        message: "この操作を行う権限がありません",
      },
    });
  });

  it("maps like forbidden error to common error response", async () => {
    const app = createCommentRoutes(
      createRouteService({
        async likeComment() {
          throw new ApplicationError(
            "FORBIDDEN",
            "この操作を行う権限がありません",
          );
        },
      }),
    );

    const response = await app.request("/comments/3/like", {
      method: "PUT",
      headers: { "x-event-member-id": "5" },
    });

    assert.equal(response.status, 403);
    assert.deepEqual(await response.json(), {
      error: {
        code: "FORBIDDEN",
        message: "この操作を行う権限がありません",
      },
    });
  });

  it("maps like not found error to common error response", async () => {
    const app = createCommentRoutes(
      createRouteService({
        async likeComment() {
          throw new ApplicationError("NOT_FOUND", "データが存在しません");
        },
      }),
    );

    const response = await app.request("/comments/999/like", {
      method: "PUT",
      headers: { "x-event-member-id": "5" },
    });

    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), {
      error: {
        code: "NOT_FOUND",
        message: "データが存在しません",
      },
    });
  });

  it("maps unlike forbidden error to common error response", async () => {
    const app = createCommentRoutes(
      createRouteService({
        async unlikeComment() {
          throw new ApplicationError(
            "FORBIDDEN",
            "この操作を行う権限がありません",
          );
        },
      }),
    );

    const response = await app.request("/comments/3/like", {
      method: "DELETE",
      headers: { "x-event-member-id": "5" },
    });

    assert.equal(response.status, 403);
    assert.deepEqual(await response.json(), {
      error: {
        code: "FORBIDDEN",
        message: "この操作を行う権限がありません",
      },
    });
  });

  it("maps unlike not found error to common error response", async () => {
    const app = createCommentRoutes(
      createRouteService({
        async unlikeComment() {
          throw new ApplicationError("NOT_FOUND", "データが存在しません");
        },
      }),
    );

    const response = await app.request("/comments/999/like", {
      method: "DELETE",
      headers: { "x-event-member-id": "5" },
    });

    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), {
      error: {
        code: "NOT_FOUND",
        message: "データが存在しません",
      },
    });
  });
});
