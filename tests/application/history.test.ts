import { describe, expect, it } from "vitest";
import { CommandHistory } from "../../src/application/history/CommandHistory.js";
import { DocumentSnapshot } from "../../src/application/history/DocumentSnapshot.js";
import { DocumentSnapshotter } from "../../src/application/history/DocumentSnapshotter.js";
import type { CommandContext } from "../../src/application/CommandContext.js";
import { CommandResult } from "../../src/application/CommandResult.js";
import type { EditorCommand } from "../../src/application/EditorCommand.js";
import { ShapeFactory } from "../../src/application/ShapeFactory.js";
import { CircleShape } from "../../src/domain/shapes/CircleShape.js";
import { GroupShape } from "../../src/domain/shapes/GroupShape.js";
import { RectShape } from "../../src/domain/shapes/RectShape.js";
import { TextShape } from "../../src/domain/shapes/TextShape.js";
import type { SvgDocument } from "../../src/domain/SvgDocument.js";
import { TestEditor } from "./TestEditor.js";

class MutatingFailureCommand implements EditorCommand {
  public readonly name = "explode";
  public readonly usage = "explode";
  public readonly description = "Mutate and fail for transaction tests.";
  public readonly category = "edit";

  public execute(context: CommandContext): CommandResult {
    context.requireShape("rect").move(100, 100);
    throw new Error("intentional command failure");
  }
}

class FailingCaptureSnapshotter extends DocumentSnapshotter {
  public override capture(_document: SvgDocument): never {
    throw new Error("before snapshot failed");
  }
}

class FailingAfterCaptureSnapshotter extends DocumentSnapshotter {
  private captureCount = 0;

  public override capture(document: SvgDocument): DocumentSnapshot {
    this.captureCount += 1;

    if (this.captureCount === 2) {
      throw new Error("after snapshot failed");
    }

    return super.capture(document);
  }
}

describe("basic edit undo and redo", () => {
  it("undoes and redoes create", () => {
    const editor = new TestEditor();
    editor.execute("init");
    editor.execute("create", "rect", "rect", "1", "2", "3", "4");
    const editedDocument = editor.document;
    const editedShape = editor.document.findById("rect");

    expect(editor.execute("undo")).toBe("undo complete");
    expect(editor.document).not.toBe(editedDocument);
    expect(editor.document.findById("rect")).toBeUndefined();
    expect(editor.document.shapeCount).toBe(0);

    expect(editor.execute("redo")).toBe("redo complete");
    expect(editor.document).not.toBe(editedDocument);
    expect(editor.document.findById("rect")).not.toBe(editedShape);
    expect(editor.document.findById("rect")).toMatchObject({
      x: 1,
      y: 2,
      width: 3,
      height: 4
    });
  });

  it("undoes and redoes delete of a subtree", () => {
    const editor = new TestEditor();
    editor.execute("init");
    editor.execute("create", "g", "group");
    editor.execute("create", "rect", "child", "1", "2", "3", "4", "in", "group");
    editor.execute("delete", "group");
    expect(editor.document.shapeCount).toBe(0);

    editor.execute("undo");
    expect(editor.document.rootChildren.map((shape) => shape.id)).toEqual([
      "group"
    ]);
    expect(editor.document.findById("child")).toMatchObject({
      x: 1,
      y: 2,
      width: 3,
      height: 4
    });
    expect(editor.document.parentOf("child")).toBe(
      editor.document.findById("group")
    );

    editor.execute("redo");
    expect(editor.document.shapeCount).toBe(0);
  });

  it("undoes and redoes move and scale", () => {
    const editor = new TestEditor();
    editor.execute("init");
    editor.execute("create", "rect", "rect", "10", "20", "100", "50");
    editor.execute("move", "rect", "5", "6");
    editor.execute("scale", "rect", "2");

    editor.execute("undo");
    expect(editor.document.findById("rect")).toMatchObject({
      x: 15,
      y: 26,
      width: 100,
      height: 50
    });
    editor.execute("undo");
    expect(editor.document.findById("rect")).toMatchObject({
      x: 10,
      y: 20,
      width: 100,
      height: 50
    });
    editor.execute("redo");
    editor.execute("redo");
    expect(editor.document.findById("rect")).toMatchObject({
      x: 30,
      y: 52,
      width: 200,
      height: 100
    });
  });

  it("undoes and redoes text and style attributes", () => {
    const editor = new TestEditor();
    editor.execute("init");
    editor.execute("create", "text", "title", "10", "20", "before");
    editor.execute("set", "title", "text", "after");
    editor.execute("set", "title", "fill", "red");

    editor.execute("undo");
    expect(editor.document.findById("title")).toMatchObject({
      text: "after",
      fill: undefined
    });
    editor.execute("undo");
    expect(editor.document.findById("title")).toMatchObject({
      text: "before",
      fill: undefined,
      stroke: undefined,
      strokeWidth: undefined
    });
    editor.execute("redo");
    editor.execute("redo");
    expect(editor.document.findById("title")).toMatchObject({
      text: "after",
      fill: "red"
    });
  });

  it("supports multiple undo and redo operations and stable stack boundaries", () => {
    const editor = new TestEditor();
    editor.execute("init");
    editor.execute("create", "rect", "first", "0", "0", "1", "1");
    editor.execute("create", "circle", "second", "5", "5", "2");
    editor.execute("move", "first", "3", "4");

    editor.execute("undo");
    editor.execute("undo");
    editor.execute("undo");
    expect(editor.document.shapeCount).toBe(0);
    expect(() => editor.execute("undo")).toThrow("nothing to undo");

    editor.execute("redo");
    editor.execute("redo");
    editor.execute("redo");
    expect(editor.document.rootChildren.map((shape) => shape.id)).toEqual([
      "first",
      "second"
    ]);
    expect(editor.document.findById("first")).toMatchObject({ x: 3, y: 4 });
    expect(() => editor.execute("redo")).toThrow("nothing to redo");

    editor.execute("undo");
    editor.execute("redo");
    editor.execute("undo");
    expect(editor.document.findById("first")).toMatchObject({ x: 0, y: 0 });
  });
});

