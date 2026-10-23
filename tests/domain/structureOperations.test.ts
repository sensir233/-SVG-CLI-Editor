import { describe, expect, it } from "vitest";
import { DomainError } from "../../src/domain/DomainError.js";
import { CircleShape } from "../../src/domain/shapes/CircleShape.js";
import { GroupShape } from "../../src/domain/shapes/GroupShape.js";
import { RectShape } from "../../src/domain/shapes/RectShape.js";
import { SvgDocument } from "../../src/domain/SvgDocument.js";

describe("SvgDocument grouping", () => {
  it("preserves original sibling order even when arguments are reversed", () => {
    const document = new SvgDocument(800, 600);
    const first = new RectShape("a", 0, 0, 1, 1);
    const second = new RectShape("b", 0, 0, 1, 1);
    const third = new RectShape("c", 0, 0, 1, 1);
    document.addShape(first);
    document.addShape(second);
    document.addShape(third);

    const group = document.groupShapes("newGroup", ["c", "a"]);

    expect(group.children.map((shape) => shape.id)).toEqual(["a", "c"]);
    expect(document.rootChildren.map((shape) => shape.id)).toEqual([
      "newGroup",
      "b"
    ]);
    expect(document.parentOf("a")).toBe(group);
    expect(document.parentOf("c")).toBe(group);
    expect(document.parentOf("b")).toBeNull();
    expect(document.shapeCount).toBe(4);
  });

  it("preserves original sibling order and uses the earliest original position", () => {
    const document = new SvgDocument(800, 600);
    const parent = new GroupShape("parent");
    const first = new RectShape("first", 1, 1, 10, 10);
    const second = new CircleShape("second", 20, 20, 5);
    const third = new RectShape("third", 30, 30, 10, 10);
    document.addShape(parent);
    document.addShape(first, parent);
    document.addShape(second, parent);
    document.addShape(third, parent);

    const group = document.groupShapes("group", ["third", "first"]);

    expect(parent.children.map((shape) => shape.id)).toEqual([
      "group",
      "second"
    ]);
    expect(group.children.map((shape) => shape.id)).toEqual(["first", "third"]);
    expect(document.parentOf("group")).toBe(parent);
    expect(document.parentOf("third")).toBe(group);
    expect(document.parentOf("first")).toBe(group);
    expect(document.shapeCount).toBe(5);
    expect([first.x, first.y, first.width, first.height]).toEqual([
      1,
      1,
      10,
      10
    ]);
  });

  it("groups across parents at the root end in document paint order", () => {
    const document = new SvgDocument(800, 600);
    const first = new RectShape("first", 0, 0, 10, 10);
    const parent = new GroupShape("parent");
    const nested = new CircleShape("nested", 20, 20, 5);
    const last = new RectShape("last", 30, 30, 10, 10);
    document.addShape(first);
    document.addShape(parent);
    document.addShape(nested, parent);
    document.addShape(last);

    const group = document.groupShapes("cross", ["last", "nested", "first"]);

    expect(document.rootChildren.map((shape) => shape.id)).toEqual([
      "parent",
      "cross"
    ]);
    expect(parent.children).toHaveLength(0);
    expect(group.children.map((shape) => shape.id)).toEqual([
      "first",
      "nested",
      "last"
    ]);
    expect(document.parentOf("nested")).toBe(group);
    expect(document.parentOf("first")).toBe(group);
    expect(document.parentOf("last")).toBe(group);
  });

  it("groups containers and recursively moves and scales the resulting tree", () => {
    const document = new SvgDocument(800, 600);
    const inner = new GroupShape("inner");
    const rect = new RectShape("rect", 10, 20, 40, 20);
    const label = new CircleShape("circle", 5, 6, 7);
    document.addShape(inner);
    document.addShape(rect, inner);
    document.addShape(label);

    const outer = document.groupShapes("outer", ["rect", "circle"]);

    expect(inner.children).toHaveLength(0);
    expect(outer.children.map((shape) => shape.id)).toEqual(["rect", "circle"]);

    outer.move(3, 4);
    outer.scale(2);

    expect([rect.x, rect.y, rect.width, rect.height]).toEqual([26, 48, 80, 40]);
    expect([label.cx, label.cy, label.r]).toEqual([16, 20, 14]);
    expect(document.parentOf("inner")).toBeNull();
  });

  it.each([
    ["too few", "group requires at least two shapes", ["first"]],
    ["duplicate member", "duplicate group member: first", ["first", "first"]],
    ["missing member", "no such shape: missing", ["first", "missing"]],
    ["existing group id", "id already exists: existing", ["first", "second"]]
  ])("rejects %s atomically", (_label, message, members) => {
    const document = new SvgDocument(800, 600);
    const first = new RectShape("first", 1, 1, 10, 10);
    const second = new RectShape("second", 2, 2, 10, 10);
    const existing = new GroupShape("existing");
    document.addShape(first);
    document.addShape(second);
    document.addShape(existing);
    const rootIds = document.rootChildren.map((shape) => shape.id);

    expect(() =>
      document.groupShapes(
        message.startsWith("id already") ? "existing" : "group",
        members
      )
    ).toThrow(message);
    expect(document.rootChildren.map((shape) => shape.id)).toEqual(rootIds);
    expect(document.shapeCount).toBe(3);
    expect(document.parentOf("first")).toBeNull();
    expect(document.parentOf("second")).toBeNull();
    expect([first.x, first.y, first.width, first.height]).toEqual([
      1,
      1,
      10,
      10
    ]);
    expect([second.x, second.y, second.width, second.height]).toEqual([
      2,
      2,
      10,
      10
    ]);
    expect(document.findById("group")).toBeUndefined();
  });

  it("rejects grouping an ancestor with its descendant without mutation", () => {
    const document = new SvgDocument(800, 600);
    const parent = new GroupShape("parent");
    const child = new RectShape("child", 0, 0, 10, 10);
    document.addShape(parent);
    document.addShape(child, parent);

    expect(() =>
      document.groupShapes("bad", ["child", "parent"])
    ).toThrow("cannot group a container into its own descendant: parent");
    expect(document.rootChildren.map((shape) => shape.id)).toEqual(["parent"]);
    expect(parent.children.map((shape) => shape.id)).toEqual(["child"]);
    expect(document.parentOf("child")).toBe(parent);
    expect(document.shapeCount).toBe(2);
    expect([child.x, child.y, child.width, child.height]).toEqual([
      0,
      0,
      10,
      10
    ]);
  });
});

