import { authPaths, authSchemas } from "./authApiSpec.js";
import { commentPaths, commentSchemas } from "./commentApiSpec.js";
import { eventPaths, eventSchemas } from "./eventApiSpec.js";

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
    ...authPaths,
    ...eventPaths,
    ...commentPaths,
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
      ...authSchemas,
      ...eventSchemas,
      ...commentSchemas,
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
