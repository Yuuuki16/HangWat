export type AuthUser = {
  id: bigint;
  name: string;
  email: string;
  avatarUrl: string | null;
};

export type AuthUserCredential = AuthUser & {
  passwordHash: string;
};

export interface AuthRepository {
  findUserByEmail(email: string): Promise<{ id: bigint } | null>;
  findUserById(id: bigint): Promise<AuthUser | null>;
  createUser(input: {
    name: string;
    email: string;
    passwordHash: string;
  }): Promise<AuthUser>;
  findCredentialByEmail(email: string): Promise<AuthUserCredential | null>;
}
