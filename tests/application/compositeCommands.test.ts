import { describe, expect, it } from "vitest";
import { CircleShape } from "../../src/domain/shapes/CircleShape.js";
import { GroupShape } from "../../src/domain/shapes/GroupShape.js";
import { RectShape } from "../../src/domain/shapes/RectShape.js";
import { TestEditor } from "./TestEditor.js";

describe("grouping commands", () => {
  it("groups same-parent and cross-parent shapes in command input order", () => {
    const editor = new TestEditor();
    editor.execute("init");
    editor.execute("create", "g", "parent");
    editor.execute("create", "rect", "root", "1", "1", "5", "5");
    editor.execute("create", "rect", "first", "10", "10", "20", "20", "in", "parent");
    editor.execute("create", "circle", "second", "30", "30", "5", "in", "parent");

    expect(editor.execute("group", "same", "second", "first")).toBe(
      "g#same created with 2 children"
    );
    const same = editor.document.findById("same");
    expect(same).toBeInstanceOf(GroupShape);
    expect(same?.children.map((shape) => shape.id)).toEqual([
      "second",
      "first"
    ]);
    expect(editor.document.parentOf("same")).toBe(
      editor.document.findById("parent")
    );

    expect(editor.execute("group", "cross", "root", "second")).toBe(
      "g#cross created with 2 children"
    );
    expect(editor.document.rootChildren.map((shape) => shape.id)).toEqual([
      "parent",
      "cross"
    ]);
    expect(editor.document.findById("cross")?.children.map((shape) => shape.id)).toEqual([
      "root",
      "second"
    ]);
    expect(editor.document.parentOf("root")).toBe(
      editor.document.findById("cross")
    );
  });

  it("supports container grouping and recursive transforms", () => {
    const editor = new TestEditor();
    editor.execute("init");
    editor.execute("create", "g", "node");
    editor.execute("create", "rect", "box", "10", "20", "40", "20", "in", "node");
    editor.execute("create", "text", "label", "20", "30", "hello", "in", "node");
    editor.execute("create", "circle", "dot", "5", "6", "2");

    editor.execute("group", "cluster", "node", "dot");
    editor.execute("move", "cluster", "10", "20");
    editor.execute("scale", "cluster", "2");

    expect(editor.document.findById("box")).toMatchObject({
      x: 40,
      y: 80,
      width: 80,
      height: 40
    });
    expect(editor.document.findById("label")).toMatchObject({
      x: 60,
      y: 100
    });
    expect(editor.document.findById("dot")).toMatchObject({
      cx: 30,
      cy: 52,
      r: 4
    });
  });

  it("rejects invalid groups atomically", () => {
    const editor = new TestEditor();
    editor.execute("init");
    editor.execute("create", "g", "parent");
    editor.execute("create", "rect", "child", "0", "0", "10", "10", "in", "parent");
    editor.execute("create", "rect", "other", "1", "1", "2", "2");
    const rootIds = editor.document.rootChildren.map((shape) => shape.id);

    expect(() => editor.execute("group", "bad", "child")).toThrow(
      "usage: group"
    );
    expect(() => editor.execute("group", "parent", "child", "other")).toThrow(
      "id already exists: parent"
    );
    expect(() => editor.execute("group", "dup", "child", "child")).toThrow(
      "duplicate group member: child"
    );
    expect(() => editor.execute("group", "missing", "child", "none")).toThrow(
      "no such shape: none"
    );
    expect(() =>
      editor.execute("group", "cycle", "child", "parent")
    ).toThrow(
      "cannot group a container into its own descendant: parent"
    );

    expect(editor.document.rootChildren.map((shape) => shape.id)).toEqual(
      rootIds
    );
    expect(editor.document.findById("parent")?.children.map((shape) => shape.id)).toEqual([
      "child"
    ]);
    expect(editor.document.findById("bad")).toBeUndefined();
    expect(editor.document.findById("cycle")).toBeUndefined();
    expect(editor.document.shapeCount).toBe(3);
  });
});

