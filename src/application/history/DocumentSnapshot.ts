import type { ShapeSnapshot } from "./ShapeSnapshot.js";

export class DocumentSnapshot {
  public readonly rootChildren: readonly ShapeSnapshot[];

  public constructor(
    public readonly width: number,
    public readonly height: number,
    rootChildren: readonly ShapeSnapshot[]
  ) {
    this.rootChildren = Object.freeze([...rootChildren]);
    Object.freeze(this);
  }

  public hasSameState(other: DocumentSnapshot): boolean {
    return JSON.stringify(this) === JSON.stringify(other);
  }
}
