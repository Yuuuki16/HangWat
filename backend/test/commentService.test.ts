import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  ApplicationError,
  type ApplicationErrorCode,
} from "../src/application/errors/applicationError.js";
import { CommentService } from "../src/application/services/commentService.js";
import type {
  CommentCandidate,
  CommentEvent,
  CommentEventMember,
  CommentRecord,
  CommentRecordWithEvent,
  CommentRepository,
} from "../src/domain/repositories/commentRepository.js";

class FakeCommentRepository implements CommentRepository {
  readonly eventMembers = new Map<string, CommentEventMember>();
  readonly events = new Map<string, CommentEvent>();
  readonly candidates = new Map<string, CommentCandidate>();
  readonly comments = new Map<string, CommentRecordWithEvent>();
  readonly deletedCommentIds: bigint[] = [];
  nextCommentId = 100n;

  async findEventMemberById(eventMemberId: bigint) {
    return this.eventMembers.get(key(eventMemberId)) ?? null;
  }

  async findEventById(eventId: bigint) {
    return this.events.get(key(eventId)) ?? null;
  }

  async findCandidateById(candidateId: bigint) {
    return this.candidates.get(key(candidateId)) ?? null;
  }

  async findCommentsByCandidateId(candidateId: bigint) {
    return Array.from(this.comments.values())
      .filter((comment) => comment.candidateId === candidateId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map(toCommentRecord);
  }

  async createComment(input: {
    candidateId: bigint;
    eventMemberId: bigint;
    body: string;
  }) {
    const id = this.nextCommentId;
    this.nextCommentId += 1n;
    const authorMember = this.eventMembers.get(key(input.eventMemberId));
    const candidate = this.candidates.get(key(input.candidateId));

    assert.ok(authorMember);
    assert.ok(candidate);

    const now = new Date("2026-07-31T10:10:00.000Z");
    const comment: CommentRecordWithEvent = {
      id,
      candidateId: input.candidateId,
      eventMemberId: input.eventMemberId,
      eventId: candidate.eventId,
      body: input.body,
      authorMember: {
        id: authorMember.id,
        userId: authorMember.userId,
        displayName: authorMember.displayName,
      },
      likeCount: 0,
      likedByCurrentMember: false,
      createdAt: now,
      updatedAt: now,
    };

    this.comments.set(key(comment.id), comment);
    return toCommentRecord(comment);
  }

  async findCommentById(commentId: bigint) {
    return this.comments.get(key(commentId)) ?? null;
  }

  async deleteCommentById(commentId: bigint) {
    this.deletedCommentIds.push(commentId);
    this.comments.delete(key(commentId));
  }
}

describe("CommentService", () => {
  it("returns formatted comments with BigInt ids as strings", async () => {
    const repository = createRepository();
    const service = new CommentService(repository);

    const comments = await service.listComments({
      eventId: 1n,
      candidateId: 10n,
      currentMemberId: 5n,
    });

    assert.deepEqual(comments, [
      {
        id: "1",
        candidateId: "10",
        body: "ここ良さそう",
        authorMember: {
          id: "5",
          displayName: "たくや",
          memberType: "guest",
        },
        likeCount: 3,
        likedByMe: true,
        createdAt: "2026-07-31T10:00:00.000Z",
        updatedAt: "2026-07-31T10:00:00.000Z",
      },
      {
        id: "2",
        candidateId: "10",
        body: "駅から近い",
        authorMember: {
          id: "8",
          displayName: "ゆい",
          memberType: "user",
        },
        likeCount: 0,
        likedByMe: false,
        createdAt: "2026-07-31T10:05:00.000Z",
        updatedAt: "2026-07-31T10:05:00.000Z",
      },
    ]);
  });

  it("creates a comment by current event member", async () => {
    const repository = createRepository();
    const service = new CommentService(repository);

    const comment = await service.createComment({
      eventId: 1n,
      candidateId: 10n,
      currentMemberId: 5n,
      body: "  この前の店どう？  ",
    });

    assert.equal(repository.comments.get("100")?.body, "この前の店どう？");
    assert.deepEqual(comment, {
      id: "100",
      candidateId: "10",
      body: "この前の店どう？",
      authorMember: {
        id: "5",
        displayName: "たくや",
        memberType: "guest",
      },
      likeCount: 0,
      likedByMe: false,
      createdAt: "2026-07-31T10:10:00.000Z",
      updatedAt: "2026-07-31T10:10:00.000Z",
    });
  });

  it("rejects unknown current event member as unauthorized", async () => {
    const repository = createRepository();
    const service = new CommentService(repository);

    await assertRejectsWithCode(
      () =>
        service.listComments({
          eventId: 1n,
          candidateId: 10n,
          currentMemberId: 999n,
        }),
      "UNAUTHORIZED",
    );
  });

  it("rejects non participant as forbidden", async () => {
    const repository = createRepository();
    const service = new CommentService(repository);

    await assertRejectsWithCode(
      () =>
        service.listComments({
          eventId: 1n,
          candidateId: 10n,
          currentMemberId: 7n,
        }),
      "FORBIDDEN",
    );
  });

  it("returns not found when event does not exist", async () => {
    const repository = createRepository();
    const service = new CommentService(repository);

    await assertRejectsWithCode(
      () =>
        service.listComments({
          eventId: 999n,
          candidateId: 10n,
          currentMemberId: 5n,
        }),
      "NOT_FOUND",
    );
  });

  it("returns not found when candidate does not belong to event", async () => {
    const repository = createRepository();
    const service = new CommentService(repository);

    await assertRejectsWithCode(
      () =>
        service.listComments({
          eventId: 1n,
          candidateId: 11n,
          currentMemberId: 5n,
        }),
      "NOT_FOUND",
    );
  });

  it("deletes own comment", async () => {
    const repository = createRepository();
    const service = new CommentService(repository);

    await service.deleteComment({ commentId: 1n, currentMemberId: 5n });

    assert.deepEqual(repository.deletedCommentIds, [1n]);
    assert.equal(repository.comments.has("1"), false);
  });

  it("allows owner to delete another member comment", async () => {
    const repository = createRepository();
    const service = new CommentService(repository);

    await service.deleteComment({ commentId: 1n, currentMemberId: 6n });

    assert.deepEqual(repository.deletedCommentIds, [1n]);
    assert.equal(repository.comments.has("1"), false);
  });

  it("rejects third party delete as forbidden", async () => {
    const repository = createRepository();
    const service = new CommentService(repository);

    await assertRejectsWithCode(
      () => service.deleteComment({ commentId: 1n, currentMemberId: 8n }),
      "FORBIDDEN",
    );
    assert.deepEqual(repository.deletedCommentIds, []);
  });

  it("returns not found when deleting unknown comment", async () => {
    const repository = createRepository();
    const service = new CommentService(repository);

    await assertRejectsWithCode(
      () => service.deleteComment({ commentId: 999n, currentMemberId: 5n }),
      "NOT_FOUND",
    );
  });
});

function createRepository() {
  const repository = new FakeCommentRepository();
  repository.events.set("1", { id: 1n });
  repository.events.set("2", { id: 2n });
  repository.candidates.set("10", { id: 10n, eventId: 1n });
  repository.candidates.set("11", { id: 11n, eventId: 2n });
  repository.eventMembers.set("5", {
    id: 5n,
    eventId: 1n,
    userId: null,
    displayName: "たくや",
    role: "MEMBER",
  });
  repository.eventMembers.set("6", {
    id: 6n,
    eventId: 1n,
    userId: 1n,
    displayName: "owner",
    role: "OWNER",
  });
  repository.eventMembers.set("7", {
    id: 7n,
    eventId: 2n,
    userId: null,
    displayName: "別イベント",
    role: "MEMBER",
  });
  repository.eventMembers.set("8", {
    id: 8n,
    eventId: 1n,
    userId: 2n,
    displayName: "ゆい",
    role: "MEMBER",
  });
  repository.comments.set("1", {
    id: 1n,
    candidateId: 10n,
    eventMemberId: 5n,
    eventId: 1n,
    body: "ここ良さそう",
    authorMember: {
      id: 5n,
      userId: null,
      displayName: "たくや",
    },
    likeCount: 3,
    likedByCurrentMember: true,
    createdAt: new Date("2026-07-31T10:00:00.000Z"),
    updatedAt: new Date("2026-07-31T10:00:00.000Z"),
  });
  repository.comments.set("2", {
    id: 2n,
    candidateId: 10n,
    eventMemberId: 8n,
    eventId: 1n,
    body: "駅から近い",
    authorMember: {
      id: 8n,
      userId: 2n,
      displayName: "ゆい",
    },
    likeCount: 0,
    likedByCurrentMember: false,
    createdAt: new Date("2026-07-31T10:05:00.000Z"),
    updatedAt: new Date("2026-07-31T10:05:00.000Z"),
  });

  return repository;
}

function toCommentRecord(comment: CommentRecordWithEvent): CommentRecord {
  return {
    id: comment.id,
    candidateId: comment.candidateId,
    eventMemberId: comment.eventMemberId,
    body: comment.body,
    authorMember: comment.authorMember,
    likeCount: comment.likeCount,
    likedByCurrentMember: comment.likedByCurrentMember,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
  };
}

function key(id: bigint) {
  return id.toString();
}

async function assertRejectsWithCode(
  action: () => Promise<unknown>,
  code: ApplicationErrorCode,
) {
  await assert.rejects(action, (error: unknown) => {
    assert.ok(error instanceof ApplicationError);
    assert.equal(error.code, code);
    return true;
  });
}