describe("complex structure undo and redo", () => {
  it("restores non-adjacent grouping and document order in one undo unit", () => {
    const editor = new TestEditor();
    editor.execute("init");
    editor.execute("create", "rect", "a", "0", "0", "1", "1");
    editor.execute("create", "rect", "b", "1", "1", "1", "1");
    editor.execute("create", "rect", "c", "2", "2", "1", "1");
    editor.execute("group", "grouped", "c", "a");
    expect(editor.document.findById("grouped")?.children.map((shape) => shape.id)).toEqual([
      "a",
      "c"
    ]);

    editor.execute("undo");
    expect(editor.document.rootChildren.map((shape) => shape.id)).toEqual([
      "a",
      "b",
      "c"
    ]);
    expect(editor.document.findById("grouped")).toBeUndefined();
    expect(editor.document.parentOf("a")).toBeNull();

    editor.execute("redo");
    expect(editor.document.rootChildren.map((shape) => shape.id)).toEqual([
      "grouped",
      "b"
    ]);
    expect(editor.document.findById("grouped")?.children.map((shape) => shape.id)).toEqual([
      "a",
      "c"
    ]);
  });

  it("restores cross-parent grouping with parents and sibling positions", () => {
    const editor = new TestEditor();
    editor.execute("init");
    editor.execute("create", "g", "parent");
    editor.execute("create", "rect", "root", "0", "0", "1", "1");
    editor.execute("create", "rect", "nested", "2", "2", "1", "1", "in", "parent");
    editor.execute("create", "rect", "tail", "3", "3", "1", "1");
    editor.execute("group", "cross", "tail", "nested", "root");

    editor.execute("undo");
    expect(editor.document.rootChildren.map((shape) => shape.id)).toEqual([
      "parent",
      "root",
      "tail"
    ]);
    expect(editor.document.findById("parent")?.children.map((shape) => shape.id)).toEqual([
      "nested"
    ]);
    expect(editor.document.findById("cross")).toBeUndefined();

    editor.execute("redo");
    expect(editor.document.rootChildren.map((shape) => shape.id)).toEqual([
      "parent",
      "cross"
    ]);
    expect(editor.document.findById("cross")?.children.map((shape) => shape.id)).toEqual([
      "nested",
      "root",
      "tail"
    ]);
  });

  it("undoes ungroup, addto, front, and back as complete units", () => {
    const editor = new TestEditor();
    editor.execute("init");
    editor.execute("create", "g", "target");
    editor.execute("create", "g", "nested", "in", "target");
    editor.execute("create", "rect", "first", "0", "0", "1", "1", "in", "nested");
    editor.execute("create", "rect", "second", "2", "2", "1", "1");

    editor.execute("addto", "target", "second");
    editor.execute("front", "nested");
    editor.execute("ungroup", "nested");
    editor.execute("back", "first");
    editor.execute("undo");
    expect(editor.document.findById("target")?.children.map((shape) => shape.id)).toEqual([
      "second",
      "first"
    ]);
    editor.execute("undo");
    expect(editor.document.findById("nested")).toBeInstanceOf(GroupShape);
    expect(editor.document.findById("nested")?.children.map((shape) => shape.id)).toEqual([
      "first"
    ]);
    editor.execute("undo");
    expect(editor.document.findById("target")?.children.map((shape) => shape.id)).toEqual([
      "nested",
      "second"
    ]);
    editor.execute("undo");
    expect(editor.document.rootChildren.map((shape) => shape.id)).toEqual([
      "target",
      "second"
    ]);
    expect(editor.document.findById("target")?.children.map((shape) => shape.id)).toEqual([
      "nested"
    ]);
  });

  it("restores recursive move and scale of nested groups", () => {
    const editor = new TestEditor();
    editor.execute("init");
    editor.execute("create", "g", "outer");
    editor.execute("create", "g", "inner", "in", "outer");
    editor.execute("create", "rect", "rect", "10", "20", "30", "40", "in", "inner");
    editor.execute("create", "text", "label", "5", "6", "hello", "in", "inner");
    editor.execute("move", "outer", "4", "8");
    editor.execute("scale", "outer", "0.5");

    editor.execute("undo");
    expect(editor.document.findById("rect")).toMatchObject({
      x: 14,
      y: 28,
      width: 30,
      height: 40
    });
    editor.execute("undo");
    expect(editor.document.findById("rect")).toMatchObject({
      x: 10,
      y: 20,
      width: 30,
      height: 40
    });
    expect(editor.document.findById("label")).toBeInstanceOf(TextShape);
  });
});

