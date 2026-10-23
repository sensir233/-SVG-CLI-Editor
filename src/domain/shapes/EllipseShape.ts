import { Shape } from "../Shape.js";
import type { ShapeVisitor } from "../ShapeVisitor.js";
import { StyledShape } from "./StyledShape.js";

export class EllipseShape extends StyledShape {
  private _cx: number;
  private _cy: number;
  private _rx: number;
  private _ry: number;

  public constructor(
    id: string,
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    fill?: string,
    stroke?: string,
    strokeWidth?: number
  ) {
    super(id, fill, stroke, strokeWidth);
    this._cx = Shape.parseFiniteNumber("cx", cx);
    this._cy = Shape.parseFiniteNumber("cy", cy);
    this._rx = Shape.parseNonNegativeNumber("rx", rx);
    this._ry = Shape.parseNonNegativeNumber("ry", ry);
  }

  public get cx(): number {
    return this._cx;
  }

  public get cy(): number {
    return this._cy;
  }

  public get rx(): number {
    return this._rx;
  }

  public get ry(): number {
    return this._ry;
  }

  public override move(dx: number, dy: number): void {
    this.assertCanMove(dx, dy);
    this._cx = Shape.movedValue("cx", this._cx, dx);
    this._cy = Shape.movedValue("cy", this._cy, dy);
  }

  public override assertCanMove(dx: number, dy: number): void {
    Shape.assertOffset(dx, dy);
    Shape.movedValue("cx", this._cx, dx);
    Shape.movedValue("cy", this._cy, dy);
  }

  public override assertCanScale(factor: number): void {
    Shape.assertScaleFactor(factor);
    Shape.scaledValue("cx", this._cx, factor);
    Shape.scaledValue("cy", this._cy, factor);
    Shape.scaledValue("rx", this._rx, factor);
    Shape.scaledValue("ry", this._ry, factor);
  }

  public override scale(factor: number): void {
    this.assertCanScale(factor);
    this._cx = Shape.scaledValue("cx", this._cx, factor);
    this._cy = Shape.scaledValue("cy", this._cy, factor);
    this._rx = Shape.scaledValue("rx", this._rx, factor);
    this._ry = Shape.scaledValue("ry", this._ry, factor);
  }

  public override accept<T>(visitor: ShapeVisitor<T>): T {
    return visitor.visitEllipse(this);
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

    if (attribute === "rx") {
      this._rx = Shape.parseNonNegativeNumber(attribute, value);
      return;
    }

    if (attribute === "ry") {
      this._ry = Shape.parseNonNegativeNumber(attribute, value);
      return;
    }

    throw Shape.unknownAttribute(attribute);
  }
}
