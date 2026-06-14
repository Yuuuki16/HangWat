const eventMemberStorageKeys = (eventId: string) => [
  `hangwat:event-member-id:${eventId}`,
  `hangwat:eventMemberId:${eventId}`,
  "hangwat:event-member-id",
  "hangwat:eventMemberId",
];

export const getStoredEventMemberId = (eventId: string) => {
  for (const key of eventMemberStorageKeys(eventId)) {
    const value = window.localStorage.getItem(key);

    if (value) {
      return value;
    }
  }

  return null;
};

export const saveEventMemberId = (eventId: string, eventMemberId: string) => {
  window.localStorage.setItem(
    `hangwat:event-member-id:${eventId}`,
    eventMemberId,
  );
};

export const clearEventMemberId = (eventId: string) => {
  for (const key of eventMemberStorageKeys(eventId)) {
    window.localStorage.removeItem(key);
  }
};