describe("SvgDocument ungrouping", () => {
  it("promotes direct children in place and preserves their order", () => {
    const document = new SvgDocument(800, 600);
    const parent = new GroupShape("parent");
    const before = new RectShape("before", 0, 0, 1, 1);
    const nested = new GroupShape("nested");
    const first = new RectShape("first", 1, 1, 2, 2);
    const second = new CircleShape("second", 2, 2, 1);
    const after = new RectShape("after", 3, 3, 4, 4);
    document.addShape(parent);
    document.addShape(before, parent);
    document.addShape(nested, parent);
    document.addShape(first, nested);
    document.addShape(second, nested);
    document.addShape(after, parent);

    const removed = document.ungroupShape("nested");

    expect(removed.children).toHaveLength(0);
    expect(parent.children.map((shape) => shape.id)).toEqual([
      "before",
      "first",
      "second",
      "after"
    ]);
    expect(document.parentOf("first")).toBe(parent);
    expect(document.parentOf("second")).toBe(parent);
    expect(document.findById("nested")).toBeUndefined();
    expect(document.parentOf("nested")).toBeUndefined();
    expect(document.shapeCount).toBe(5);
  });

  it("removes an empty nested group", () => {
    const document = new SvgDocument(800, 600);
    const parent = new GroupShape("parent");
    const empty = new GroupShape("empty");
    document.addShape(parent);
    document.addShape(empty, parent);

    document.ungroupShape("empty");

    expect(parent.children).toHaveLength(0);
    expect(document.findById("empty")).toBeUndefined();
    expect(document.shapeCount).toBe(1);
  });

  it("rejects top-level and non-container targets without mutation", () => {
    const document = new SvgDocument(800, 600);
    const top = new GroupShape("top");
    const rect = new RectShape("rect", 0, 0, 10, 10);
    document.addShape(top);
    document.addShape(rect);

    expect(() => document.ungroupShape("top")).toThrow(
      "cannot ungroup top-level container: top"
    );
    expect(() => document.ungroupShape("rect")).toThrow(
      "not a container: rect"
    );
    expect(document.rootChildren.map((shape) => shape.id)).toEqual([
      "top",
      "rect"
    ]);
    expect(top.children).toHaveLength(0);
    expect(document.shapeCount).toBe(2);
    expect([rect.x, rect.y, rect.width, rect.height]).toEqual([0, 0, 10, 10]);
  });
});

