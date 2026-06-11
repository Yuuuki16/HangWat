export interface HealthRepository {
  check(): Promise<void>;
}
