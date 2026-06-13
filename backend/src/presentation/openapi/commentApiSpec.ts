export const commentPaths = {
  "/api/events/{eventId}/candidates/{candidateId}/comments": {
    get: {
      summary: "List comments for a schedule candidate",
      parameters: [
        { $ref: "#/components/parameters/EventId" },
        { $ref: "#/components/parameters/CandidateId" },
        { $ref: "#/components/parameters/EventMemberIdHeader" },
      ],
      responses: {
        "200": {
          description: "Comments for the schedule candidate",
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["comments"],
                properties: {
                  comments: {
                    type: "array",
                    items: { $ref: "#/components/schemas/Comment" },
                  },
                },
              },
            },
          },
        },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
        "404": { $ref: "#/components/responses/NotFound" },
        "500": { $ref: "#/components/responses/InternalServerError" },
      },
    },
    post: {
      summary: "Create a comment for a schedule candidate",
      parameters: [
        { $ref: "#/components/parameters/EventId" },
        { $ref: "#/components/parameters/CandidateId" },
        { $ref: "#/components/parameters/EventMemberIdHeader" },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CreateCommentRequest" },
          },
        },
      },
      responses: {
        "201": {
          description: "Created comment",
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["comment"],
                properties: {
                  comment: { $ref: "#/components/schemas/Comment" },
                },
              },
            },
          },
        },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
        "404": { $ref: "#/components/responses/NotFound" },
        "500": { $ref: "#/components/responses/InternalServerError" },
      },
    },
  },
  "/api/comments/{commentId}": {
    delete: {
      summary: "Delete a comment",
      parameters: [
        { $ref: "#/components/parameters/CommentId" },
        { $ref: "#/components/parameters/EventMemberIdHeader" },
      ],
      responses: {
        "200": {
          description: "Comment deleted",
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["message"],
                properties: {
                  message: {
                    type: "string",
                    example: "コメントを削除しました",
                  },
                },
              },
            },
          },
        },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
        "404": { $ref: "#/components/responses/NotFound" },
        "500": { $ref: "#/components/responses/InternalServerError" },
      },
    },
  },
  "/api/comments/{commentId}/like": {
    put: {
      summary: "Like a comment",
      parameters: [
        { $ref: "#/components/parameters/CommentId" },
        { $ref: "#/components/parameters/EventMemberIdHeader" },
      ],
      responses: {
        "200": {
          description: "Comment liked",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CommentLikeState" },
            },
          },
        },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
        "404": { $ref: "#/components/responses/NotFound" },
        "500": { $ref: "#/components/responses/InternalServerError" },
      },
    },
    delete: {
      summary: "Unlike a comment",
      parameters: [
        { $ref: "#/components/parameters/CommentId" },
        { $ref: "#/components/parameters/EventMemberIdHeader" },
      ],
      responses: {
        "200": {
          description: "Comment unliked",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CommentLikeState" },
            },
          },
        },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
        "404": { $ref: "#/components/responses/NotFound" },
        "500": { $ref: "#/components/responses/InternalServerError" },
      },
    },
  },
};

export const commentSchemas = {
  Comment: {
    type: "object",
    required: [
      "id",
      "candidateId",
      "body",
      "authorMember",
      "likeCount",
      "likedByMe",
      "createdAt",
      "updatedAt",
    ],
    properties: {
      id: { $ref: "#/components/schemas/BigIntId" },
      candidateId: { $ref: "#/components/schemas/BigIntId" },
      body: { type: "string", example: "ここ良さそう" },
      authorMember: { $ref: "#/components/schemas/CommentAuthorMember" },
      likeCount: { type: "integer", minimum: 0, example: 3 },
      likedByMe: { type: "boolean", example: false },
      createdAt: {
        type: "string",
        format: "date-time",
        example: "2026-07-31T10:00:00.000Z",
      },
      updatedAt: {
        type: "string",
        format: "date-time",
        example: "2026-07-31T10:00:00.000Z",
      },
    },
  },
  CommentAuthorMember: {
    type: "object",
    required: ["id", "displayName", "memberType"],
    properties: {
      id: { $ref: "#/components/schemas/BigIntId" },
      displayName: { type: "string", example: "たくや" },
      memberType: {
        type: "string",
        enum: ["user", "guest"],
        example: "guest",
      },
    },
  },
  CommentLikeState: {
    type: "object",
    required: ["commentId", "likedByMe", "likeCount"],
    properties: {
      commentId: { $ref: "#/components/schemas/BigIntId" },
      likedByMe: { type: "boolean", example: true },
      likeCount: { type: "integer", minimum: 0, example: 4 },
    },
  },
  CreateCommentRequest: {
    type: "object",
    required: ["body"],
    properties: {
      body: {
        type: "string",
        minLength: 1,
        maxLength: 1000,
        example: "この候補よさそう",
      },
    },
  },
};
