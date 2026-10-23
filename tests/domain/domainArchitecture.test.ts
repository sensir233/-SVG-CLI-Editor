import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const projectRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const domainFiles = [
  "src/domain/DomainError.ts",
  "src/domain/Shape.ts",
  "src/domain/ShapeVisitor.ts",
  "src/domain/SvgDocument.ts",
  "src/domain/shapes/StyledShape.ts",
  "src/domain/shapes/RectShape.ts",
  "src/domain/shapes/CircleShape.ts",
  "src/domain/shapes/EllipseShape.ts",
  "src/domain/shapes/LineShape.ts",
  "src/domain/shapes/TextShape.ts",
  "src/domain/shapes/GroupShape.ts"
];

describe("domain architecture", () => {
  it("does not depend on outer layers or the Node.js runtime", () => {
    for (const relativePath of domainFiles) {
      const source = readFileSync(join(projectRoot, relativePath), "utf8");

      expect(source, relativePath).not.toMatch(
        /from\s+["'](?:node:|\.\.\/(?:application|cli|svg))/
      );
    }
  });

  it("uses one file for every concrete shape class", () => {
    const expectedClasses = new Map([
      ["src/domain/Shape.ts", "export abstract class Shape"],
      ["src/domain/shapes/RectShape.ts", "export class RectShape"],
      ["src/domain/shapes/CircleShape.ts", "export class CircleShape"],
      ["src/domain/shapes/EllipseShape.ts", "export class EllipseShape"],
      ["src/domain/shapes/LineShape.ts", "export class LineShape"],
      ["src/domain/shapes/TextShape.ts", "export class TextShape"],
      ["src/domain/shapes/GroupShape.ts", "export class GroupShape"],
      ["src/domain/SvgDocument.ts", "export class SvgDocument"]
    ]);

    for (const [relativePath, classDeclaration] of expectedClasses) {
      const source = readFileSync(join(projectRoot, relativePath), "utf8");
      expect(source, relativePath).toContain(classDeclaration);
    }
  });

  it("does not introduce the future box plugin in the domain layer", () => {
    expect(existsSync(join(projectRoot, "src/domain/shapes/BoxShape.ts"))).toBe(
      false
    );
    expect(
      domainFiles.some((relativePath) =>
        readFileSync(join(projectRoot, relativePath), "utf8").includes("box")
      )
    ).toBe(false);
  });
});
