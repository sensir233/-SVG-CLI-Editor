export type ApplicationErrorCode =
  | "NO_DOCUMENT"
  | "UNKNOWN_COMMAND"
  | "INVALID_ARGUMENT"
  | "UNKNOWN_SHAPE_TYPE"
  | "DOMAIN_ERROR"
  | "HISTORY_UNAVAILABLE"
  | "IO_BARRIER"
  | "INVALID_SNAPSHOT";

export class ApplicationError extends Error {
  public readonly code: ApplicationErrorCode;

  public constructor(code: ApplicationErrorCode, message: string) {
    super(message);
    this.name = "ApplicationError";
    this.code = code;
  }
}
