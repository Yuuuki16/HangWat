export type ApplicationErrorCode = "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND";

export class ApplicationError extends Error {
  constructor(
    readonly code: ApplicationErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ApplicationError";
  }
}
