import type { Shape } from "../domain/Shape.js";
import { CircleShape } from "../domain/shapes/CircleShape.js";
import { EllipseShape } from "../domain/shapes/EllipseShape.js";
import { GroupShape } from "../domain/shapes/GroupShape.js";
import { LineShape } from "../domain/shapes/LineShape.js";
import { RectShape } from "../domain/shapes/RectShape.js";
import { TextShape } from "../domain/shapes/TextShape.js";
import { ApplicationError } from "./ApplicationError.js";
import { CommandArguments } from "./CommandArguments.js";

type ShapeCreator = (id: string, parameters: readonly string[]) => Shape;

export class ShapeFactory {
  private readonly creators = new Map<string, ShapeCreator>();

  public constructor() {
    this.creators.set("rect", (id, parameters) => {
      const arguments_ = new CommandArguments(
        parameters,
        "create rect <id> <x> <y> <width> <height> [fill] [in <containerId>]"
      );
      arguments_.requireRange(4, 5);
      return new RectShape(
        id,
        arguments_.finiteNumber(0, "x"),
        arguments_.finiteNumber(1, "y"),
        arguments_.finiteNumber(2, "width"),
        arguments_.finiteNumber(3, "height"),
        arguments_.optional(4)
      );
    });

    this.creators.set("circle", (id, parameters) => {
      const arguments_ = new CommandArguments(
        parameters,
        "create circle <id> <cx> <cy> <r> [fill] [in <containerId>]"
      );
      arguments_.requireRange(3, 4);
      return new CircleShape(
        id,
        arguments_.finiteNumber(0, "cx"),
        arguments_.finiteNumber(1, "cy"),
        arguments_.finiteNumber(2, "r"),
        arguments_.optional(3)
      );
    });

    this.creators.set("ellipse", (id, parameters) => {
      const arguments_ = new CommandArguments(
        parameters,
        "create ellipse <id> <cx> <cy> <rx> <ry> [fill] [in <containerId>]"
      );
      arguments_.requireRange(4, 5);
      return new EllipseShape(
        id,
        arguments_.finiteNumber(0, "cx"),
        arguments_.finiteNumber(1, "cy"),
        arguments_.finiteNumber(2, "rx"),
        arguments_.finiteNumber(3, "ry"),
        arguments_.optional(4)
      );
    });

    this.creators.set("line", (id, parameters) => {
      const arguments_ = new CommandArguments(
        parameters,
        "create line <id> <x1> <y1> <x2> <y2> [stroke] [in <containerId>]"
      );
      arguments_.requireRange(4, 5);
      return new LineShape(
        id,
        arguments_.finiteNumber(0, "x1"),
        arguments_.finiteNumber(1, "y1"),
        arguments_.finiteNumber(2, "x2"),
        arguments_.finiteNumber(3, "y2"),
        undefined,
        arguments_.optional(4)
      );
    });

    this.creators.set("text", (id, parameters) => {
      const arguments_ = new CommandArguments(
        parameters,
        'create text <id> <x> <y> "<content>" [in <containerId>]'
      );
      arguments_.requireExactCount(3);
      return new TextShape(
        id,
        arguments_.finiteNumber(0, "x"),
        arguments_.finiteNumber(1, "y"),
        arguments_.optional(2) ?? ""
      );
    });

    this.creators.set("g", (id, parameters) => {
      const arguments_ = new CommandArguments(
        parameters,
        "create g <id> [in <containerId>]"
      );
      arguments_.requireExactCount(0);
      return new GroupShape(id);
    });
  }

  public create(
    type: string,
    id: string,
    parameters: readonly string[]
  ): Shape {
    const creator = this.creators.get(type);

    if (creator === undefined) {
      throw new ApplicationError(
        "UNKNOWN_SHAPE_TYPE",
        `unknown shape type: ${type} (is the plugin loaded?)`
      );
    }

    return creator(id, parameters);
  }
}
