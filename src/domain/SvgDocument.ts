import { DomainError } from "./DomainError.js";
import { GroupShape } from "./shapes/GroupShape.js";
import { Shape } from "./Shape.js";

export class SvgDocument {
  #structureToken: object = {};
  private _width: number;
  private _height: number;
  private readonly _rootChildren: Shape[] = [];
  private readonly _shapesById = new Map<string, Shape>();
  private readonly _parentsById = new Map<string, GroupShape | null>();

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

  public parentOf(id: string): GroupShape | null | undefined {
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

    this.bindDocumentSubtrees(shape);

    if (parent === null) {
      this._rootChildren.push(shape);
    } else {
      parent.appendChildForDocument(shape, this.#structureToken);
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
      const removed = parent.removeChildForDocument(
        id,
        this.#structureToken
      );

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

  public groupShapes(
    newGroupId: string,
    memberIds: readonly string[]
  ): GroupShape {
    if (memberIds.length < 2) {
      throw new DomainError(
        "INVALID_STRUCTURE_OPERATION",
        "group requires at least two shapes"
      );
    }

    if (this._shapesById.has(newGroupId)) {
      throw new DomainError(
        "DUPLICATE_ID",
        `id already exists: ${newGroupId}`
      );
    }

    const uniqueIds = new Set<string>();
    const members: Shape[] = [];

    for (const id of memberIds) {
      if (uniqueIds.has(id)) {
        throw new DomainError(
          "DUPLICATE_ID",
          `duplicate group member: ${id}`
        );
      }

      uniqueIds.add(id);
      members.push(this.requireShape(id));
    }

    for (let ancestorIndex = 0; ancestorIndex < members.length; ancestorIndex += 1) {
      for (let descendantIndex = 0; descendantIndex < members.length; descendantIndex += 1) {
        if (ancestorIndex === descendantIndex) {
          continue;
        }

        const ancestor = members[ancestorIndex];
        const descendant = members[descendantIndex];

        if (
          ancestor !== undefined &&
          descendant !== undefined &&
          ancestor.contains(descendant)
        ) {
          throw new DomainError(
            "CYCLE_DETECTED",
            `cannot group a container into its own descendant: ${ancestor.id}`
          );
        }
      }
    }

    const firstMember = members[0];

    if (firstMember === undefined) {
      throw new DomainError(
        "INVALID_STRUCTURE_OPERATION",
        "group requires at least two shapes"
      );
    }

    const originalParent = this.getParent(firstMember);
    const sharedParent = members.every(
      (member) => this.getParent(member) === originalParent
    );
    const insertionParent = sharedParent ? originalParent : null;
    const rootMembers = members.filter(
      (member) => this.getParent(member) === null
    ).length;
    const insertionIndex = sharedParent
      ? Math.min(
          ...members.map((member) =>
            this.indexOfChild(member, insertionParent)
          )
        )
      : this._rootChildren.length - rootMembers;

    this.assertInsertionTarget(insertionParent, insertionIndex);
    const group = new GroupShape(newGroupId);
    group.bindDocumentToken(this.#structureToken);

    for (const member of members) {
      this.detachForStructureChange(member);
    }

    for (const member of members) {
      group.appendChildForDocument(member, this.#structureToken);
    }

    this.insertForStructureChange(group, insertionParent, insertionIndex);
    this.registerSubtree(group, insertionParent);
    return group;
  }

  public ungroupShape(groupId: string): GroupShape {
    const group = this.requireGroup(groupId);
    const parent = this.getParent(group);

    if (parent === null) {
      throw new DomainError(
        "INVALID_STRUCTURE_OPERATION",
        `cannot ungroup top-level container: ${groupId}`
      );
    }

    const groupIndex = this.indexOfChild(group, parent);
    const children = [...group.children];

    for (const child of children) {
      if (this._parentsById.get(child.id) !== group) {
        throw new DomainError(
          "INVALID_PARENT",
          `inconsistent parent relationship: ${child.id}`
        );
      }
    }

    const removed = parent.removeChildForDocument(
      group.id,
      this.#structureToken
    );

    if (removed !== group) {
      throw new DomainError(
        "INVALID_PARENT",
        `inconsistent parent relationship: ${group.id}`
      );
    }

    for (const child of children) {
      group.removeChildForDocument(child.id, this.#structureToken);
    }

    for (let index = 0; index < children.length; index += 1) {
      const child = children[index];

      if (child !== undefined) {
        this.insertForStructureChange(child, parent, groupIndex + index);
        this._parentsById.set(child.id, parent);
      }
    }

    this._parentsById.delete(group.id);
    this._shapesById.delete(group.id);
    group.releaseDocumentToken(this.#structureToken);
    return group;
  }

  public addShapeToGroup(groupId: string, shapeId: string): Shape {
    const group = this.requireGroup(groupId);
    const shape = this.requireShape(shapeId);

    if (shape === group || shape.contains(group)) {
      throw new DomainError(
        "CYCLE_DETECTED",
        `cannot move a container into itself or its descendant: ${shape.id}`
      );
    }

    const currentParent = this.getParent(shape);
    const targetChildren = group.children;
    const lastChild = targetChildren[targetChildren.length - 1];

    if (currentParent === group && lastChild === shape) {
      return shape;
    }

    this.detachForStructureChange(shape);
    group.appendChildForDocument(shape, this.#structureToken);
    this._parentsById.set(shape.id, group);
    return shape;
  }

  public bringToFront(id: string): Shape {
    return this.reorderShape(id, "front");
  }

  public sendToBack(id: string): Shape {
    return this.reorderShape(id, "back");
  }

  private requireShape(id: string): Shape {
    const shape = this._shapesById.get(id);

    if (shape === undefined) {
      throw new DomainError("SHAPE_NOT_FOUND", `no such shape: ${id}`);
    }

    return shape;
  }

  private requireGroup(id: string): GroupShape {
    const shape = this.requireShape(id);

    if (!(shape instanceof GroupShape)) {
      throw new DomainError("INVALID_PARENT", `not a container: ${id}`);
    }

    return shape;
  }

  private getParent(shape: Shape): GroupShape | null {
    const parent = this._parentsById.get(shape.id);

    if (parent === undefined) {
      throw new DomainError(
        "INVALID_PARENT",
        `inconsistent parent relationship: ${shape.id}`
      );
    }

    return parent;
  }

  private indexOfChild(
    shape: Shape,
    parent: GroupShape | null
  ): number {
    const siblings =
      parent === null ? this._rootChildren : parent.children;
    const index = siblings.findIndex((candidate) => candidate === shape);

    if (index === -1) {
      throw new DomainError(
        "INVALID_PARENT",
        `inconsistent parent relationship: ${shape.id}`
      );
    }

    return index;
  }

  private assertInsertionTarget(
    parent: GroupShape | null,
    index: number
  ): void {
    const length =
      parent === null ? this._rootChildren.length : parent.children.length;

    if (!Number.isInteger(index) || index < 0 || index > length) {
      throw new DomainError(
        "INVALID_PARENT",
        `invalid child insertion index: ${index}`
      );
    }

    if (parent !== null && this._shapesById.get(parent.id) !== parent) {
      throw new DomainError(
        "INVALID_PARENT",
        `no such container: ${parent.id}`
      );
    }
  }

  private detachForStructureChange(shape: Shape): void {
    const parent = this.getParent(shape);

    if (parent === null) {
      const index = this.indexOfChild(shape, null);
      this._rootChildren.splice(index, 1);
      return;
    }

    const removed = parent.removeChildForDocument(
      shape.id,
      this.#structureToken
    );

    if (removed !== shape) {
      throw new DomainError(
        "INVALID_PARENT",
        `inconsistent parent relationship: ${shape.id}`
      );
    }
  }

  private insertForStructureChange(
    shape: Shape,
    parent: GroupShape | null,
    index: number
  ): void {
    this.assertInsertionTarget(parent, index);

    if (parent === null) {
      this._rootChildren.splice(index, 0, shape);
    } else {
      parent.insertChildForDocument(shape, index, this.#structureToken);
    }
  }

  private reorderShape(id: string, position: "front" | "back"): Shape {
    const shape = this.requireShape(id);
    const parent = this.getParent(shape);
    const siblings =
      parent === null ? this._rootChildren : parent.children;
    const currentIndex = this.indexOfChild(shape, parent);
    const targetIndex = position === "front" ? siblings.length - 1 : 0;

    if (currentIndex === targetIndex) {
      return shape;
    }

    this.detachForStructureChange(shape);
    this.insertForStructureChange(shape, parent, targetIndex);
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

  private registerSubtree(root: Shape, parent: GroupShape | null): void {
    const pending: Array<{ shape: Shape; parent: GroupShape | null }> = [
      { shape: root, parent }
    ];

    while (pending.length > 0) {
      const entry = pending.pop();

      if (entry === undefined) {
        continue;
      }

      this._shapesById.set(entry.shape.id, entry.shape);
      this._parentsById.set(entry.shape.id, entry.parent);

      if (entry.shape instanceof GroupShape) {
        entry.shape.bindDocumentToken(this.#structureToken);

        for (const child of entry.shape.children) {
          pending.push({ shape: child, parent: entry.shape });
        }
      }
    }
  }

  private unregisterSubtree(root: Shape): void {
    for (const shape of this.collectSubtree(root)) {
      this._parentsById.delete(shape.id);
      this._shapesById.delete(shape.id);

      if (shape instanceof GroupShape) {
        shape.releaseDocumentToken(this.#structureToken);
      }
    }
  }

  private bindDocumentSubtrees(root: Shape): void {
    for (const shape of this.collectSubtree(root)) {
      if (shape instanceof GroupShape) {
        shape.bindDocumentToken(this.#structureToken);
      }
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
