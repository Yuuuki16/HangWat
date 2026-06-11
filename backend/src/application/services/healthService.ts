import type { HealthRepository } from "../../domain/repositories/healthRepository.js";

export class HealthService {
  constructor(private readonly healthRepository: HealthRepository) {}

  async check() {
    await this.healthRepository.check();
  }
}
