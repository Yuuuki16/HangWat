import type { PrismaClient } from "@prisma/client";

import type {
  AuthUser,
  AuthUserCredential,
  AuthRepository,
} from "../../domain/repositories/authRepository.js";

export class PrismaAuthRepository implements AuthRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findUserByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    return user satisfies { id: bigint } | null;
  }

  async createUser(input: {
    name: string;
    email: string;
    passwordHash: string;
  }) {
    const user = await this.prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash: input.passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
      },
    });

    return user satisfies AuthUser;
  }

  async findCredentialByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        passwordHash: true,
      },
    });

    return user satisfies AuthUserCredential | null;
  }
}
