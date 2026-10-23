import type { GroupShape } from "../domain/shapes/GroupShape.js";
import type { CircleShape } from "../domain/shapes/CircleShape.js";
import type { EllipseShape } from "../domain/shapes/EllipseShape.js";
import type { LineShape } from "../domain/shapes/LineShape.js";
import type { RectShape } from "../domain/shapes/RectShape.js";
import type { TextShape } from "../domain/shapes/TextShape.js";
import type { ShapeVisitor } from "../domain/ShapeVisitor.js";

export class ShapeTypeNameVisitor implements ShapeVisitor<string> {
  public visitRect(_shape: RectShape): string {
    return "rect";
  }

  public visitCircle(_shape: CircleShape): string {
    return "circle";
  }

  public visitEllipse(_shape: EllipseShape): string {
    return "ellipse";
  }

  public visitLine(_shape: LineShape): string {
    return "line";
  }

  public visitText(_shape: TextShape): string {
    return "text";
  }

  public visitGroup(_shape: GroupShape): string {
    return "g";
  }
}
