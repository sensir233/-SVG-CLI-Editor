import { ApplicationError } from "./ApplicationError.js";

export class CommandArguments {
  public constructor(
    private readonly arguments_: readonly string[],
    private readonly usage: string
  ) {}

  public requireExactCount(expected: number): void {
    if (this.arguments_.length !== expected) {
      this.rejectUsage();
    }
  }

  public requireMinimum(count: number): void {
    if (this.arguments_.length < count) {
      this.rejectUsage();
    }
  }

  public requireRange(minimum: number, maximum: number): void {
    if (
      this.arguments_.length < minimum ||
      this.arguments_.length > maximum
    ) {
      this.rejectUsage();
    }
  }

  public optional(index: number): string | undefined {
    return this.arguments_[index];
  }

  public required(index: number): string {
    const value = this.arguments_[index];

    if (value === undefined) {
      this.rejectUsage();
    }

    return value;
  }

  public finiteNumber(index: number, label: string): number {
    const raw = this.optional(index);

    if (raw === undefined) {
      this.rejectUsage();
    }

    const normalized = raw.trim();
    const decimalPattern =
      /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;

    if (normalized.length === 0 || !decimalPattern.test(normalized)) {
      throw this.invalidNumber(label, raw);
    }

    const value = Number(normalized);

    if (!Number.isFinite(value)) {
      throw this.invalidNumber(label, raw);
    }

    return value;
  }

  public rejectUsage(): never {
    throw new ApplicationError(
      "INVALID_ARGUMENT",
      `usage: ${this.usage}`
    );
  }

  private invalidNumber(label: string, value: string): ApplicationError {
    return new ApplicationError(
      "INVALID_ARGUMENT",
      `invalid ${label}: ${value}`
    );
  }
}
