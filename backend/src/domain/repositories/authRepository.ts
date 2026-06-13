export type AuthUser = {
  id: bigint;
  name: string;
  email: string;
  avatarUrl: string | null;
};

export interface AuthRepository {
  findUserByEmail(email: string): Promise<{ id: bigint } | null>;
  createUser(input: {
    name: string;
    email: string;
    passwordHash: string;
  }): Promise<AuthUser>;
}
