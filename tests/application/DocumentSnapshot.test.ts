import { describe, expect, it } from "vitest";
import { DocumentSnapshot } from "../../src/application/history/DocumentSnapshot.js";
import { DocumentSnapshotter } from "../../src/application/history/DocumentSnapshotter.js";
import type { ShapeSnapshot } from "../../src/application/history/ShapeSnapshot.js";
import { ShapeFactory } from "../../src/application/ShapeFactory.js";
import { CircleShape } from "../../src/domain/shapes/CircleShape.js";
import { EllipseShape } from "../../src/domain/shapes/EllipseShape.js";
import { GroupShape } from "../../src/domain/shapes/GroupShape.js";
import { LineShape } from "../../src/domain/shapes/LineShape.js";
import { RectShape } from "../../src/domain/shapes/RectShape.js";
import { TextShape } from "../../src/domain/shapes/TextShape.js";
import { DomainError } from "../../src/domain/DomainError.js";
import { SvgDocument } from "../../src/domain/SvgDocument.js";

describe("DocumentSnapshot", () => {
  it("captures all state without retaining mutable shape references", () => {
    const document = new SvgDocument(640, 480);
    const group = new GroupShape("group", "container-fill", "container-stroke", 4);
    const rect = new RectShape("rect", 10, 20, 100, 50, "red");
    const text = new TextShape("text", 30, 40, "before", undefined, "blue", 2);
    const circle = new CircleShape("circle", 200, 220, 15);
    document.addShape(group);
    document.addShape(circle);
    document.addShape(rect, group);
    document.addShape(text, group);
    const snapshotter = new DocumentSnapshotter(new ShapeFactory());

    const snapshot = snapshotter.capture(document);
    const serialized = JSON.stringify(snapshot);
    rect.setAttribute("fill", "green");
    text.setAttribute("text", "after");
    circle.scale(2);

    expect(JSON.stringify(snapshot)).toBe(serialized);
    expect(snapshot.rootChildren.map((shape) => shape.id)).toEqual([
      "group",
      "circle"
    ]);
    expect(snapshot.width).toBe(640);
    expect(snapshot.height).toBe(480);
    expect(snapshot.hasSameState(snapshotter.capture(document))).toBe(false);
    expect(() =>
      (snapshot.rootChildren as ShapeSnapshot[]).push(snapshot.rootChildren[0]!)
    ).toThrow(TypeError);
    expect(() => {
      (snapshot as { width: number }).width = 1;
    }).toThrow(TypeError);
  });

  it("restores all types, nesting, styles, text, order, and ownership", () => {
    const document = new SvgDocument(800, 600);
    const outer = new GroupShape("outer", "black", "none", 1);
    const inner = new GroupShape("inner");
    const rect = new RectShape("rect", 10, 20, 100, 50, "red", "black", 2);
    const text = new TextShape("text", 20, 40, "hello", "white");
    const circle = new CircleShape("circle", 200, 100, 30, undefined, "blue");
    const ellipse = new EllipseShape("ellipse", 40, 50, 10, 5, "green");
    const line = new LineShape("line", 1, 2, 3, 4, undefined, "black", 3);
    document.addShape(outer);
    document.addShape(circle);
    document.addShape(ellipse);
    document.addShape(line);
    document.addShape(inner, outer);
    document.addShape(rect, inner);
    document.addShape(text, inner);
    const snapshotter = new DocumentSnapshotter(new ShapeFactory());
    const snapshot = snapshotter.capture(document);

    const restored = snapshotter.restore(snapshot);

    expect(restored).not.toBe(document);
    expect(restored.width).toBe(800);
    expect(restored.height).toBe(600);
    expect(restored.rootChildren.map((shape) => shape.id)).toEqual([
      "outer",
      "circle",
      "ellipse",
      "line"
    ]);
    expect(restored.parentOf("inner")).toBe(restored.findById("outer"));
    expect(restored.parentOf("rect")).toBe(restored.findById("inner"));
    expect(restored.parentOf("circle")).toBeNull();
    expect(restored.findById("rect")).toMatchObject({
      x: 10,
      y: 20,
      width: 100,
      height: 50,
      fill: "red",
      stroke: "black",
      strokeWidth: 2
    });
    expect(restored.findById("text")).toMatchObject({
      x: 20,
      y: 40,
      text: "hello",
      fill: "white",
      stroke: undefined,
      strokeWidth: undefined
    });
    expect(restored.findById("circle")).toMatchObject({
      cx: 200,
      cy: 100,
      r: 30,
      fill: undefined,
      stroke: "blue"
    });
    expect(restored.findById("ellipse")).toMatchObject({
      cx: 40,
      cy: 50,
      rx: 10,
      ry: 5,
      fill: "green"
    });
    expect(restored.findById("line")).toMatchObject({
      x1: 1,
      y1: 2,
      x2: 3,
      y2: 4,
      fill: undefined,
      stroke: "black",
      strokeWidth: 3
    });
    expect(restored.findById("outer")).toMatchObject({
      fill: "black",
      stroke: "none",
      strokeWidth: 1
    });
    expect(restored.shapeCount).toBe(7);
    expect(
      new Set(
        ["outer", "inner", "rect", "text", "circle", "ellipse", "line"].map(
          (id) => restored.findById(id)
        )
      ).size
    ).toBe(7);

    const restoredGroup = restored.findById("inner");
    expect(restoredGroup).toBeInstanceOf(GroupShape);
    expect(() =>
      (restoredGroup as GroupShape).appendChild(new RectShape("x", 0, 0, 1, 1))
    ).toThrow(DomainError);
    expect(() =>
      (restoredGroup as GroupShape).appendChildForDocument(
        new RectShape("x", 0, 0, 1, 1),
        {}
      )
    ).toThrow("cannot modify shape structure outside SvgDocument: inner");
  });

  it("keeps snapshots independent when the same document is restored twice", () => {
    const document = new SvgDocument(100, 100);
    document.addShape(new RectShape("rect", 1, 2, 3, 4, "red"));
    const snapshotter = new DocumentSnapshotter(new ShapeFactory());
    const snapshot = snapshotter.capture(document);
    const first = snapshotter.restore(snapshot);
    const second = snapshotter.restore(snapshot);

    expect(first).not.toBe(second);
    expect(first.findById("rect")).not.toBe(second.findById("rect"));
    expect(JSON.stringify(snapshotter.capture(first))).toBe(
      JSON.stringify(snapshot)
    );
    expect(JSON.stringify(snapshotter.capture(second))).toBe(
      JSON.stringify(snapshot)
    );
  });

  it("exposes a semantic equality helper used by failed-edit rollback", () => {
    const left = new DocumentSnapshot(100, 100, []);
    const right = new DocumentSnapshot(100, 100, []);
    const different = new DocumentSnapshot(100, 200, []);

    expect(left.hasSameState(right)).toBe(true);
    expect(left.hasSameState(different)).toBe(false);
  });
});
