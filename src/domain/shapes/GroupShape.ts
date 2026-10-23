import { DomainError } from "../DomainError.js";
import { Shape } from "../Shape.js";
import type { ShapeVisitor } from "../ShapeVisitor.js";
import { StyledShape } from "./StyledShape.js";

export class GroupShape extends StyledShape {
  private readonly _children: Shape[] = [];
  private _managedByDocument = false;

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
    this.assertStructureEditable();
    this.appendChildForDocument(shape);
  }

  public override removeChild(id: string): Shape | undefined {
    this.assertStructureEditable();
    return this.removeChildForDocument(id);
  }

  /** Domain-internal ownership flag managed by SvgDocument. */
  public markDocumentManaged(managed: boolean): void {
    this._managedByDocument = managed;
  }

  /** Domain-internal entry used only by SvgDocument after global validation. */
  public appendChildForDocument(shape: Shape): void {
    this.assertCanAttach(shape);
    this._children.push(shape);
  }

  /** Domain-internal entry used only by SvgDocument after global validation. */
  public insertChildForDocument(shape: Shape, index: number): void {
    this.assertCanAttach(shape);

    if (!Number.isInteger(index) || index < 0 || index > this._children.length) {
      throw new DomainError(
        "INVALID_PARENT",
        `invalid child insertion index: ${index}`
      );
    }

    this._children.splice(index, 0, shape);
  }

  /** Domain-internal entry used only by SvgDocument after global validation. */
  public removeChildForDocument(id: string): Shape | undefined {
    const index = this._children.findIndex((child) => child.id === id);

    if (index === -1) {
      return undefined;
    }

    const [removed] = this._children.splice(index, 1);
    return removed;
  }

  public override move(dx: number, dy: number): void {
    this.assertCanMove(dx, dy);

    for (const child of this._children) {
      child.move(dx, dy);
    }
  }

  public override assertCanMove(dx: number, dy: number): void {
    Shape.assertOffset(dx, dy);

    for (const child of this._children) {
      child.assertCanMove(dx, dy);
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

  private assertStructureEditable(): void {
    if (this._managedByDocument) {
      throw new DomainError(
        "INVALID_TREE_MUTATION",
        `cannot modify shape structure outside SvgDocument: ${this.id}`
      );
    }
  }

  private assertCanAttach(shape: Shape): void {
    if (shape === this || this.contains(shape) || shape.contains(this)) {
      throw new DomainError(
        "CYCLE_DETECTED",
        `cannot move a container into itself or its descendant: ${this.id}`
      );
    }
  }
}
