const storageKey = (eventId: string, candidateId: string) =>
  `hangwat:comment-likes:${eventId}:${candidateId}`;

export const loadLikedCommentIds = (
  eventId: string,
  candidateId: string,
): string[] => {
  const storedLikes = window.localStorage.getItem(
    storageKey(eventId, candidateId),
  );

  if (!storedLikes) {
    return [];
  }

  try {
    return JSON.parse(storedLikes) as string[];
  } catch {
    return [];
  }
};

export const saveLikedCommentIds = (
  eventId: string,
  candidateId: string,
  commentIds: string[],
) => {
  window.localStorage.setItem(
    storageKey(eventId, candidateId),
    JSON.stringify(commentIds),
  );
};

export const deleteCandidateLikes = (
  eventId: string,
  candidateId: string,
) => {
  window.localStorage.removeItem(storageKey(eventId, candidateId));
};
