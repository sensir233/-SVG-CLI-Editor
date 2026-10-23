import { Shape } from "../Shape.js";
import type { ShapeVisitor } from "../ShapeVisitor.js";
import { StyledShape } from "./StyledShape.js";

export class CircleShape extends StyledShape {
  private _cx: number;
  private _cy: number;
  private _r: number;

  public constructor(
    id: string,
    cx: number,
    cy: number,
    r: number,
    fill?: string,
    stroke?: string,
    strokeWidth?: number
  ) {
    super(id, fill, stroke, strokeWidth);
    this._cx = Shape.parseFiniteNumber("cx", cx);
    this._cy = Shape.parseFiniteNumber("cy", cy);
    this._r = Shape.parseNonNegativeNumber("r", r);
  }

  public get cx(): number {
    return this._cx;
  }

  public get cy(): number {
    return this._cy;
  }

  public get r(): number {
    return this._r;
  }

  public override move(dx: number, dy: number): void {
    Shape.assertOffset(dx, dy);
    this._cx += dx;
    this._cy += dy;
  }

  public override assertCanScale(factor: number): void {
    Shape.assertScaleFactor(factor);
    Shape.scaledValue("cx", this._cx, factor);
    Shape.scaledValue("cy", this._cy, factor);
    Shape.scaledValue("r", this._r, factor);
  }

  public override scale(factor: number): void {
    this.assertCanScale(factor);
    this._cx = Shape.scaledValue("cx", this._cx, factor);
    this._cy = Shape.scaledValue("cy", this._cy, factor);
    this._r = Shape.scaledValue("r", this._r, factor);
  }

  public override accept<T>(visitor: ShapeVisitor<T>): T {
    return visitor.visitCircle(this);
  }

  protected override setOwnAttribute(
    attribute: string,
    value: string
  ): void {
    if (attribute === "cx") {
      this._cx = Shape.parseFiniteNumber(attribute, value);
      return;
    }

    if (attribute === "cy") {
      this._cy = Shape.parseFiniteNumber(attribute, value);
      return;
    }

    if (attribute === "r") {
      this._r = Shape.parseNonNegativeNumber(attribute, value);
      return;
    }

    throw Shape.unknownAttribute(attribute);
  }
}
