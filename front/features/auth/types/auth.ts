export type AuthUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
};

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

export type ValidationDetail = {
  field: string;
  message: string;
};
