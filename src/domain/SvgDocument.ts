import { DomainError } from "./DomainError.js";
import { GroupShape } from "./shapes/GroupShape.js";
import { Shape } from "./Shape.js";

export class SvgDocument {
  private _width: number;
  private _height: number;
  private readonly _rootChildren: Shape[] = [];
  private readonly _shapesById = new Map<string, Shape>();
  private readonly _parentsById = new Map<string, Shape | null>();

  public constructor(width: number, height: number) {
    this._width = SvgDocument.parseCanvasDimension("width", width);
    this._height = SvgDocument.parseCanvasDimension("height", height);
  }

  public get width(): number {
    return this._width;
  }

  public get height(): number {
    return this._height;
  }

  public get rootChildren(): readonly Shape[] {
    return [...this._rootChildren];
  }

  public get shapeCount(): number {
    return this._shapesById.size;
  }

  public setCanvasSize(width: number, height: number): void {
    const nextWidth = SvgDocument.parseCanvasDimension("width", width);
    const nextHeight = SvgDocument.parseCanvasDimension("height", height);

    this._width = nextWidth;
    this._height = nextHeight;
  }

  public findById(id: string): Shape | undefined {
    return this._shapesById.get(id);
  }

  public parentOf(id: string): Shape | null | undefined {
    return this._parentsById.get(id);
  }

  public addShape(shape: Shape, parent: GroupShape | null = null): void {
    if (this._shapesById.has(shape.id)) {
      throw new DomainError(
        "DUPLICATE_ID",
        `id already exists: ${shape.id}`
      );
    }

    if (parent !== null) {
      if (this._shapesById.get(parent.id) !== parent) {
        throw new DomainError(
          "INVALID_PARENT",
          `no such container: ${parent.id}`
        );
      }

      if (
        shape === parent ||
        shape.contains(parent) ||
        parent.contains(shape)
      ) {
        throw new DomainError(
          "CYCLE_DETECTED",
          `cannot move a container into itself or its descendant: ${parent.id}`
        );
      }
    }

    const subtree = this.collectSubtree(shape);
    const subtreeIds = new Set<string>();

    for (const node of subtree) {
      if (subtreeIds.has(node.id) || this._shapesById.has(node.id)) {
        throw new DomainError(
          "DUPLICATE_ID",
          `id already exists: ${node.id}`
        );
      }

      subtreeIds.add(node.id);
    }

    if (parent === null) {
      this._rootChildren.push(shape);
    } else {
      parent.appendChild(shape);
    }

    this.registerSubtree(shape, parent);
  }

  public removeShape(id: string): Shape {
    const shape = this.requireShape(id);
    const parent = this._parentsById.get(id);

    if (parent === null) {
      const rootIndex = this._rootChildren.findIndex(
        (child) => child === shape
      );

      if (rootIndex === -1) {
        throw new DomainError(
          "INVALID_PARENT",
          `inconsistent parent relationship: ${id}`
        );
      }

      this._rootChildren.splice(rootIndex, 1);
    } else if (parent !== undefined) {
      const removed = parent.removeChild(id);

      if (removed !== shape) {
        throw new DomainError(
          "INVALID_PARENT",
          `inconsistent parent relationship: ${id}`
        );
      }
    } else {
      throw new DomainError(
        "INVALID_PARENT",
        `inconsistent parent relationship: ${id}`
      );
    }

    this.unregisterSubtree(shape);
    return shape;
  }

  private requireShape(id: string): Shape {
    const shape = this._shapesById.get(id);

    if (shape === undefined) {
      throw new DomainError("SHAPE_NOT_FOUND", `no such shape: ${id}`);
    }

    return shape;
  }

  private collectSubtree(root: Shape): Shape[] {
    const nodes: Shape[] = [];
    const pending: Shape[] = [root];

    while (pending.length > 0) {
      const shape = pending.pop();

      if (shape === undefined) {
        continue;
      }

      nodes.push(shape);
      pending.push(...shape.children);
    }

    return nodes;
  }

  private registerSubtree(root: Shape, parent: Shape | null): void {
    const pending: Array<{ shape: Shape; parent: Shape | null }> = [
      { shape: root, parent }
    ];

    while (pending.length > 0) {
      const entry = pending.pop();

      if (entry === undefined) {
        continue;
      }

      this._shapesById.set(entry.shape.id, entry.shape);
      this._parentsById.set(entry.shape.id, entry.parent);

      for (const child of entry.shape.children) {
        pending.push({ shape: child, parent: entry.shape });
      }
    }
  }

  private unregisterSubtree(root: Shape): void {
    for (const shape of this.collectSubtree(root)) {
      this._parentsById.delete(shape.id);
      this._shapesById.delete(shape.id);
    }
  }

  private static parseCanvasDimension(
    attribute: string,
    value: number
  ): number {
    if (!Number.isFinite(value) || value <= 0) {
      throw new DomainError(
        "INVALID_CANVAS_SIZE",
        `invalid ${attribute}: ${String(value)}`
      );
    }

    return value;
  }
}
