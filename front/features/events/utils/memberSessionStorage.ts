const storageKey = (inviteToken: string) =>
  `hangwat:member-session:${inviteToken}`;

export const loadMemberSessionToken = (inviteToken: string): string | null => {
  const storedToken = window.localStorage.getItem(storageKey(inviteToken));

  return storedToken && storedToken.length > 0 ? storedToken : null;
};

export const saveMemberSessionToken = (
  inviteToken: string,
  token: string,
) => {
  window.localStorage.setItem(storageKey(inviteToken), token);
};

export const removeMemberSessionToken = (inviteToken: string) => {
  window.localStorage.removeItem(storageKey(inviteToken));
};
