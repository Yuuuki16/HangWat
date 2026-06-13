export type AuthUser = {
  id: bigint;
  name: string;
  email: string;
  avatarUrl: string | null;
};

export type AuthUserCredential = AuthUser & {
  passwordHash: string;
};

export class EmailAlreadyExistsError extends Error {
  constructor() {
    super("Email already exists");
    this.name = "EmailAlreadyExistsError";
  }
}

export interface AuthRepository {
  findUserById(id: bigint): Promise<AuthUser | null>;
  createUser(input: {
    name: string;
    email: string;
    passwordHash: string;
  }): Promise<AuthUser>;
  findCredentialByEmail(email: string): Promise<AuthUserCredential | null>;
}
