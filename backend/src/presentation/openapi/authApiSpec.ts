export const authPaths = {
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
};

export const authSchemas = {
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
};