describe("ungroup and structural move commands", () => {
  it("ungroups nested containers in place and rejects top-level containers", () => {
    const editor = new TestEditor();
    editor.execute("init");
    editor.execute("create", "g", "outer");
    editor.execute("create", "rect", "before", "0", "0", "1", "1", "in", "outer");
    editor.execute("create", "g", "inner", "in", "outer");
    editor.execute("create", "rect", "child", "2", "2", "3", "3", "in", "inner");
    editor.execute("create", "circle", "after", "4", "4", "2", "in", "outer");

    expect(editor.execute("ungroup", "inner")).toBe("g#inner ungrouped");
    expect(editor.document.findById("outer")?.children.map((shape) => shape.id)).toEqual([
      "before",
      "child",
      "after"
    ]);
    expect(editor.document.parentOf("child")).toBe(
      editor.document.findById("outer")
    );
    expect(editor.document.findById("inner")).toBeUndefined();

    expect(() => editor.execute("ungroup", "outer")).toThrow(
      "cannot ungroup top-level container: outer"
    );
    expect(() => editor.execute("ungroup", "child")).toThrow(
      "not a container: child"
    );
    expect(editor.document.rootChildren.map((shape) => shape.id)).toEqual([
      "outer"
    ]);
  });

  it("adds to a target group at the end and rejects structural cycles", () => {
    const editor = new TestEditor();
    editor.execute("init");
    editor.execute("create", "g", "target");
    editor.execute("create", "g", "source");
    editor.execute("create", "rect", "first", "0", "0", "1", "1", "in", "target");
    editor.execute("create", "rect", "second", "2", "2", "3", "3");

    editor.execute("addto", "target", "second");
    expect(editor.document.findById("target")?.children.map((shape) => shape.id)).toEqual([
      "first",
      "second"
    ]);

    editor.execute("addto", "target", "source");
    expect(editor.document.findById("target")?.children.map((shape) => shape.id)).toEqual([
      "first",
      "second",
      "source"
    ]);

    expect(() => editor.execute("addto", "source", "target")).toThrow(
      "cannot move a container into itself or its descendant: target"
    );
    expect(editor.document.parentOf("target")).toBeNull();
    expect(editor.document.parentOf("source")).toBe(
      editor.document.findById("target")
    );
  });

  it("orders root and nested shapes with front and back", () => {
    const editor = new TestEditor();
    editor.execute("init");
    editor.execute("create", "g", "group");
    editor.execute("create", "rect", "a", "0", "0", "1", "1");
    editor.execute("create", "rect", "b", "0", "0", "1", "1");
    editor.execute("create", "rect", "c", "0", "0", "1", "1");

    editor.execute("front", "a");
    expect(editor.document.rootChildren.map((shape) => shape.id)).toEqual([
      "group",
      "b",
      "c",
      "a"
    ]);
    editor.execute("back", "a");
    expect(editor.document.rootChildren.map((shape) => shape.id)).toEqual([
      "a",
      "group",
      "b",
      "c"
    ]);

    editor.execute("addto", "group", "b");
    editor.execute("addto", "group", "c");
    editor.execute("front", "b");
    expect(editor.document.findById("group")?.children.map((shape) => shape.id)).toEqual([
      "c",
      "b"
    ]);
    editor.execute("back", "b");
    expect(editor.document.findById("group")?.children.map((shape) => shape.id)).toEqual([
      "b",
      "c"
    ]);
    expect(editor.document.parentOf("b")).toBe(
      editor.document.findById("group")
    );
  });
});

describe("continuous composite workflow", () => {
  it("preserves hierarchy, order, indexes, and geometry across all commands", () => {
    const editor = new TestEditor();
    editor.execute("init", "800", "600");
    editor.execute("create", "g", "outer");
    editor.execute("create", "rect", "r1", "10", "20", "100", "50", "red", "in", "outer");
    editor.execute("create", "circle", "c1", "200", "100", "30", "blue", "in", "outer");
    editor.execute("create", "rect", "r2", "300", "100", "80", "40", "green");

    editor.execute("group", "inner", "r1", "c1");
    editor.execute("move", "inner", "50", "50");
    editor.execute("addto", "inner", "r2");
    editor.execute("front", "r1");
    editor.execute("back", "r2");
    editor.execute("ungroup", "inner");
    editor.execute("delete", "r1");

    const outer = editor.document.findById("outer");
    expect(outer).toBeInstanceOf(GroupShape);
    expect(outer?.children.map((shape) => shape.id)).toEqual(["r2", "c1"]);
    expect(editor.document.rootChildren.map((shape) => shape.id)).toEqual([
      "outer"
    ]);
    expect(editor.document.parentOf("r2")).toBe(outer);
    expect(editor.document.parentOf("c1")).toBe(outer);
    expect(editor.document.findById("inner")).toBeUndefined();
    expect(editor.document.findById("r1")).toBeUndefined();
    expect(editor.document.shapeCount).toBe(3);

    const circle = editor.document.findById("c1");
    const rect = editor.document.findById("r2");
    expect(circle).toBeInstanceOf(CircleShape);
    expect(rect).toBeInstanceOf(RectShape);
    expect(circle).toMatchObject({ cx: 250, cy: 150, r: 30 });
    expect(rect).toMatchObject({ x: 300, y: 100, width: 80, height: 40 });
  });

  it("lists all newly implemented commands in help only", () => {
    const editor = new TestEditor();
    const help = editor.execute("help");

    expect(help).toContain("group <newGid> <id1> <id2>...");
    expect(help).toContain("ungroup <gid>");
    expect(help).toContain("addto <gid> <id>");
    expect(help).toContain("front <id>");
    expect(help).toContain("back <id>");
    expect(help).not.toContain("tree [id]");
    expect(help).not.toContain("undo");
  });
});
