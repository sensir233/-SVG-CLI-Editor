import { describe, expect, it } from "vitest";
import { GroupShape } from "../../src/domain/shapes/GroupShape.js";
import { RectShape } from "../../src/domain/shapes/RectShape.js";
import { SvgDocument } from "../../src/domain/SvgDocument.js";

describe("document-owned shape tree invariants", () => {
  it("rejects direct child insertion into a document-managed group", () => {
    const document = new SvgDocument(800, 600);
    const group = new GroupShape("group");
    const rect = new RectShape("rect", 0, 0, 10, 10);
    document.addShape(group);
    document.addShape(rect);

    expect(() => group.appendChild(rect)).toThrow(
      "cannot modify shape structure outside SvgDocument: group"
    );
    expect(() => group.appendChildForDocument(rect, {})).toThrow(
      "cannot modify shape structure outside SvgDocument: group"
    );
    expect(document.rootChildren.map((shape) => shape.id)).toEqual([
      "group",
      "rect"
    ]);
    expect(document.parentOf("rect")).toBeNull();
    expect(document.shapeCount).toBe(2);
  });

  it("rejects direct child removal from a document-managed group", () => {
    const document = new SvgDocument(800, 600);
    const group = new GroupShape("group");
    const rect = new RectShape("rect", 0, 0, 10, 10);
    document.addShape(group);
    document.addShape(rect, group);

    expect(() => group.removeChild("rect")).toThrow(
      "cannot modify shape structure outside SvgDocument: group"
    );
    expect(group.children.map((shape) => shape.id)).toEqual(["rect"]);
    expect(document.findById("rect")).toBe(rect);
    expect(document.parentOf("rect")).toBe(group);
  });
});

describe("atomic group movement", () => {
  it("rejects movement overflow before changing any descendant", () => {
    const first = new RectShape("first", 1, 1, 1, 1);
    const second = new RectShape("second", 1.7e308, 1, 1, 1);
    const inner = new GroupShape("inner");
    inner.appendChild(second);
    const outer = new GroupShape("outer");
    outer.appendChild(first);
    outer.appendChild(inner);

    expect(() => outer.move(1e307, 0)).toThrow(
      "numeric overflow while moving: x"
    );
    expect([first.x, first.y]).toEqual([1, 1]);
    expect([second.x, second.y]).toEqual([1.7e308, 1]);
    expect(outer.children.map((shape) => shape.id)).toEqual([
      "first",
      "inner"
    ]);
    expect(inner.children.map((shape) => shape.id)).toEqual(["second"]);
  });
});
