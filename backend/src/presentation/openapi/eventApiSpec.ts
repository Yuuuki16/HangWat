export const eventPaths = {
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
};

export const eventSchemas = {
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
};
