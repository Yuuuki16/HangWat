export const openApiSpec = {
  openapi: "3.1.0",
  info: {
    title: "HangWat API",
    version: "0.1.0",
  },
  servers: [
    {
      url: "http://localhost:4000",
      description: "Local development",
    },
  ],
  paths: {
    "/api/auth/register": {
      post: {
        summary: "Register a new user",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "Registered user",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthUserResponse" },
              },
            },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "409": { $ref: "#/components/responses/Conflict" },
          "500": { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/api/auth/login": {
      post: {
        summary: "Log in a user",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Logged in user",
            headers: {
              "Set-Cookie": {
                description:
                  "署名付きセッショントークンを保持する HttpOnly Cookie",
                schema: { type: "string" },
              },
            },
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthUserResponse" },
              },
            },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "500": { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/api/auth/logout": {
      post: {
        summary: "Log out the current user",
        tags: ["Auth"],
        responses: {
          "200": {
            description: "Logged out",
            headers: {
              "Set-Cookie": {
                description: "セッション Cookie を失効させる Set-Cookie",
                schema: { type: "string" },
              },
            },
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["message"],
                  properties: {
                    message: {
                      type: "string",
                      example: "ログアウトしました",
                    },
                  },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "500": { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/api/me": {
      get: {
        summary: "Get the current logged-in user",
        tags: ["Auth"],
        responses: {
          "200": {
            description: "Current user",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthUserResponse" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "500": { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/": {
      get: {
        summary: "API information",
        responses: {
          "200": {
            description: "API metadata",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name", "endpoints"],
                  properties: {
                    name: { type: "string" },
                    endpoints: {
                      type: "object",
                      additionalProperties: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/health": {
      get: {
        summary: "Health check",
        responses: {
          "200": {
            description: "Backend and database are available",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["ok"],
                  properties: {
                    ok: { type: "boolean", const: true },
                  },
                },
              },
            },
          },
          "500": {
            description: "Backend or database is unavailable",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
        },
      },
    },
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
  },
  components: {
    parameters: {
      EventId: {
        name: "eventId",
        in: "path",
        required: true,
        schema: { $ref: "#/components/schemas/BigIntId" },
      },
      CandidateId: {
        name: "candidateId",
        in: "path",
        required: true,
        schema: { $ref: "#/components/schemas/BigIntId" },
      },
      CommentId: {
        name: "commentId",
        in: "path",
        required: true,
        schema: { $ref: "#/components/schemas/BigIntId" },
      },
      EventMemberIdHeader: {
        name: "x-event-member-id",
        in: "header",
        required: true,
        schema: { $ref: "#/components/schemas/BigIntId" },
      },
    },
    responses: {
      ValidationError: {
        description: "Validation error",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ValidationErrorResponse" },
          },
        },
      },
      Unauthorized: {
        description: "Unauthorized",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      },
      Forbidden: {
        description: "Forbidden",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      },
      Conflict: {
        description: "Conflict",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      },
      NotFound: {
        description: "Not found",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      },
      InternalServerError: {
        description: "Internal server error",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      },
    },
    schemas: {
      BigIntId: {
        type: "string",
        pattern: "^[1-9][0-9]*$",
        example: "1",
      },
      RegisterRequest: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
          name: {
            type: "string",
            minLength: 1,
            maxLength: 50,
            example: "はせたく",
          },
          email: {
            type: "string",
            format: "email",
            example: "takuya@example.com",
          },
          password: {
            type: "string",
            minLength: 8,
            maxLength: 100,
            example: "password123",
          },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: {
            type: "string",
            format: "email",
            example: "takuya@example.com",
          },
          password: {
            type: "string",
            example: "password123",
          },
        },
      },
      AuthUser: {
        type: "object",
        required: ["id", "name", "email", "avatarUrl"],
        properties: {
          id: { $ref: "#/components/schemas/BigIntId" },
          name: { type: "string", example: "はせたく" },
          email: {
            type: "string",
            format: "email",
            example: "takuya@example.com",
          },
          avatarUrl: {
            type: ["string", "null"],
            example: null,
          },
        },
      },
      AuthUserResponse: {
        type: "object",
        required: ["user"],
        properties: {
          user: { $ref: "#/components/schemas/AuthUser" },
        },
      },
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
      ErrorResponse: {
        type: "object",
        required: ["error"],
        properties: {
          error: {
            type: "object",
            required: ["code", "message"],
            properties: {
              code: { type: "string" },
              message: { type: "string" },
            },
          },
        },
      },
      ValidationErrorResponse: {
        type: "object",
        required: ["error"],
        properties: {
          error: {
            type: "object",
            required: ["code", "message", "details"],
            properties: {
              code: { type: "string", const: "VALIDATION_ERROR" },
              message: { type: "string" },
              details: {
                type: "array",
                items: {
                  type: "object",
                  required: ["field", "message"],
                  properties: {
                    field: { type: "string" },
                    message: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
} as const;
