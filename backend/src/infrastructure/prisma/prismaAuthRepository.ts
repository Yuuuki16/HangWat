import { Prisma, type PrismaClient } from "@prisma/client";

import {
  EmailAlreadyExistsError,
  type AuthUser,
  type AuthUserCredential,
  type AuthRepository,
} from "../../domain/repositories/authRepository.js";

const uniqueConstraintViolationCode = "P2002";

export class PrismaAuthRepository implements AuthRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createUser(input: {
    name: string;
    email: string;
    passwordHash: string;
  }) {
    try {
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
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === uniqueConstraintViolationCode
      ) {
        throw new EmailAlreadyExistsError();
      }

      throw error;
    }
  }

  async findUserById(id: bigint) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
      },
    });

    return user satisfies AuthUser | null;
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
