export interface ShapeSnapshotStyle {
  readonly fill: string | undefined;
  readonly stroke: string | undefined;
  readonly strokeWidth: number | undefined;
}

export interface RectShapeSnapshot extends ShapeSnapshotStyle {
  readonly kind: "rect";
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface CircleShapeSnapshot extends ShapeSnapshotStyle {
  readonly kind: "circle";
  readonly id: string;
  readonly cx: number;
  readonly cy: number;
  readonly r: number;
}

export interface EllipseShapeSnapshot extends ShapeSnapshotStyle {
  readonly kind: "ellipse";
  readonly id: string;
  readonly cx: number;
  readonly cy: number;
  readonly rx: number;
  readonly ry: number;
}

export interface LineShapeSnapshot extends ShapeSnapshotStyle {
  readonly kind: "line";
  readonly id: string;
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
}

export interface TextShapeSnapshot extends ShapeSnapshotStyle {
  readonly kind: "text";
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly text: string;
}

export interface GroupShapeSnapshot extends ShapeSnapshotStyle {
  readonly kind: "g";
  readonly id: string;
  readonly children: readonly ShapeSnapshot[];
}

export type ShapeSnapshot =
  | RectShapeSnapshot
  | CircleShapeSnapshot
  | EllipseShapeSnapshot
  | LineShapeSnapshot
  | TextShapeSnapshot
  | GroupShapeSnapshot;

export type ShapeSnapshotKind = ShapeSnapshot["kind"];
