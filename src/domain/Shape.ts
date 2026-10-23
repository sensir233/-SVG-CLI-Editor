import { DomainError } from "./DomainError.js";
import type { ShapeVisitor } from "./ShapeVisitor.js";

export abstract class Shape {
  private readonly _id: string;

  protected constructor(id: string) {
    if (typeof id !== "string" || id.length === 0) {
      throw new DomainError("INVALID_ID", "invalid id: ids must be non-empty");
    }

    this._id = id;
  }

  public get id(): string {
    return this._id;
  }

  public get children(): readonly Shape[] {
    return [];
  }

  public contains(candidate: Shape): boolean {
    for (const child of this.children) {
      if (child === candidate || child.contains(candidate)) {
        return true;
      }
    }

    return false;
  }

  public appendChild(_child: Shape): void {
    throw new DomainError("INVALID_PARENT", `not a container: ${this.id}`);
  }

  public removeChild(_id: string): Shape | undefined {
    return undefined;
  }

  public abstract move(dx: number, dy: number): void;

  public abstract assertCanMove(dx: number, dy: number): void;

  public abstract assertCanScale(factor: number): void;

  public abstract scale(factor: number): void;

  public abstract setAttribute(attribute: string, value: string): void;

  public abstract accept<T>(visitor: ShapeVisitor<T>): T;

  protected static parseFiniteNumber(
    attribute: string,
    value: number | string
  ): number {
    let parsed: number;

    if (typeof value === "number") {
      parsed = value;
    } else {
      const normalized = value.trim();
      const decimalPattern =
        /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;

      if (normalized.length === 0 || !decimalPattern.test(normalized)) {
        throw Shape.invalidNumber(attribute, value);
      }

      parsed = Number(normalized);
    }

    if (!Number.isFinite(parsed)) {
      throw Shape.invalidNumber(attribute, value);
    }

    return parsed;
  }

  protected static parseNonNegativeNumber(
    attribute: string,
    value: number | string
  ): number {
    const parsed = Shape.parseFiniteNumber(attribute, value);

    if (parsed < 0) {
      throw Shape.invalidNumber(attribute, value);
    }

    return parsed;
  }

  protected static parsePositiveNumber(
    attribute: string,
    value: number | string
  ): number {
    const parsed = Shape.parseFiniteNumber(attribute, value);

    if (parsed <= 0) {
      throw Shape.invalidNumber(attribute, value);
    }

    return parsed;
  }

  protected static assertScaleFactor(factor: number): void {
    if (!Number.isFinite(factor) || factor <= 0) {
      throw new DomainError(
        "INVALID_SCALE_FACTOR",
        "scale factor must be positive"
      );
    }
  }

  protected static assertOffset(dx: number, dy: number): void {
    if (!Number.isFinite(dx)) {
      throw Shape.invalidNumber("dx", dx);
    }

    if (!Number.isFinite(dy)) {
      throw Shape.invalidNumber("dy", dy);
    }
  }

  protected static scaledValue(
    attribute: string,
    value: number,
    factor: number
  ): number {
    const scaled = value * factor;

    if (!Number.isFinite(scaled)) {
      throw new DomainError(
        "NUMERIC_OVERFLOW",
        `numeric overflow while scaling: ${attribute}`
      );
    }

    return scaled;
  }

  protected static movedValue(
    attribute: string,
    value: number,
    offset: number
  ): number {
    const moved = value + offset;

    if (!Number.isFinite(moved)) {
      throw new DomainError(
        "NUMERIC_OVERFLOW",
        `numeric overflow while moving: ${attribute}`
      );
    }

    return moved;
  }

  protected static unknownAttribute(attribute: string): DomainError {
    return new DomainError(
      "UNKNOWN_ATTRIBUTE",
      `unknown attribute: ${attribute}`
    );
  }

  private static invalidNumber(
    attribute: string,
    value: number | string
  ): DomainError {
    return new DomainError(
      "INVALID_NUMBER",
      `invalid ${attribute}: ${String(value)}`
    );
  }
}
