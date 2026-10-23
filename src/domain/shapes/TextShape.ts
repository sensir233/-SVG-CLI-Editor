import { Shape } from "../Shape.js";
import type { ShapeVisitor } from "../ShapeVisitor.js";
import { StyledShape } from "./StyledShape.js";

export class TextShape extends StyledShape {
  private _x: number;
  private _y: number;
  private _text: string;

  public constructor(
    id: string,
    x: number,
    y: number,
    text: string,
    fill?: string,
    stroke?: string,
    strokeWidth?: number
  ) {
    super(id, fill, stroke, strokeWidth);
    this._x = Shape.parseFiniteNumber("x", x);
    this._y = Shape.parseFiniteNumber("y", y);
    this._text = text;
  }

  public get x(): number {
    return this._x;
  }

  public get y(): number {
    return this._y;
  }

  public get text(): string {
    return this._text;
  }

  public override move(dx: number, dy: number): void {
    this.assertCanMove(dx, dy);
    this._x = Shape.movedValue("x", this._x, dx);
    this._y = Shape.movedValue("y", this._y, dy);
  }

  public override assertCanMove(dx: number, dy: number): void {
    Shape.assertOffset(dx, dy);
    Shape.movedValue("x", this._x, dx);
    Shape.movedValue("y", this._y, dy);
  }

  public override assertCanScale(factor: number): void {
    Shape.assertScaleFactor(factor);
    Shape.scaledValue("x", this._x, factor);
    Shape.scaledValue("y", this._y, factor);
  }

  public override scale(factor: number): void {
    this.assertCanScale(factor);
    this._x = Shape.scaledValue("x", this._x, factor);
    this._y = Shape.scaledValue("y", this._y, factor);
  }

  public override accept<T>(visitor: ShapeVisitor<T>): T {
    return visitor.visitText(this);
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

    if (attribute === "text") {
      this._text = value;
      return;
    }

    throw Shape.unknownAttribute(attribute);
  }
}
