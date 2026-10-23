import { describe, expect, it } from "vitest";
import { CommandResult } from "../../src/application/CommandResult.js";
import { ApplicationError } from "../../src/application/ApplicationError.js";
import { CircleShape } from "../../src/domain/shapes/CircleShape.js";
import { GroupShape } from "../../src/domain/shapes/GroupShape.js";
import { RectShape } from "../../src/domain/shapes/RectShape.js";
import { TextShape } from "../../src/domain/shapes/TextShape.js";
import { TestEditor } from "./TestEditor.js";

describe("basic editing commands", () => {
  it("initializes default and custom canvases", () => {
    const editor = new TestEditor();

    expect(editor.execute("init")).toBe("canvas 800x600 created");
    expect(editor.execute("init", "400")).toBe("canvas 400x600 created");
    expect(editor.execute("init", "400", "300")).toBe(
      "canvas 400x300 created"
    );
    expect([editor.document.width, editor.document.height]).toEqual([400, 300]);
    expect(editor.document.rootChildren).toHaveLength(0);

    const document = editor.document;

    expect(() => editor.execute("init", "0", "300")).toThrow(
      "invalid width: 0"
    );
    expect(editor.document).toBe(document);
    expect([editor.document.width, editor.document.height]).toEqual([400, 300]);
  });

  it("creates all six types and puts five leaves inside a group with in", () => {
    const editor = new TestEditor();
    editor.execute("init");

    expect(editor.execute("create", "g", "scene")).toBe("g#scene created");
    expect(
      editor.execute(
        "create",
        "rect",
        "r1",
        "10",
        "20",
        "100",
        "50",
        "red",
        "in",
        "scene"
      )
    ).toBe("rect#r1 created in g#scene");
    editor.execute(
      "create",
      "circle",
      "c1",
      "200",
      "100",
      "30",
      "blue",
      "in",
      "scene"
    );
    editor.execute(
      "create",
      "ellipse",
      "e1",
      "40",
      "80",
      "20",
      "10",
      "in",
      "scene"
    );
    editor.execute(
      "create",
      "line",
      "l1",
      "1",
      "2",
      "3",
      "4",
      "black",
      "in",
      "scene"
    );
    editor.execute(
      "create",
      "text",
      "title",
      "20",
      "40",
      "My Diagram",
      "in",
      "scene"
    );

    const scene = editor.document.findById("scene");
    expect(scene).toBeInstanceOf(GroupShape);
    expect(scene?.children.map((shape) => shape.id)).toEqual([
      "r1",
      "c1",
      "e1",
      "l1",
      "title"
    ]);
    expect(editor.document.parentOf("r1")).toBe(scene);
    expect(editor.document.rootChildren.map((shape) => shape.id)).toEqual([
      "scene"
    ]);
    expect(editor.document.findById("title")).toBeInstanceOf(TextShape);
  });

  it("moves, scales, and sets leaves through polymorphic domain interfaces", () => {
    const editor = new TestEditor();
    editor.execute("init");
    editor.execute("create", "rect", "r1", "10", "20", "100", "50", "red");
    editor.execute("create", "circle", "c1", "200", "100", "30", "blue");

    editor.execute("move", "r1", "30", "10");
    editor.execute("scale", "c1", "2");
    editor.execute("set", "r1", "fill", "green");
    editor.execute("set", "r1", "width", "120");
    editor.execute("set", "r1", "stroke-width", "3");

    const rect = editor.document.findById("r1");
    const circle = editor.document.findById("c1");

    expect(rect).toBeInstanceOf(RectShape);
    expect(circle).toBeInstanceOf(CircleShape);
    expect(rect).toMatchObject({
      x: 40,
      y: 30,
      width: 120,
      height: 50,
      fill: "green",
      strokeWidth: 3
    });
    expect(circle).toMatchObject({ cx: 400, cy: 200, r: 60 });
  });

  it("recursively moves and scales a nested group", () => {
    const editor = new TestEditor();
    editor.execute("init");
    editor.execute("create", "g", "outer");
    editor.execute("create", "g", "inner", "in", "outer");
    editor.execute("create", "rect", "rect", "10", "20", "40", "20", "in", "inner");
    editor.execute("create", "text", "label", "20", "30", "node", "in", "inner");

    editor.execute("move", "outer", "5", "7");
    editor.execute("scale", "outer", "0.5");

    expect(editor.document.findById("rect")).toMatchObject({
      x: 7.5,
      y: 13.5,
      width: 20,
      height: 10
    });
    expect(editor.document.findById("label")).toMatchObject({
      x: 12.5,
      y: 18.5
    });
  });

  it("deletes a group subtree and cleans indexes", () => {
    const editor = new TestEditor();
    editor.execute("init");
    editor.execute("create", "g", "group");
    editor.execute("create", "rect", "child", "0", "0", "10", "10", "in", "group");

    expect(editor.execute("delete", "group")).toBe("g#group deleted");
    expect(editor.document.findById("group")).toBeUndefined();
    expect(editor.document.findById("child")).toBeUndefined();
    expect(editor.document.parentOf("child")).toBeUndefined();
    expect(editor.document.shapeCount).toBe(0);
  });

  it("handles ID, target, type, and container errors without changing state", () => {
    const editor = new TestEditor();
    editor.execute("init");
    editor.execute("create", "rect", "r1", "0", "0", "50", "50");
    editor.execute("create", "circle", "c1", "0", "0", "5");
    const rootIds = editor.document.rootChildren.map((shape) => shape.id);

    expect(() =>
      editor.execute("create", "rect", "r1", "0", "0", "1", "1")
    ).toThrow(new ApplicationError("DOMAIN_ERROR", "id already exists: r1"));
    expect(() =>
      editor.execute("create", "rect", "r2", "0", "0", "1", "1", "in", "c1")
    ).toThrow("not a container: c1");
    expect(() =>
      editor.execute("create", "rect", "r2", "0", "0", "1", "1", "in", "missing")
    ).toThrow("no such container: missing");
    expect(() => editor.execute("create", "hexagon", "h1")).toThrow(
      "unknown shape type: hexagon (is the plugin loaded?)"
    );
    expect(() => editor.execute("delete", "missing")).toThrow(
      "no such shape: missing"
    );

    expect(editor.document.rootChildren.map((shape) => shape.id)).toEqual(
      rootIds
    );
    expect(editor.document.shapeCount).toBe(2);
  });

  it("rejects malformed numeric and attribute input atomically", () => {
    const editor = new TestEditor();
    editor.execute("init");
    editor.execute("create", "rect", "r1", "0", "0", "50", "50", "red");
    const before = editor.document.findById("r1");

    expect(() =>
      editor.execute("create", "rect", "bad", "0", "0", "-50", "20")
    ).toThrow("invalid width: -50");
    expect(() => editor.execute("move", "r1", "abc", "10")).toThrow(
      "invalid dx: abc"
    );
    expect(() => editor.execute("scale", "r1", "0")).toThrow(
      "scale factor must be positive"
    );
    expect(() =>
      editor.execute("set", "r1", "unknown", "value")
    ).toThrow("unknown attribute: unknown");
    expect(() =>
      editor.execute("set", "r1", "width", "-5")
    ).toThrow("invalid width: -5");
    expect(editor.document.findById("r1")).toBe(before);
    expect(before).toMatchObject({
      x: 0,
      y: 0,
      width: 50,
      height: 50,
      fill: "red"
    });
    expect(editor.document.findById("bad")).toBeUndefined();
  });

  it("rejects missing and extra command arguments with usage errors", () => {
    const editor = new TestEditor();
    editor.execute("init");

    expect(() => editor.execute("create")).toThrow("usage: create");
    expect(() => editor.execute("move", "r1", "1")).toThrow(
      "usage: move <id> <dx> <dy>"
    );
    expect(() =>
      editor.execute("create", "g", "g1", "extra")
    ).toThrow("usage: create g");
    expect(editor.document.shapeCount).toBe(0);
  });

  it("requires a document for editing commands but not help", () => {
    const editor = new TestEditor();

    expect(() => editor.execute("create", "g", "scene")).toThrow(
      "no document. use 'init' or 'read' first"
    );
    expect(() => editor.execute("move", "missing", "1", "1")).toThrow(
      "no document. use 'init' or 'read' first"
    );
    expect(editor.execute("help")).toContain("init [w] [h]");
    expect(editor.execute("help")).not.toContain("tree [id]");
    expect(editor.execute("help")).toContain("undo");
    expect(editor.execute("help")).toContain("redo");
  });

  it("reports unknown commands without changing the current document", () => {
    const editor = new TestEditor();
    editor.execute("init");
    editor.execute("create", "g", "scene");
    const document = editor.document;

    expect(() => editor.execute("save")).toThrow("unknown command: save");
    expect(() => editor.execute("tree")).toThrow("unknown command: tree");
    expect(editor.document).toBe(document);
  });

  it("runs a continuous multi-command sequence without losing state", () => {
    const editor = new TestEditor();
    const messages = [
      editor.execute("init", "800", "600"),
      editor.execute("create", "g", "scene"),
      editor.execute("create", "rect", "r1", "10", "20", "100", "50", "red", "in", "scene"),
      editor.execute("create", "text", "title", "20", "40", "My Diagram", "in", "scene"),
      editor.execute("move", "r1", "30", "10"),
      editor.execute("scale", "r1", "2"),
      editor.execute("set", "title", "text", "Updated title"),
      editor.execute("delete", "title")
    ];

    expect(messages[0]).toBe("canvas 800x600 created");
    expect(messages[3]).toBe("text#title created in g#scene");
    expect(editor.document.findById("title")).toBeUndefined();
    expect(editor.document.findById("r1")).toMatchObject({
      x: 80,
      y: 60,
      width: 200,
      height: 100
    });
  });

  it("rejects a scale overflow without partially changing a group", () => {
    const editor = new TestEditor();
    editor.execute("init");
    editor.execute("create", "g", "group");
    editor.execute("create", "rect", "first", "1", "1", "1", "1", "in", "group");
    editor.execute("create", "circle", "second", "2", "2", "2", "in", "group");

    expect(() => editor.execute("scale", "group", "1e308")).toThrow(
      "numeric overflow while scaling: cx"
    );
    expect(editor.document.findById("first")).toMatchObject({
      x: 1,
      y: 1,
      width: 1,
      height: 1
    });
    expect(editor.document.findById("second")).toMatchObject({
      cx: 2,
      cy: 2,
      r: 2
    });
  });

  it("returns command result objects from the application boundary", () => {
    const editor = new TestEditor();
    const result = editor.session.execute("init", []);

    expect(result).toBeInstanceOf(CommandResult);
    expect(result.message).toBe("canvas 800x600 created");
  });
});