describe("SvgDocument addto", () => {
  it("moves shapes across parents and preserves their subtrees", () => {
    const document = new SvgDocument(800, 600);
    const source = new GroupShape("source");
    const target = new GroupShape("target");
    const container = new GroupShape("container");
    const descendant = new RectShape("descendant", 1, 2, 3, 4);
    document.addShape(source);
    document.addShape(target);
    document.addShape(container, source);
    document.addShape(descendant, container);

    document.addShapeToGroup("target", "container");

    expect(source.children).toHaveLength(0);
    expect(target.children.map((shape) => shape.id)).toEqual(["container"]);
    expect(document.parentOf("container")).toBe(target);
    expect(document.parentOf("descendant")).toBe(container);
    expect(document.findById("descendant")).toBe(descendant);
    expect([descendant.x, descendant.y, descendant.width, descendant.height]).toEqual([
      1,
      2,
      3,
      4
    ]);
  });

  it("moves an existing child of the target group to the end", () => {
    const document = new SvgDocument(800, 600);
    const target = new GroupShape("target");
    const first = new RectShape("first", 0, 0, 1, 1);
    const second = new RectShape("second", 0, 0, 1, 1);
    document.addShape(target);
    document.addShape(first, target);
    document.addShape(second, target);

    document.addShapeToGroup("target", "first");

    expect(target.children.map((shape) => shape.id)).toEqual([
      "second",
      "first"
    ]);
    expect(document.parentOf("first")).toBe(target);
  });

  it("rejects self and descendant cycles atomically", () => {
    const document = new SvgDocument(800, 600);
    const outer = new GroupShape("outer");
    const inner = new GroupShape("inner");
    const child = new RectShape("child", 0, 0, 1, 1);
    document.addShape(outer);
    document.addShape(inner, outer);
    document.addShape(child, inner);

    expect(() => document.addShapeToGroup("outer", "outer")).toThrow(
      "cannot move a container into itself or its descendant: outer"
    );
    expect(() => document.addShapeToGroup("inner", "outer")).toThrow(
      "cannot move a container into itself or its descendant: outer"
    );
    expect(document.rootChildren.map((shape) => shape.id)).toEqual(["outer"]);
    expect(outer.children.map((shape) => shape.id)).toEqual(["inner"]);
    expect(inner.children.map((shape) => shape.id)).toEqual(["child"]);
    expect(document.shapeCount).toBe(3);
    expect([child.x, child.y, child.width, child.height]).toEqual([
      0,
      0,
      1,
      1
    ]);
  });
});

describe("SvgDocument sibling ordering", () => {
  it("moves root shapes to the front and back without changing parents", () => {
    const document = new SvgDocument(800, 600);
    const first = new RectShape("first", 1, 1, 10, 10);
    const second = new CircleShape("second", 2, 2, 3);
    const third = new RectShape("third", 3, 3, 10, 10);
    document.addShape(first);
    document.addShape(second);
    document.addShape(third);

    document.bringToFront("first");
    expect(document.rootChildren.map((shape) => shape.id)).toEqual([
      "second",
      "third",
      "first"
    ]);
    expect(
      document.rootChildren.every((shape) => document.parentOf(shape.id) === null)
    ).toBe(true);

    document.sendToBack("first");
    expect(document.rootChildren.map((shape) => shape.id)).toEqual([
      "first",
      "second",
      "third"
    ]);
    expect([first.x, first.y, first.width, first.height]).toEqual([
      1,
      1,
      10,
      10
    ]);
  });

  it("orders nested shapes and treats repeated edge moves as no-ops", () => {
    const document = new SvgDocument(800, 600);
    const group = new GroupShape("group");
    const first = new RectShape("first", 0, 0, 1, 1);
    const second = new RectShape("second", 0, 0, 1, 1);
    const third = new RectShape("third", 0, 0, 1, 1);
    document.addShape(group);
    document.addShape(first, group);
    document.addShape(second, group);
    document.addShape(third, group);

    document.bringToFront("first");
    document.bringToFront("first");
    expect(group.children.map((shape) => shape.id)).toEqual([
      "second",
      "third",
      "first"
    ]);

    document.sendToBack("third");
    document.sendToBack("third");
    expect(group.children.map((shape) => shape.id)).toEqual([
      "third",
      "second",
      "first"
    ]);
    expect(
      group.children.every((shape) => document.parentOf(shape.id) === group)
    ).toBe(true);
    expect(document.shapeCount).toBe(4);
    expect(() => document.bringToFront("missing")).toThrow(
      new DomainError("SHAPE_NOT_FOUND", "no such shape: missing")
    );
  });
});
