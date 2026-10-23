import { describe, expect, it } from "vitest";
import { CircleShape } from "../../src/domain/shapes/CircleShape.js";
import { GroupShape } from "../../src/domain/shapes/GroupShape.js";
import { RectShape } from "../../src/domain/shapes/RectShape.js";
import { SvgDocument } from "../../src/domain/SvgDocument.js";

describe("SvgDocument", () => {
  it("tracks global case-sensitive unique ids", () => {
    const document = new SvgDocument(800, 600);
    const lower = new RectShape("node", 0, 0, 10, 10);
    const upper = new RectShape("Node", 0, 0, 10, 10);

    document.addShape(lower);
    document.addShape(upper);

    expect(document.findById("node")).toBe(lower);
    expect(document.findById("Node")).toBe(upper);
    expect(document.findById("NODE")).toBeUndefined();
    expect(() =>
      document.addShape(new CircleShape("node", 1, 1, 1))
    ).toThrow("id already exists: node");
    expect(document.rootChildren).toHaveLength(2);
  });

  it("maintains parent relationships and sibling order", () => {
    const document = new SvgDocument(800, 600);
    const background = new RectShape("background", 0, 0, 800, 600);
    const group = new GroupShape("group");
    const first = new CircleShape("first", 1, 1, 1);
    const second = new RectShape("second", 2, 2, 2, 2);

    document.addShape(background);
    document.addShape(group);
    document.addShape(first, group);
    document.addShape(second, group);

    expect(document.rootChildren.map((shape) => shape.id)).toEqual([
      "background",
      "group"
    ]);
    expect(group.children.map((shape) => shape.id)).toEqual([
      "first",
      "second"
    ]);
    expect(document.parentOf("first")).toBe(group);
    expect(document.parentOf("group")).toBeNull();
    expect(document.parentOf("missing")).toBeUndefined();
  });

  it("registers a populated group subtree and all of its parents", () => {
    const document = new SvgDocument(400, 300);
    const inner = new GroupShape("inner");
    const rect = new RectShape("rect", 0, 0, 10, 10);
    inner.appendChild(rect);
    const outer = new GroupShape("outer");
    outer.appendChild(inner);

    document.addShape(outer);

    expect(document.shapeCount).toBe(3);
    expect(document.findById("rect")).toBe(rect);
    expect(document.parentOf("outer")).toBeNull();
    expect(document.parentOf("inner")).toBe(outer);
    expect(document.parentOf("rect")).toBe(inner);
  });

  it("rejects duplicate ids anywhere in a candidate subtree atomically", () => {
    const document = new SvgDocument(800, 600);
    const first = new RectShape("same", 0, 0, 1, 1);
    const second = new CircleShape("same", 2, 2, 2);
    const group = new GroupShape("group");
    group.appendChild(first);
    group.appendChild(second);

    expect(() => document.addShape(group)).toThrow("id already exists: same");
    expect(document.shapeCount).toBe(0);
    expect(document.rootChildren).toHaveLength(0);
    expect(document.findById("group")).toBeUndefined();
  });

  it("rejects a container that would contain its prospective parent", () => {
    const document = new SvgDocument(800, 600);
    const parent = new GroupShape("parent");
    document.addShape(parent);
    const candidate = new GroupShape("candidate");
    candidate.appendChild(parent);

    expect(() => document.addShape(candidate, parent)).toThrow(
      "cannot move a container into itself or its descendant: parent"
    );
    expect(document.rootChildren.map((shape) => shape.id)).toEqual(["parent"]);
    expect(document.shapeCount).toBe(1);
  });

  it("removes a whole subtree and cleans every index entry", () => {
    const document = new SvgDocument(800, 600);
    const root = new RectShape("root", 0, 0, 10, 10);
    const group = new GroupShape("group");
    const rect = new RectShape("rect", 1, 1, 2, 2);
    group.appendChild(rect);
    document.addShape(root);
    document.addShape(group);

    const removed = document.removeShape("group");

    expect(removed).toBe(group);
    expect(document.rootChildren.map((shape) => shape.id)).toEqual(["root"]);
    expect(document.findById("group")).toBeUndefined();
    expect(document.findById("rect")).toBeUndefined();
    expect(document.parentOf("group")).toBeUndefined();
    expect(document.parentOf("rect")).toBeUndefined();
    expect(document.shapeCount).toBe(1);

    const reuse = new CircleShape("rect", 3, 3, 3);
    document.addShape(reuse);
    expect(document.findById("rect")).toBe(reuse);
  });

  it("removes one child without disturbing sibling order", () => {
    const document = new SvgDocument(800, 600);
    const group = new GroupShape("group");
    const first = new RectShape("first", 0, 0, 1, 1);
    const second = new RectShape("second", 0, 0, 1, 1);
    const third = new RectShape("third", 0, 0, 1, 1);
    document.addShape(group);
    document.addShape(first, group);
    document.addShape(second, group);
    document.addShape(third, group);

    document.removeShape("second");

    expect(group.children.map((shape) => shape.id)).toEqual(["first", "third"]);
    expect(document.findById("second")).toBeUndefined();
    expect(() => document.removeShape("missing")).toThrow(
      "no such shape: missing"
    );
    expect(group.children.map((shape) => shape.id)).toEqual(["first", "third"]);
  });

  it("validates both canvas dimensions before changing either", () => {
    const document = new SvgDocument(800, 600);

    expect(() => document.setCanvasSize(1000, 0)).toThrow(
      "invalid height: 0"
    );
    expect([document.width, document.height]).toEqual([800, 600]);
  });
});
