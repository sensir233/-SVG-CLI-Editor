export type DomainErrorCode =
  | "INVALID_ID"
  | "INVALID_NUMBER"
  | "INVALID_SCALE_FACTOR"
  | "UNKNOWN_ATTRIBUTE"
  | "DUPLICATE_ID"
  | "SHAPE_NOT_FOUND"
  | "INVALID_PARENT"
  | "CYCLE_DETECTED"
  | "INVALID_CANVAS_SIZE"
  | "NUMERIC_OVERFLOW"
  | "INVALID_TREE_MUTATION"
  | "INVALID_STRUCTURE_OPERATION";

export class DomainError extends Error {
  public readonly code: DomainErrorCode;

  public constructor(code: DomainErrorCode, message: string) {
    super(message);
    this.name = "DomainError";
    this.code = code;
  }
}