describe("history rules and IO barrier", () => {
  it("clears redo after a new successful edit", () => {
    const editor = new TestEditor();
    editor.execute("init");
    editor.execute("create", "rect", "a", "0", "0", "1", "1");
    editor.execute("undo");
    editor.execute("create", "circle", "b", "5", "5", "2");

    expect(() => editor.execute("redo")).toThrow("nothing to redo");
    expect(editor.document.findById("b")).toBeInstanceOf(CircleShape);
    expect(editor.document.findById("a")).toBeUndefined();
  });

  it("keeps redo available after a failed edit", () => {
    const editor = new TestEditor();
    editor.execute("init");
    editor.execute("create", "rect", "a", "0", "0", "1", "1");
    editor.execute("undo");
    expect(() => editor.execute("set", "missing", "fill", "red")).toThrow(
      "no such shape: missing"
    );

    editor.execute("redo");
    expect(editor.document.findById("a")).toBeInstanceOf(RectShape);
  });

  it("does not create a history unit for failed edits or help", () => {
    const editor = new TestEditor();
    editor.execute("init");
    editor.execute("create", "rect", "a", "0", "0", "1", "1");
    expect(() => editor.execute("move", "missing", "1", "1")).toThrow(
      "no such shape: missing"
    );
    editor.execute("help");
    editor.execute("undo");

    expect(editor.document.shapeCount).toBe(0);
  });

  it("preserves document and shape identity for a prevalidated failed edit", () => {
    const editor = new TestEditor();
    editor.execute("init");
    editor.execute("create", "rect", "stable", "1", "2", "3", "4");
    const document = editor.document;
    const shape = editor.document.findById("stable");

    expect(() => editor.execute("set", "stable", "width", "-1")).toThrow(
      "invalid width: -1"
    );
    expect(editor.document).toBe(document);
    expect(editor.document.findById("stable")).toBe(shape);
  });

  it("activates the IO barrier after init and rejects undo and redo", () => {
    const editor = new TestEditor();
    editor.execute("init");

    expect(() => editor.execute("undo")).toThrow(
      "undo not allowed after io command"
    );
    expect(() => editor.execute("redo")).toThrow(
      "undo not allowed after io command"
    );
    expect([editor.document.width, editor.document.height]).toEqual([800, 600]);
  });

  it("keeps the barrier after failed edits and clears it after a successful edit", () => {
    const editor = new TestEditor();
    editor.execute("init");
    expect(() => editor.execute("create", "rect", "bad", "0", "0", "-1", "1")).toThrow(
      "invalid width: -1"
    );
    expect(() => editor.execute("undo")).toThrow(
      "undo not allowed after io command"
    );

    editor.execute("create", "rect", "good", "0", "0", "1", "1");
    editor.execute("undo");
    expect(editor.document.shapeCount).toBe(0);
    editor.execute("redo");
    expect(editor.document.findById("good")).toBeInstanceOf(RectShape);
  });

  it("does not clear old history when init fails", () => {
    const editor = new TestEditor();
    editor.execute("init");
    editor.execute("create", "rect", "a", "0", "0", "1", "1");
    const document = editor.document;

    expect(() => editor.execute("init", "0", "300")).toThrow("invalid width: 0");
    expect(editor.document).toBe(document);
    editor.execute("undo");
    expect(editor.document.shapeCount).toBe(0);
  });

  it("does not allow history to cross a successful init", () => {
    const editor = new TestEditor();
    editor.execute("init", "800", "600");
    editor.execute("create", "rect", "old", "0", "0", "1", "1");
    editor.execute("init", "400", "300");

    expect(() => editor.execute("undo")).toThrow(
      "undo not allowed after io command"
    );
    expect(() => editor.execute("redo")).toThrow(
      "undo not allowed after io command"
    );
    expect([editor.document.width, editor.document.height]).toEqual([400, 300]);
    expect(editor.document.shapeCount).toBe(0);
  });

  it("returns uniform errors at empty stack boundaries", () => {
    const editor = new TestEditor();

    expect(() => editor.execute("undo")).toThrow("nothing to undo");
    expect(() => editor.execute("redo")).toThrow("nothing to redo");
  });

  it("does not move stack pointers when snapshot restoration fails", () => {
    const history = new CommandHistory();
    const snapshot = new DocumentSnapshot(100, 100, []);
    history.record(snapshot, snapshot);

    expect(() =>
      history.undo(() => {
        throw new Error("restore failed");
      })
    ).toThrow("restore failed");
    expect(history.undoDepth).toBe(1);
    expect(history.redoDepth).toBe(0);

    history.undo(() => undefined);
    expect(history.undoDepth).toBe(0);
    expect(history.redoDepth).toBe(1);
    expect(() =>
      history.redo(() => {
        throw new Error("redo restore failed");
      })
    ).toThrow("redo restore failed");
    expect(history.undoDepth).toBe(0);
    expect(history.redoDepth).toBe(1);
  });

  it("clears both stacks and activates the IO barrier for a document command", () => {
    const history = new CommandHistory();
    const before = new DocumentSnapshot(100, 100, []);
    const after = new DocumentSnapshot(200, 200, []);
    history.record(before, after);
    history.undo(() => undefined);
    expect([history.undoDepth, history.redoDepth]).toEqual([0, 1]);

    history.resetAfterDocumentCommand();

    expect([history.undoDepth, history.redoDepth]).toEqual([0, 0]);
    expect(history.isIoBarrierActive).toBe(true);
    expect(() => history.undo(() => undefined)).toThrow(
      "undo not allowed after io command"
    );
  });
});

