import { Shape } from "../Shape.js";
import type { ShapeVisitor } from "../ShapeVisitor.js";
import { StyledShape } from "./StyledShape.js";

export class RectShape extends StyledShape {
  private _x: number;
  private _y: number;
  private _width: number;
  private _height: number;

  public constructor(
    id: string,
    x: number,
    y: number,
    width: number,
    height: number,
    fill?: string,
    stroke?: string,
    strokeWidth?: number
  ) {
    super(id, fill, stroke, strokeWidth);
    this._x = Shape.parseFiniteNumber("x", x);
    this._y = Shape.parseFiniteNumber("y", y);
    this._width = Shape.parseNonNegativeNumber("width", width);
    this._height = Shape.parseNonNegativeNumber("height", height);
  }

  public get x(): number {
    return this._x;
  }

  public get y(): number {
    return this._y;
  }

  public get width(): number {
    return this._width;
  }

  public get height(): number {
    return this._height;
  }

  public override move(dx: number, dy: number): void {
    Shape.assertOffset(dx, dy);
    this._x += dx;
    this._y += dy;
  }

  public override assertCanScale(factor: number): void {
    Shape.assertScaleFactor(factor);
    Shape.scaledValue("x", this._x, factor);
    Shape.scaledValue("y", this._y, factor);
    Shape.scaledValue("width", this._width, factor);
    Shape.scaledValue("height", this._height, factor);
  }

  public override scale(factor: number): void {
    this.assertCanScale(factor);
    this._x = Shape.scaledValue("x", this._x, factor);
    this._y = Shape.scaledValue("y", this._y, factor);
    this._width = Shape.scaledValue("width", this._width, factor);
    this._height = Shape.scaledValue("height", this._height, factor);
  }

  public override accept<T>(visitor: ShapeVisitor<T>): T {
    return visitor.visitRect(this);
  }

  protected override setOwnAttribute(
    attribute: string,
    value: string
  ): void {
    if (attribute === "x") {
      this._x = Shape.parseFiniteNumber(attribute, value);
      return;
    }

    if (attribute === "y") {
      this._y = Shape.parseFiniteNumber(attribute, value);
      return;
    }

    if (attribute === "width") {
      this._width = Shape.parseNonNegativeNumber(attribute, value);
      return;
    }

    if (attribute === "height") {
      this._height = Shape.parseNonNegativeNumber(attribute, value);
      return;
    }

    throw Shape.unknownAttribute(attribute);
  }
}
