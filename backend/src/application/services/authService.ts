import { ApplicationError } from "../errors/applicationError.js";
import type {
  AuthUser,
  AuthRepository,
} from "../../domain/repositories/authRepository.js";
import {
  hashPassword,
  verifyPassword,
} from "../../infrastructure/auth/passwordHasher.js";

export type AuthUserDto = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
};

export class AuthService {
  constructor(private readonly authRepository: AuthRepository) {}

  async register(input: {
    name: string;
    email: string;
    password: string;
  }): Promise<AuthUserDto> {
    const existingUser = await this.authRepository.findUserByEmail(input.email);
    if (existingUser !== null) {
      throw new ApplicationError(
        "CONFLICT",
        "このメールアドレスは既に使用されています",
      );
    }

    const passwordHash = await hashPassword(input.password);
    const user = await this.authRepository.createUser({
      name: input.name,
      email: input.email,
      passwordHash,
    });

    return this.toUserDto(user);
  }

  async login(input: {
    email: string;
    password: string;
  }): Promise<AuthUserDto> {
    const credential = await this.authRepository.findCredentialByEmail(
      input.email,
    );

    const passwordMatches =
      credential !== null &&
      (await verifyPassword(input.password, credential.passwordHash));

    if (credential === null || !passwordMatches) {
      throw new ApplicationError(
        "UNAUTHORIZED",
        "メールアドレスまたはパスワードが正しくありません",
      );
    }

    return this.toUserDto(credential);
  }

  private toUserDto(user: AuthUser): AuthUserDto {
    return {
      id: user.id.toString(),
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
    };
  }
}
