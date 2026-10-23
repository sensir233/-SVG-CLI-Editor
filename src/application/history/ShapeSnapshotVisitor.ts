import type { CircleShape } from "../../domain/shapes/CircleShape.js";
import type { EllipseShape } from "../../domain/shapes/EllipseShape.js";
import type { GroupShape } from "../../domain/shapes/GroupShape.js";
import type { LineShape } from "../../domain/shapes/LineShape.js";
import type { RectShape } from "../../domain/shapes/RectShape.js";
import type { StyledShape } from "../../domain/shapes/StyledShape.js";
import type { TextShape } from "../../domain/shapes/TextShape.js";
import type { ShapeVisitor } from "../../domain/ShapeVisitor.js";
import type {
  CircleShapeSnapshot,
  EllipseShapeSnapshot,
  GroupShapeSnapshot,
  LineShapeSnapshot,
  RectShapeSnapshot,
  ShapeSnapshot,
  ShapeSnapshotStyle,
  TextShapeSnapshot
} from "./ShapeSnapshot.js";

export class ShapeSnapshotVisitor implements ShapeVisitor<ShapeSnapshot> {
  public visitRect(shape: RectShape): RectShapeSnapshot {
    return Object.freeze({
      kind: "rect",
      id: shape.id,
      ...ShapeSnapshotVisitor.styleOf(shape),
      x: shape.x,
      y: shape.y,
      width: shape.width,
      height: shape.height
    });
  }

  public visitCircle(shape: CircleShape): CircleShapeSnapshot {
    return Object.freeze({
      kind: "circle",
      id: shape.id,
      ...ShapeSnapshotVisitor.styleOf(shape),
      cx: shape.cx,
      cy: shape.cy,
      r: shape.r
    });
  }

  public visitEllipse(shape: EllipseShape): EllipseShapeSnapshot {
    return Object.freeze({
      kind: "ellipse",
      id: shape.id,
      ...ShapeSnapshotVisitor.styleOf(shape),
      cx: shape.cx,
      cy: shape.cy,
      rx: shape.rx,
      ry: shape.ry
    });
  }

  public visitLine(shape: LineShape): LineShapeSnapshot {
    return Object.freeze({
      kind: "line",
      id: shape.id,
      ...ShapeSnapshotVisitor.styleOf(shape),
      x1: shape.x1,
      y1: shape.y1,
      x2: shape.x2,
      y2: shape.y2
    });
  }

  public visitText(shape: TextShape): TextShapeSnapshot {
    return Object.freeze({
      kind: "text",
      id: shape.id,
      ...ShapeSnapshotVisitor.styleOf(shape),
      x: shape.x,
      y: shape.y,
      text: shape.text
    });
  }

  public visitGroup(shape: GroupShape): GroupShapeSnapshot {
    const children = shape.children.map((child) =>
      child.accept<ShapeSnapshot>(this)
    );

    return Object.freeze({
      kind: "g",
      id: shape.id,
      ...ShapeSnapshotVisitor.styleOf(shape),
      children: Object.freeze(children)
    });
  }

  private static styleOf(shape: StyledShape): ShapeSnapshotStyle {
    return {
      fill: shape.fill,
      stroke: shape.stroke,
      strokeWidth: shape.strokeWidth
    };
  }
}
