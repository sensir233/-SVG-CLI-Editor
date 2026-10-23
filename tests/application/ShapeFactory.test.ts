import { describe, expect, it } from "vitest";
import { ApplicationError } from "../../src/application/ApplicationError.js";
import { ShapeFactory } from "../../src/application/ShapeFactory.js";
import { CircleShape } from "../../src/domain/shapes/CircleShape.js";
import { EllipseShape } from "../../src/domain/shapes/EllipseShape.js";
import { GroupShape } from "../../src/domain/shapes/GroupShape.js";
import { LineShape } from "../../src/domain/shapes/LineShape.js";
import { RectShape } from "../../src/domain/shapes/RectShape.js";
import { TextShape } from "../../src/domain/shapes/TextShape.js";

describe("ShapeFactory", () => {
  it("creates all six supported SVG types through one type registry", () => {
    const factory = new ShapeFactory();

    const rect = factory.create("rect", "rect", ["1", "2", "3", "4", "red"]);
    const circle = factory.create("circle", "circle", ["5", "6", "7", "blue"]);
    const ellipse = factory.create("ellipse", "ellipse", [
      "8",
      "9",
      "10",
      "11"
    ]);
    const line = factory.create("line", "line", ["1", "2", "3", "4", "black"]);
    const text = factory.create("text", "text", ["5", "6", "hello world"]);
    const group = factory.create("g", "group", []);

    expect(rect).toBeInstanceOf(RectShape);
    expect(circle).toBeInstanceOf(CircleShape);
    expect(ellipse).toBeInstanceOf(EllipseShape);
    expect(line).toBeInstanceOf(LineShape);
    expect(text).toBeInstanceOf(TextShape);
    expect(group).toBeInstanceOf(GroupShape);
  });

  it("reports the required unknown type error and does not implement box", () => {
    const factory = new ShapeFactory();

    expect(() => factory.create("hexagon", "h", [])).toThrowError(
      ApplicationError
    );
    expect(() => factory.create("hexagon", "h", [])).toThrow(
      "unknown shape type: hexagon (is the plugin loaded?)"
    );
    expect(() => factory.create("box", "b", [])).toThrow(
      "unknown shape type: box (is the plugin loaded?)"
    );
  });

  it("rejects missing and extra type parameters", () => {
    const factory = new ShapeFactory();

    expect(() => factory.create("rect", "r", ["0", "0", "1"])).toThrow(
      "usage: create rect"
    );
    expect(() =>
      factory.create("g", "g", ["unexpected"])
    ).toThrow("usage: create g");
    expect(() =>
      factory.create("text", "t", ["0", "0", "text", "extra"])
    ).toThrow("usage: create text");
  });
});
