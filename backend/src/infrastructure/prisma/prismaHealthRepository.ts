import type { PrismaClient } from "@prisma/client";

import type { HealthRepository } from "../../domain/repositories/healthRepository.js";

export class PrismaHealthRepository implements HealthRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async check() {
    await this.prisma.$queryRaw`SELECT 1`;
  }
}