describe("mid-command rollback", () => {
  it("does not execute an edit when the before snapshot cannot be captured", () => {
    const editor = new TestEditor();
    editor.execute("init");
    editor.execute("create", "rect", "rect", "10", "20", "30", "40");
    const document = editor.document;
    const session = editor.createSession(
      new FailingCaptureSnapshotter(new ShapeFactory())
    );
    session.setDocument(document);

    expect(() => session.execute("move", ["rect", "5", "5"])).toThrow(
      "before snapshot failed"
    );
    expect(session.document).toBe(document);
    expect(document.findById("rect")).toMatchObject({ x: 10, y: 20 });
  });

  it("rolls back and records no history when the after snapshot fails", () => {
    const editor = new TestEditor();
    editor.execute("init");
    editor.execute("create", "rect", "rect", "10", "20", "30", "40");
    const document = editor.document;
    const session = editor.createSession(
      new FailingAfterCaptureSnapshotter(new ShapeFactory())
    );
    session.setDocument(document);

    expect(() => session.execute("move", ["rect", "5", "5"])).toThrow(
      "after snapshot failed"
    );
    const restored = session.document;
    expect(restored).toBeDefined();

    if (restored === undefined) {
      throw new Error("expected session document");
    }

    expect(restored).not.toBe(document);
    expect(restored.findById("rect")).toMatchObject({ x: 10, y: 20 });
    expect(() => session.execute("undo", [])).toThrow("nothing to undo");
  });

  it("restores the pre-command document when an unexpected exception occurs", () => {
    const editor = new TestEditor();
    editor.execute("init");
    editor.execute("create", "rect", "rect", "10", "20", "30", "40");
    editor.register(new MutatingFailureCommand());
    const documentBeforeFailure = editor.document;

    expect(() => editor.execute("explode")).toThrow(
      "intentional command failure"
    );
    expect(editor.document).not.toBe(documentBeforeFailure);
    expect(editor.document.findById("rect")).toMatchObject({
      x: 10,
      y: 20,
      width: 30,
      height: 40
    });

    editor.execute("undo");
    expect(editor.document.shapeCount).toBe(0);
  });
});
