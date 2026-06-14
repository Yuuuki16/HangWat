import { apiClient } from "@/lib/apiClient";
import type { Comment, CommentLikeState } from "@/features/events/types/scheduleCandidate";

export async function listComments(
  eventId: string,
  candidateId: string,
  memberId: string,
): Promise<Comment[]> {
  const response = await apiClient<{ comments: Comment[] }>(
    `/api/events/${encodeURIComponent(eventId)}/candidates/${encodeURIComponent(candidateId)}/comments`,
    { headers: { "x-event-member-id": memberId } },
  );
  return response.comments;
}

export async function postComment(
  eventId: string,
  candidateId: string,
  memberId: string,
  body: string,
): Promise<Comment> {
  const response = await apiClient<{ comment: Comment }>(
    `/api/events/${encodeURIComponent(eventId)}/candidates/${encodeURIComponent(candidateId)}/comments`,
    {
      method: "POST",
      headers: { "x-event-member-id": memberId },
      body: { body },
    },
  );
  return response.comment;
}

export async function likeComment(
  commentId: string,
  memberId: string,
): Promise<CommentLikeState> {
  return apiClient<CommentLikeState>(`/api/comments/${encodeURIComponent(commentId)}/like`, {
    method: "PUT",
    headers: { "x-event-member-id": memberId },
  });
}

export async function unlikeComment(
  commentId: string,
  memberId: string,
): Promise<CommentLikeState> {
  return apiClient<CommentLikeState>(`/api/comments/${encodeURIComponent(commentId)}/like`, {
    method: "DELETE",
    headers: { "x-event-member-id": memberId },
  });
}
