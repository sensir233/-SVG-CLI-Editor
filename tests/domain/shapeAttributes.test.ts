import { describe, expect, it } from "vitest";
import { DomainError } from "../../src/domain/DomainError.js";
import { CircleShape } from "../../src/domain/shapes/CircleShape.js";
import { EllipseShape } from "../../src/domain/shapes/EllipseShape.js";
import { LineShape } from "../../src/domain/shapes/LineShape.js";
import { RectShape } from "../../src/domain/shapes/RectShape.js";
import { TextShape } from "../../src/domain/shapes/TextShape.js";

describe("shape attributes", () => {
  it("sets allowed common and type-specific attributes", () => {
    const rect = new RectShape("r", 0, 0, 10, 10);
    const circle = new CircleShape("c", 1, 2, 3);
    const ellipse = new EllipseShape("e", 1, 2, 3, 4);
    const line = new LineShape("l", 1, 2, 3, 4);
    const text = new TextShape("t", 1, 2, "old");

    rect.setAttribute("fill", "red");
    rect.setAttribute("stroke", "black");
    rect.setAttribute("stroke-width", "2.5");
    rect.setAttribute("x", "11");
    rect.setAttribute("y", "12");
    rect.setAttribute("width", "13");
    rect.setAttribute("height", "14");

    circle.setAttribute("cx", "21");
    circle.setAttribute("cy", "22");
    circle.setAttribute("r", "23");

    ellipse.setAttribute("cx", "31");
    ellipse.setAttribute("cy", "32");
    ellipse.setAttribute("rx", "33");
    ellipse.setAttribute("ry", "34");

    line.setAttribute("x1", "41");
    line.setAttribute("y1", "42");
    line.setAttribute("x2", "43");
    line.setAttribute("y2", "44");

    text.setAttribute("x", "51");
    text.setAttribute("y", "52");
    text.setAttribute("text", "new text");

    expect([rect.fill, rect.stroke, rect.strokeWidth]).toEqual([
      "red",
      "black",
      2.5
    ]);
    expect([rect.x, rect.y, rect.width, rect.height]).toEqual([11, 12, 13, 14]);
    expect([circle.cx, circle.cy, circle.r]).toEqual([21, 22, 23]);
    expect([ellipse.cx, ellipse.cy, ellipse.rx, ellipse.ry]).toEqual([
      31,
      32,
      33,
      34
    ]);
    expect([line.x1, line.y1, line.x2, line.y2]).toEqual([41, 42, 43, 44]);
    expect([text.x, text.y, text.text]).toEqual([51, 52, "new text"]);
  });

  it("keeps omitted styles undefined instead of writing SVG defaults", () => {
    const rect = new RectShape("r", 0, 0, 10, 10);

    expect(rect.fill).toBeUndefined();
    expect(rect.stroke).toBeUndefined();
    expect(rect.strokeWidth).toBeUndefined();
  });

  it("rejects unknown attributes without changing state", () => {
    const text = new TextShape("t", 1, 2, "before", "red");

    expect(() => text.setAttribute("font-size", "20")).toThrow(
      "unknown attribute: font-size"
    );
    expect([text.x, text.y, text.text, text.fill]).toEqual([
      1,
      2,
      "before",
      "red"
    ]);
  });

  it.each(["", "abc", Number.NaN, Number.POSITIVE_INFINITY])(
    "rejects invalid numeric attribute value %s atomically",
    (value) => {
      const rect = new RectShape("r", 10, 20, 30, 40);
      const rawValue = typeof value === "number" ? String(value) : value;

      expect(() => rect.setAttribute("width", rawValue)).toThrowError(
        DomainError
      );
      expect([rect.x, rect.y, rect.width, rect.height]).toEqual([
        10,
        20,
        30,
        40
      ]);
    }
  );

  it("rejects negative dimensions while preserving the previous value", () => {
    const circle = new CircleShape("c", 1, 2, 3);

    expect(() => circle.setAttribute("r", "-1")).toThrow("invalid r: -1");
    expect([circle.cx, circle.cy, circle.r]).toEqual([1, 2, 3]);
  });
});
