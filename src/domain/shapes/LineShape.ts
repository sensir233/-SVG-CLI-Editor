import { Shape } from "../Shape.js";
import type { ShapeVisitor } from "../ShapeVisitor.js";
import { StyledShape } from "./StyledShape.js";

export class LineShape extends StyledShape {
  private _x1: number;
  private _y1: number;
  private _x2: number;
  private _y2: number;

  public constructor(
    id: string,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    fill?: string,
    stroke?: string,
    strokeWidth?: number
  ) {
    super(id, fill, stroke, strokeWidth);
    this._x1 = Shape.parseFiniteNumber("x1", x1);
    this._y1 = Shape.parseFiniteNumber("y1", y1);
    this._x2 = Shape.parseFiniteNumber("x2", x2);
    this._y2 = Shape.parseFiniteNumber("y2", y2);
  }

  public get x1(): number {
    return this._x1;
  }

  public get y1(): number {
    return this._y1;
  }

  public get x2(): number {
    return this._x2;
  }

  public get y2(): number {
    return this._y2;
  }

  public override move(dx: number, dy: number): void {
    Shape.assertOffset(dx, dy);
    this._x1 += dx;
    this._y1 += dy;
    this._x2 += dx;
    this._y2 += dy;
  }

  public override scale(factor: number): void {
    Shape.assertScaleFactor(factor);
    this._x1 *= factor;
    this._y1 *= factor;
    this._x2 *= factor;
    this._y2 *= factor;
  }

  public override accept<T>(visitor: ShapeVisitor<T>): T {
    return visitor.visitLine(this);
  }

  protected override setOwnAttribute(
    attribute: string,
    value: string
  ): void {
    if (attribute === "x1") {
      this._x1 = Shape.parseFiniteNumber(attribute, value);
      return;
    }

    if (attribute === "y1") {
      this._y1 = Shape.parseFiniteNumber(attribute, value);
      return;
    }

    if (attribute === "x2") {
      this._x2 = Shape.parseFiniteNumber(attribute, value);
      return;
    }

    if (attribute === "y2") {
      this._y2 = Shape.parseFiniteNumber(attribute, value);
      return;
    }

    throw Shape.unknownAttribute(attribute);
  }
}
