import { describe, expect, it } from "vitest";
import { DomainError } from "../../src/domain/DomainError.js";
import { CircleShape } from "../../src/domain/shapes/CircleShape.js";
import { GroupShape } from "../../src/domain/shapes/GroupShape.js";
import { RectShape } from "../../src/domain/shapes/RectShape.js";
import { TextShape } from "../../src/domain/shapes/TextShape.js";

describe("GroupShape composite behavior", () => {
  it("recursively moves and scales nested descendants", () => {
    const rect = new RectShape("rect", 10, 20, 100, 50);
    const label = new TextShape("label", 20, 30, "node");
    const inner = new GroupShape("inner");
    inner.appendChild(rect);
    inner.appendChild(label);

    const circle = new CircleShape("circle", 5, 6, 7);
    const outer = new GroupShape("outer");
    outer.appendChild(inner);
    outer.appendChild(circle);

    outer.move(4, 8);

    expect([rect.x, rect.y, rect.width, rect.height]).toEqual([14, 28, 100, 50]);
    expect([label.x, label.y, label.text]).toEqual([24, 38, "node"]);
    expect([circle.cx, circle.cy, circle.r]).toEqual([9, 14, 7]);

    outer.scale(0.5);

    expect([rect.x, rect.y, rect.width, rect.height]).toEqual([7, 14, 50, 25]);
    expect([label.x, label.y]).toEqual([12, 19]);
    expect([circle.cx, circle.cy, circle.r]).toEqual([4.5, 7, 3.5]);
  });

  it("preserves child insertion order", () => {
    const first = new RectShape("first", 0, 0, 1, 1);
    const second = new CircleShape("second", 0, 0, 1);
    const third = new TextShape("third", 0, 0, "third");
    const group = new GroupShape("group");

    group.appendChild(first);
    group.appendChild(second);
    group.appendChild(third);

    expect(group.children.map((shape) => shape.id)).toEqual([
      "first",
      "second",
      "third"
    ]);
  });

  it("prevents direct and indirect container cycles", () => {
    const parent = new GroupShape("parent");
    const child = new GroupShape("child");
    parent.appendChild(child);

    expect(() => parent.appendChild(parent)).toThrowError(DomainError);
    expect(() => child.appendChild(parent)).toThrow(
      "cannot move a container into itself or its descendant: child"
    );
    expect(parent.children.map((shape) => shape.id)).toEqual(["child"]);
  });

  it("stores group styles without rewriting descendants", () => {
    const rect = new RectShape("rect", 0, 0, 10, 10, "blue");
    const group = new GroupShape("group");
    group.appendChild(rect);

    group.setAttribute("fill", "red");

    expect(group.fill).toBe("red");
    expect(rect.fill).toBe("blue");
    expect(() => group.setAttribute("x", "10")).toThrow(
      "unknown attribute: x"
    );
    expect(group.fill).toBe("red");
  });

  it("rejects an invalid scale before changing any descendant", () => {
    const rect = new RectShape("rect", 10, 20, 30, 40);
    const circle = new CircleShape("circle", 5, 6, 7);
    const group = new GroupShape("group");
    group.appendChild(rect);
    group.appendChild(circle);

    expect(() => group.scale(0)).toThrow("scale factor must be positive");
    expect([rect.x, rect.y, rect.width, rect.height]).toEqual([10, 20, 30, 40]);
    expect([circle.cx, circle.cy, circle.r]).toEqual([5, 6, 7]);
    expect(group.children.map((shape) => shape.id)).toEqual(["rect", "circle"]);
  });
});
