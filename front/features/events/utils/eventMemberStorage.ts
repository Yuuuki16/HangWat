const storageKey = (eventId: string) => `hangwat:event-member-id:${eventId}`;

export const loadEventMemberId = (eventId: string): string | null => {
  const storedId = window.localStorage.getItem(storageKey(eventId));

  return storedId && storedId.length > 0 ? storedId : null;
};

export const saveEventMemberId = (eventId: string, memberId: string) => {
  window.localStorage.setItem(storageKey(eventId), memberId);
};

export const removeEventMemberId = (eventId: string) => {
  window.localStorage.removeItem(storageKey(eventId));
};
