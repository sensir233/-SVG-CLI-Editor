import { describe, expect, it } from "vitest";
import { DomainError } from "../../src/domain/DomainError.js";
import { CircleShape } from "../../src/domain/shapes/CircleShape.js";
import { EllipseShape } from "../../src/domain/shapes/EllipseShape.js";
import { LineShape } from "../../src/domain/shapes/LineShape.js";
import { RectShape } from "../../src/domain/shapes/RectShape.js";
import { TextShape } from "../../src/domain/shapes/TextShape.js";
import { StyledShape } from "../../src/domain/shapes/StyledShape.js";
import type { ShapeVisitor } from "../../src/domain/ShapeVisitor.js";
import type { Shape } from "../../src/domain/Shape.js";

describe("leaf shapes", () => {
  it("creates all five leaf types with encapsulated geometry and styles", () => {
    const shapes = [
      new RectShape("rect", 10, 20, 100, 50, "#eee", "black", 2),
      new CircleShape("circle", 50, 60, 10, "red"),
      new EllipseShape("ellipse", 70, 80, 20, 10, "blue"),
      new LineShape("line", 1, 2, 3, 4, undefined, "black"),
      new TextShape("text", 5, 6, "hello", "white")
    ];

    expect(shapes).toHaveLength(5);
    expect(shapes.every((shape) => shape instanceof StyledShape)).toBe(true);
    expect(shapes.map((shape) => shape.id)).toEqual([
      "rect",
      "circle",
      "ellipse",
      "line",
      "text"
    ]);
  });

  it("moves each leaf using its own coordinate semantics", () => {
    const rect = new RectShape("r", 10, 20, 100, 50);
    const circle = new CircleShape("c", 30, 40, 5);
    const ellipse = new EllipseShape("e", 50, 60, 8, 4);
    const line = new LineShape("l", 1, 2, 3, 4);
    const text = new TextShape("t", 7, 8, "move");

    rect.move(3, 4);
    circle.move(3, 4);
    ellipse.move(3, 4);
    line.move(3, 4);
    text.move(3, 4);

    expect([rect.x, rect.y]).toEqual([13, 24]);
    expect([circle.cx, circle.cy]).toEqual([33, 44]);
    expect([ellipse.cx, ellipse.cy]).toEqual([53, 64]);
    expect([line.x1, line.y1, line.x2, line.y2]).toEqual([4, 6, 6, 8]);
    expect([text.x, text.y]).toEqual([10, 12]);
  });

  it("dispatches each leaf through visitor polymorphism", () => {
    const visitor: ShapeVisitor<string> = {
      visitRect: (shape) => `rect:${shape.id}`,
      visitCircle: (shape) => `circle:${shape.id}`,
      visitEllipse: (shape) => `ellipse:${shape.id}`,
      visitLine: (shape) => `line:${shape.id}`,
      visitText: (shape) => `text:${shape.id}`,
      visitGroup: (shape) => `group:${shape.id}`
    };
    const shapes: Shape[] = [
      new RectShape("r", 0, 0, 1, 1),
      new CircleShape("c", 0, 0, 1),
      new EllipseShape("e", 0, 0, 1, 1),
      new LineShape("l", 0, 0, 1, 1),
      new TextShape("t", 0, 0, "text")
    ];

    expect(shapes.map((shape) => shape.accept(visitor))).toEqual([
      "rect:r",
      "circle:c",
      "ellipse:e",
      "line:l",
      "text:t"
    ]);
  });

  it("scales each leaf's positions and dimensions", () => {
    const rect = new RectShape("r", 10, 20, 100, 50);
    const circle = new CircleShape("c", 30, 40, 5);
    const ellipse = new EllipseShape("e", 50, 60, 8, 4);
    const line = new LineShape("l", 1, 2, 3, 4);
    const text = new TextShape("t", 7, 8, "scale");

    rect.scale(2);
    circle.scale(2);
    ellipse.scale(2);
    line.scale(2);
    text.scale(2);

    expect([rect.x, rect.y, rect.width, rect.height]).toEqual([20, 40, 200, 100]);
    expect([circle.cx, circle.cy, circle.r]).toEqual([60, 80, 10]);
    expect([ellipse.cx, ellipse.cy, ellipse.rx, ellipse.ry]).toEqual([
      100,
      120,
      16,
      8
    ]);
    expect([line.x1, line.y1, line.x2, line.y2]).toEqual([2, 4, 6, 8]);
    expect([text.x, text.y]).toEqual([14, 16]);
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
    "rejects invalid scale factor %s without changing state",
    (factor) => {
      const rect = new RectShape("r", 10, 20, 100, 50);

      expect(() => rect.scale(factor)).toThrowError(DomainError);
      expect(() => rect.scale(factor)).toThrow(
        "scale factor must be positive"
      );
      expect([rect.x, rect.y, rect.width, rect.height]).toEqual([
        10,
        20,
        100,
        50
      ]);
    }
  );

  it("rejects non-finite movement without changing state", () => {
    const circle = new CircleShape("c", 10, 20, 5);

    expect(() => circle.move(Number.NaN, 4)).toThrow("invalid dx: NaN");
    expect([circle.cx, circle.cy, circle.r]).toEqual([10, 20, 5]);
  });
});
