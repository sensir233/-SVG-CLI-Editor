import { DomainError } from "../DomainError.js";
import { Shape } from "../Shape.js";
import type { ShapeVisitor } from "../ShapeVisitor.js";
import { StyledShape } from "./StyledShape.js";

export class GroupShape extends StyledShape {
  private readonly _children: Shape[] = [];

  public constructor(
    id: string,
    fill?: string,
    stroke?: string,
    strokeWidth?: number
  ) {
    super(id, fill, stroke, strokeWidth);
  }

  public override get children(): readonly Shape[] {
    return [...this._children];
  }

  public override appendChild(shape: Shape): void {
    if (
      shape === this ||
      this.contains(shape) ||
      shape.contains(this)
    ) {
      throw new DomainError(
        "CYCLE_DETECTED",
        `cannot move a container into itself or its descendant: ${this.id}`
      );
    }

    this._children.push(shape);
  }

  public override removeChild(id: string): Shape | undefined {
    const index = this._children.findIndex((child) => child.id === id);

    if (index === -1) {
      return undefined;
    }

    const [removed] = this._children.splice(index, 1);
    return removed;
  }

  public override move(dx: number, dy: number): void {
    Shape.assertOffset(dx, dy);

    for (const child of this._children) {
      child.move(dx, dy);
    }
  }

  public override assertCanScale(factor: number): void {
    Shape.assertScaleFactor(factor);

    for (const child of this._children) {
      child.assertCanScale(factor);
    }
  }

  public override scale(factor: number): void {
    this.assertCanScale(factor);

    for (const child of this._children) {
      child.scale(factor);
    }
  }

  public override accept<T>(visitor: ShapeVisitor<T>): T {
    return visitor.visitGroup(this);
  }

  protected override setOwnAttribute(attribute: string): never {
    throw Shape.unknownAttribute(attribute);
  }
}
