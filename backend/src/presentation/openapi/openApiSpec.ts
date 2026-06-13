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
    "/api/events/{eventId}": {
      get: {
        summary: "Get event detail with schedule candidates",
        parameters: [
          { $ref: "#/components/parameters/EventId" },
          { $ref: "#/components/parameters/EventMemberIdHeader" },
        ],
        responses: {
          "200": {
            description: "Event detail and schedule candidates",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["event", "candidates"],
                  properties: {
                    event: { $ref: "#/components/schemas/EventDetail" },
                    candidates: {
                      type: "array",
                      items: {
                        $ref: "#/components/schemas/ScheduleCandidate",
                      },
                    },
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
      Location: {
        type: ["object", "null"],
        required: [
          "name",
          "address",
          "googlePlaceId",
          "latitude",
          "longitude",
          "googleMapsUrl",
        ],
        properties: {
          name: { type: "string", example: "大阪駅" },
          address: {
            type: ["string", "null"],
            example: "大阪府大阪市北区梅田3丁目1-1",
          },
          googlePlaceId: {
            type: ["string", "null"],
            example: "ChIJxxxxxxxxxxxx",
          },
          latitude: { type: ["number", "null"], example: 34.702485 },
          longitude: { type: ["number", "null"], example: 135.495951 },
          googleMapsUrl: {
            type: ["string", "null"],
            example: "https://www.google.com/maps/place/...",
          },
        },
      },
      User: {
        type: ["object", "null"],
        required: ["id", "name", "avatarUrl"],
        properties: {
          id: { $ref: "#/components/schemas/BigIntId" },
          name: { type: "string", example: "はせたく" },
          avatarUrl: {
            type: ["string", "null"],
            example: null,
          },
        },
      },
      EventMember: {
        type: "object",
        required: [
          "id",
          "eventId",
          "userId",
          "displayName",
          "role",
          "memberType",
          "user",
        ],
        properties: {
          id: { $ref: "#/components/schemas/BigIntId" },
          eventId: { $ref: "#/components/schemas/BigIntId" },
          userId: {
            type: ["string", "null"],
            pattern: "^[1-9][0-9]*$",
            example: "1",
          },
          displayName: { type: "string", example: "たくや" },
          role: {
            type: "string",
            enum: ["owner", "member"],
            example: "member",
          },
          memberType: {
            type: "string",
            enum: ["user", "guest"],
            example: "guest",
          },
          user: { $ref: "#/components/schemas/User" },
        },
      },
      EventDetail: {
        type: "object",
        required: [
          "id",
          "title",
          "date",
          "location",
          "description",
          "inviteUrl",
          "createdBy",
          "members",
          "myMember",
          "confirmedCandidateId",
          "createdAt",
          "updatedAt",
        ],
        properties: {
          id: { $ref: "#/components/schemas/BigIntId" },
          title: { type: "string", example: "梅田で昼ごはん" },
          date: {
            type: ["string", "null"],
            format: "date",
            example: "2026-07-31",
          },
          location: { $ref: "#/components/schemas/Location" },
          description: {
            type: ["string", "null"],
            example: "昼ごはん候補を決める",
          },
          inviteUrl: {
            type: ["string", "null"],
            example: "http://localhost:3000/invite/abc123",
          },
          createdBy: { $ref: "#/components/schemas/User" },
          members: {
            type: "array",
            items: { $ref: "#/components/schemas/EventMember" },
          },
          myMember: { $ref: "#/components/schemas/EventMember" },
          confirmedCandidateId: {
            type: ["string", "null"],
            pattern: "^[1-9][0-9]*$",
            example: null,
          },
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
      ScheduleCandidate: {
        type: "object",
        required: [
          "id",
          "eventId",
          "title",
          "startAt",
          "endAt",
          "location",
          "description",
          "status",
          "createdByMember",
          "commentCount",
          "likeCount",
          "createdAt",
          "updatedAt",
        ],
        properties: {
          id: { $ref: "#/components/schemas/BigIntId" },
          eventId: { $ref: "#/components/schemas/BigIntId" },
          title: { type: "string", example: "一蘭で昼ごはん" },
          startAt: {
            type: "string",
            format: "date-time",
            example: "2026-07-31T13:00:00.000Z",
          },
          endAt: {
            type: ["string", "null"],
            format: "date-time",
            example: "2026-07-31T14:00:00.000Z",
          },
          location: { $ref: "#/components/schemas/Location" },
          description: {
            type: ["string", "null"],
            example: "梅田の一蘭に行く案",
          },
          status: {
            type: "string",
            enum: ["pending", "confirmed", "cancelled"],
            example: "pending",
          },
          createdByMember: { $ref: "#/components/schemas/EventMember" },
          commentCount: { type: "integer", minimum: 0, example: 3 },
          likeCount: { type: "integer", minimum: 0, example: 0 },
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
