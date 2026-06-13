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
        security: [{ cookieAuth: [] }],
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
        security: [{ cookieAuth: [] }],
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
    "/api/events": {
      get: {
        summary: "List events for the authenticated user",
        parameters: [{ $ref: "#/components/parameters/UserIdHeader" }],
        responses: {
          "200": {
            description: "Events joined by the authenticated user",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["events"],
                  properties: {
                    events: {
                      type: "array",
                      items: { $ref: "#/components/schemas/EventListItem" },
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
      post: {
        summary: "Create a new event",
        tags: ["Event"],
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateEventRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "Created event",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["event"],
                  properties: {
                    event: { $ref: "#/components/schemas/CreatedEvent" },
                  },
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "500": { $ref: "#/components/responses/InternalServerError" },
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
      patch: {
        summary: "Update event",
        tags: ["Event"],
        security: [{ cookieAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/EventId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateEventRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Updated event",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["event"],
                  properties: {
                    event: { $ref: "#/components/schemas/UpdatedEvent" },
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
      delete: {
        summary: "Delete event",
        tags: ["Event"],
        security: [{ cookieAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/EventId" }],
        responses: {
          "200": {
            description: "Event deleted",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["message"],
                  properties: {
                    message: { type: "string" },
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
    "/api/events/{eventId}/members": {
      get: {
        summary: "List event members",
        parameters: [
          { $ref: "#/components/parameters/EventId" },
          { $ref: "#/components/parameters/EventMemberIdHeader" },
        ],
        responses: {
          "200": {
            description: "Event members",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["members"],
                  properties: {
                    members: {
                      type: "array",
                      items: { $ref: "#/components/schemas/EventMember" },
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
    "/api/events/{eventId}/me/member": {
      get: {
        summary: "Get the current event member",
        parameters: [
          { $ref: "#/components/parameters/EventId" },
          { $ref: "#/components/parameters/EventMemberIdHeader" },
        ],
        responses: {
          "200": {
            description: "Current event member",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["eventMember"],
                  properties: {
                    eventMember: {
                      $ref: "#/components/schemas/CurrentEventMember",
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
    "/api/events/{eventId}/members": {
      get: {
        summary: "List event members",
        parameters: [
          { $ref: "#/components/parameters/EventId" },
          { $ref: "#/components/parameters/EventMemberIdHeader" },
        ],
        responses: {
          "200": {
            description: "Event members",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["members"],
                  properties: {
                    members: {
                      type: "array",
                      items: { $ref: "#/components/schemas/EventMember" },
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
    "/api/events/{eventId}/me/member": {
      get: {
        summary: "Get the current event member",
        parameters: [
          { $ref: "#/components/parameters/EventId" },
          { $ref: "#/components/parameters/EventMemberIdHeader" },
        ],
        responses: {
          "200": {
            description: "Current event member",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["eventMember"],
                  properties: {
                    eventMember: {
                      $ref: "#/components/schemas/CurrentEventMember",
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
    "/api/events/{eventId}/members/{memberId}": {
      patch: {
        summary: "Update event member display name",
        parameters: [
          { $ref: "#/components/parameters/EventId" },
          { $ref: "#/components/parameters/MemberId" },
          { $ref: "#/components/parameters/EventMemberIdHeader" },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PatchEventMemberRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Updated event member",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["eventMember"],
                  properties: {
                    eventMember: {
                      $ref: "#/components/schemas/UpdatedEventMember",
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
          "409": { $ref: "#/components/responses/Conflict" },
          "500": { $ref: "#/components/responses/InternalServerError" },
        },
      },
      delete: {
        summary: "Delete or leave event member",
        parameters: [
          { $ref: "#/components/parameters/EventId" },
          { $ref: "#/components/parameters/MemberId" },
          { $ref: "#/components/parameters/EventMemberIdHeader" },
        ],
        responses: {
          "200": {
            description: "Event member deleted",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["message"],
                  properties: {
                    message: { type: "string" },
                  },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
          "409": { $ref: "#/components/responses/Conflict" },
          "500": { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/api/events/{eventId}/candidates": {
      post: {
        summary: "Create a schedule candidate",
        parameters: [
          { $ref: "#/components/parameters/EventId" },
          { $ref: "#/components/parameters/EventMemberIdHeader" },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/CreateScheduleCandidateRequest",
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Created schedule candidate",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["candidate"],
                  properties: {
                    candidate: {
                      $ref: "#/components/schemas/ScheduleCandidate",
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
    "/api/events/{eventId}/candidates/{candidateId}": {
      patch: {
        summary: "Update a schedule candidate",
        parameters: [
          { $ref: "#/components/parameters/EventId" },
          { $ref: "#/components/parameters/CandidateId" },
          { $ref: "#/components/parameters/EventMemberIdHeader" },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/CreateScheduleCandidateRequest",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Updated schedule candidate",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["candidate"],
                  properties: {
                    candidate: {
                      $ref: "#/components/schemas/ScheduleCandidate",
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
      delete: {
        summary: "Delete a schedule candidate",
        parameters: [
          { $ref: "#/components/parameters/EventId" },
          { $ref: "#/components/parameters/CandidateId" },
          { $ref: "#/components/parameters/EventMemberIdHeader" },
        ],
        responses: {
          "200": {
            description: "Deleted schedule candidate",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["message"],
                  properties: {
                    message: {
                      type: "string",
                      example: "予定候補を削除しました",
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
          "409": { $ref: "#/components/responses/Conflict" },
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
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "session_token",
      },
    },
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
      MemberId: {
        name: "memberId",
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
      UserIdHeader: {
        name: "x-user-id",
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
      CurrentEventMember: {
        type: "object",
        required: [
          "id",
          "eventId",
          "userId",
          "displayName",
          "role",
          "memberType",
        ],
        properties: {
          id: { $ref: "#/components/schemas/BigIntId" },
          eventId: { $ref: "#/components/schemas/BigIntId" },
          userId: {
            type: ["string", "null"],
            pattern: "^[1-9][0-9]*$",
            example: null,
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
        },
      },
      UpdatedEventMember: {
        type: "object",
        required: [
          "id",
          "eventId",
          "userId",
          "displayName",
          "role",
          "memberType",
          "updatedAt",
        ],
        properties: {
          id: { $ref: "#/components/schemas/BigIntId" },
          eventId: { $ref: "#/components/schemas/BigIntId" },
          userId: {
            type: ["string", "null"],
            pattern: "^[1-9][0-9]*$",
            example: null,
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
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      PatchEventMemberRequest: {
        type: "object",
        required: ["displayName"],
        properties: {
          displayName: { type: "string", example: "たくや" },
        },
      },
      EventListItem: {
        type: "object",
        required: [
          "id",
          "title",
          "date",
          "location",
          "memberCount",
          "isConfirmed",
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
          memberCount: { type: "integer", minimum: 0, example: 2 },
          isConfirmed: { type: "boolean", example: false },
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
      CreateScheduleCandidateRequest: {
        type: "object",
        required: ["title", "startAt"],
        properties: {
          title: {
            type: "string",
            minLength: 1,
            maxLength: 100,
            example: "一蘭で昼ごはん",
          },
          startAt: {
            type: "string",
            format: "date-time",
            example: "2026-07-31T13:00:00+09:00",
          },
          endAt: {
            type: ["string", "null"],
            format: "date-time",
            example: "2026-07-31T14:00:00+09:00",
          },
          location: {
            oneOf: [
              { $ref: "#/components/schemas/Location" },
              { type: "null" },
            ],
          },
          description: {
            type: ["string", "null"],
            maxLength: 1000,
            example: "梅田の一蘭に行く案",
          },
        },
      },
      CreateEventRequest: {
        type: "object",
        required: ["title"],
        properties: {
          title: {
            type: "string",
            minLength: 1,
            maxLength: 100,
            example: "梅田で昼ごはん",
          },
          date: {
            type: ["string", "null"],
            format: "date",
            example: "2026-07-31",
          },
          location: {
            oneOf: [
              { $ref: "#/components/schemas/Location" },
              { type: "null" },
            ],
          },
          description: {
            type: ["string", "null"],
            maxLength: 1000,
            example: "昼ごはん候補を決める",
          },
        },
      },
      CreatedEvent: {
        type: "object",
        required: [
          "id",
          "title",
          "date",
          "location",
          "description",
          "inviteUrl",
          "confirmedCandidateId",
          "myMember",
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
          inviteUrl: { type: "null", example: null },
          confirmedCandidateId: { type: "null", example: null },
          myMember: { $ref: "#/components/schemas/EventMember" },
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
      UpdatedEvent: {
        type: "object",
        required: ["id", "title", "date", "location", "description", "updatedAt"],
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
          updatedAt: {
            type: "string",
            format: "date-time",
            example: "2026-07-31T10:00:00.000Z",
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
