import { ApplicationError } from "../errors/applicationError.js";
import {
  EmailAlreadyExistsError,
  type AuthUser,
  type AuthRepository,
} from "../../domain/repositories/authRepository.js";
import type { PasswordHasher } from "../../domain/services/passwordHasher.js";


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

    if (credential === null) {
      // ユーザー不在時もハッシュ演算を実行し、応答時間差によるアカウント列挙を防ぐ。
      await this.passwordHasher.hash(input.password);
      throw new ApplicationError(
        "UNAUTHORIZED",
        "メールアドレスまたはパスワードが正しくありません",
      );
    }

    const passwordMatches = await this.passwordHasher.verify(
      input.password,
      credential.passwordHash,
    );

    if (!passwordMatches) {
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
