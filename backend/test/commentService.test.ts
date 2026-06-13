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
  CommentLikeState,
  CommentRecord,
  CommentRecordWithEvent,
  CommentRepository,
} from "../src/domain/repositories/commentRepository.js";

class FakeCommentRepository implements CommentRepository {
  readonly eventMembers = new Map<string, CommentEventMember>();
  readonly events = new Map<string, CommentEvent>();
  readonly candidates = new Map<string, CommentCandidate>();
  readonly comments = new Map<string, CommentRecordWithEvent>();
  readonly commentLikes = new Set<string>();
  readonly deletedCommentIds: bigint[] = [];
  returnNullFromLikeComment = false;
  returnNullFromUnlikeComment = false;
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

  async likeComment(input: {
    commentId: bigint;
    eventMemberId: bigint;
  }): Promise<CommentLikeState | null> {
    if (this.returnNullFromLikeComment) {
      return null;
    }

    const comment = this.comments.get(key(input.commentId));
    assert.ok(comment);

    const likeKey = commentLikeKey(input.commentId, input.eventMemberId);
    if (!this.commentLikes.has(likeKey)) {
      this.commentLikes.add(likeKey);
      comment.likeCount += 1;
    }
    comment.likedByCurrentMember = true;

    return {
      commentId: comment.id,
      likedByCurrentMember: true,
      likeCount: comment.likeCount,
    };
  }

  async unlikeComment(input: {
    commentId: bigint;
    eventMemberId: bigint;
  }): Promise<CommentLikeState | null> {
    if (this.returnNullFromUnlikeComment) {
      return null;
    }

    const comment = this.comments.get(key(input.commentId));
    assert.ok(comment);

    const likeKey = commentLikeKey(input.commentId, input.eventMemberId);
    if (this.commentLikes.delete(likeKey)) {
      comment.likeCount -= 1;
    }
    comment.likedByCurrentMember = false;

    return {
      commentId: comment.id,
      likedByCurrentMember: false,
      likeCount: comment.likeCount,
    };
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

  it("likes a comment by event participant", async () => {
    const repository = createRepository();
    const service = new CommentService(repository);

    const likeState = await service.likeComment({
      commentId: 2n,
      currentMemberId: 5n,
    });

    assert.equal(repository.commentLikes.has(commentLikeKey(2n, 5n)), true);
    assert.deepEqual(likeState, {
      commentId: "2",
      likedByMe: true,
      likeCount: 1,
    });
  });

  it("keeps duplicated like idempotent", async () => {
    const repository = createRepository();
    const service = new CommentService(repository);

    const likeState = await service.likeComment({
      commentId: 1n,
      currentMemberId: 5n,
    });

    assert.deepEqual(likeState, {
      commentId: "1",
      likedByMe: true,
      likeCount: 3,
    });
  });

  it("rejects unknown current event member when liking as unauthorized", async () => {
    const repository = createRepository();
    const service = new CommentService(repository);

    await assertRejectsWithCode(
      () => service.likeComment({ commentId: 1n, currentMemberId: 999n }),
      "UNAUTHORIZED",
    );
  });

  it("rejects non participant like as forbidden", async () => {
    const repository = createRepository();
    const service = new CommentService(repository);

    await assertRejectsWithCode(
      () => service.likeComment({ commentId: 1n, currentMemberId: 7n }),
      "FORBIDDEN",
    );
    assert.equal(repository.commentLikes.has(commentLikeKey(1n, 7n)), false);
  });

  it("returns not found when liking unknown comment", async () => {
    const repository = createRepository();
    const service = new CommentService(repository);

    await assertRejectsWithCode(
      () => service.likeComment({ commentId: 999n, currentMemberId: 5n }),
      "NOT_FOUND",
    );
  });

  it("returns not found when comment disappears while liking", async () => {
    const repository = createRepository();
    repository.returnNullFromLikeComment = true;
    const service = new CommentService(repository);

    await assertRejectsWithCode(
      () => service.likeComment({ commentId: 1n, currentMemberId: 5n }),
      "NOT_FOUND",
    );
  });

  it("unlikes a comment by event participant", async () => {
    const repository = createRepository();
    const service = new CommentService(repository);

    const likeState = await service.unlikeComment({
      commentId: 1n,
      currentMemberId: 5n,
    });

    assert.equal(repository.commentLikes.has(commentLikeKey(1n, 5n)), false);
    assert.deepEqual(likeState, {
      commentId: "1",
      likedByMe: false,
      likeCount: 2,
    });
  });

  it("keeps duplicated unlike idempotent", async () => {
    const repository = createRepository();
    const service = new CommentService(repository);

    const likeState = await service.unlikeComment({
      commentId: 2n,
      currentMemberId: 5n,
    });

    assert.deepEqual(likeState, {
      commentId: "2",
      likedByMe: false,
      likeCount: 0,
    });
  });

  it("rejects unknown current event member when unliking as unauthorized", async () => {
    const repository = createRepository();
    const service = new CommentService(repository);

    await assertRejectsWithCode(
      () => service.unlikeComment({ commentId: 1n, currentMemberId: 999n }),
      "UNAUTHORIZED",
    );
  });

  it("rejects non participant unlike as forbidden", async () => {
    const repository = createRepository();
    const service = new CommentService(repository);

    await assertRejectsWithCode(
      () => service.unlikeComment({ commentId: 1n, currentMemberId: 7n }),
      "FORBIDDEN",
    );
    assert.equal(repository.commentLikes.has(commentLikeKey(1n, 7n)), false);
  });

  it("returns not found when unliking unknown comment", async () => {
    const repository = createRepository();
    const service = new CommentService(repository);

    await assertRejectsWithCode(
      () => service.unlikeComment({ commentId: 999n, currentMemberId: 5n }),
      "NOT_FOUND",
    );
  });

  it("returns not found when comment disappears while unliking", async () => {
    const repository = createRepository();
    repository.returnNullFromUnlikeComment = true;
    const service = new CommentService(repository);

    await assertRejectsWithCode(
      () => service.unlikeComment({ commentId: 1n, currentMemberId: 5n }),
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
  repository.commentLikes.add(commentLikeKey(1n, 5n));

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

function commentLikeKey(commentId: bigint, eventMemberId: bigint) {
  return `${commentId}:${eventMemberId}`;
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
