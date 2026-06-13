import { ApplicationError } from "../errors/applicationError.js";
import {
  EmailAlreadyExistsError,
  type AuthUser,
  type AuthRepository,
} from "../../domain/repositories/authRepository.js";
import type { PasswordHasher } from "../../domain/services/passwordHasher.js";

// 未登録メール時もパスワード検証を実行し、応答時間差によるアカウント列挙を防ぐためのダミーハッシュ。
const dummyPasswordHash =
  "scrypt$343ccd549e564a159e2c08bf26d31ebb$e0df2a29cf46bc6e4c59589af865f6444510dec61b7c1ffce19d96e7860d4869dade92df38a9be07e59c0b5d0faed7f3f62569a71c509fcf8dea1ff68ab3256a";

export type AuthUserDto = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
};

export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async register(input: {
    name: string;
    email: string;
    password: string;
  }): Promise<AuthUserDto> {
    const passwordHash = await this.passwordHasher.hash(input.password);

    try {
      const user = await this.authRepository.createUser({
        name: input.name,
        email: input.email,
        passwordHash,
      });

      return this.toUserDto(user);
    } catch (error) {
      if (error instanceof EmailAlreadyExistsError) {
        throw new ApplicationError(
          "CONFLICT",
          "このメールアドレスは既に使用されています",
        );
      }

      throw error;
    }
  }

  async login(input: {
    email: string;
    password: string;
  }): Promise<AuthUserDto> {
    const credential = await this.authRepository.findCredentialByEmail(
      input.email,
    );

    const passwordMatches = await this.passwordHasher.verify(
      input.password,
      credential?.passwordHash ?? dummyPasswordHash,
    );

    if (credential === null || !passwordMatches) {
      throw new ApplicationError(
        "UNAUTHORIZED",
        "メールアドレスまたはパスワードが正しくありません",
      );
    }

    return this.toUserDto(credential);
  }

  async getCurrentUser(userId: bigint): Promise<AuthUserDto> {
    const user = await this.authRepository.findUserById(userId);
    if (user === null) {
      throw new ApplicationError("UNAUTHORIZED", "ログインが必要です");
    }

    return this.toUserDto(user);
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
