import { DomainError } from "../DomainError.js";
import { Shape } from "../Shape.js";
import type { ShapeVisitor } from "../ShapeVisitor.js";
import { StyledShape } from "./StyledShape.js";

export class GroupShape extends StyledShape {
  private readonly _children: Shape[] = [];
  #managedByDocument = false;
  #structureToken: object | null = null;

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
    this.attachChild(shape);
  }

  public override removeChild(id: string): Shape | undefined {
    this.assertStructureEditable();
    return this.detachChild(id);
  }

  public bindDocumentToken(token: object): void {
    if (this.#structureToken !== null && this.#structureToken !== token) {
      throw new DomainError(
        "INVALID_TREE_MUTATION",
        `group already belongs to another SvgDocument: ${this.id}`
      );
    }

    this.#structureToken = token;
    this.#managedByDocument = true;
  }

  public releaseDocumentToken(token: object): void {
    this.assertDocumentToken(token);
    this.#structureToken = null;
    this.#managedByDocument = false;
  }

  /** Domain-internal entry used only by SvgDocument after global validation. */
  public appendChildForDocument(shape: Shape, token: object): void {
    this.assertDocumentToken(token);
    this.attachChild(shape);
  }

  /** Domain-internal entry used only by SvgDocument after global validation. */
  public insertChildForDocument(
    shape: Shape,
    index: number,
    token: object
  ): void {
    this.assertDocumentToken(token);

    if (!Number.isInteger(index) || index < 0 || index > this._children.length) {
      throw new DomainError(
        "INVALID_PARENT",
        `invalid child insertion index: ${index}`
      );
    }

    this.assertCanAttach(shape);
    this._children.splice(index, 0, shape);
  }

  /** Domain-internal entry used only by SvgDocument after global validation. */
  public removeChildForDocument(
    id: string,
    token: object
  ): Shape | undefined {
    this.assertDocumentToken(token);
    return this.detachChild(id);
  }

  private detachChild(id: string): Shape | undefined {
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
    if (this.#managedByDocument) {
      throw new DomainError(
        "INVALID_TREE_MUTATION",
        `cannot modify shape structure outside SvgDocument: ${this.id}`
      );
    }
  }

  private assertDocumentToken(token: object): void {
    if (this.#structureToken !== token) {
      throw new DomainError(
        "INVALID_TREE_MUTATION",
        `cannot modify shape structure outside SvgDocument: ${this.id}`
      );
    }
  }

  private attachChild(shape: Shape): void {
    this.assertCanAttach(shape);
    this._children.push(shape);
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
