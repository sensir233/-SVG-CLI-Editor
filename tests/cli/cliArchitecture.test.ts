import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const projectRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const cliFiles = [
  "src/cli/CliApplication.ts",
  "src/cli/CliParsingError.ts",
  "src/cli/CommandLexer.ts"
];
const applicationFiles = [
  "src/application/ApplicationError.ts",
  "src/application/CommandArguments.ts",
  "src/application/CommandContext.ts",
  "src/application/CommandExecutor.ts",
  "src/application/CommandRegistry.ts",
  "src/application/CommandResult.ts",
  "src/application/EditorCommand.ts",
  "src/application/EditorSession.ts",
  "src/application/ShapeFactory.ts",
  "src/application/ShapeTypeNameVisitor.ts",
  "src/application/commands/CreateShapeCommand.ts",
  "src/application/commands/DeleteShapeCommand.ts",
  "src/application/commands/HelpCommand.ts",
  "src/application/commands/InitCommand.ts",
  "src/application/commands/MoveShapeCommand.ts",
  "src/application/commands/ScaleShapeCommand.ts",
  "src/application/commands/SetAttributeCommand.ts"
];

describe("CLI architecture", () => {
  it("keeps CLI from importing the domain layer directly", () => {
    for (const relativePath of cliFiles) {
      const source = readFileSync(join(projectRoot, relativePath), "utf8");
      expect(source, relativePath).not.toMatch(
        /from\s+["'][^"']*(?:\/domain\/|\.\.\/domain)/
      );
    }
  });

  it("keeps application independent from CLI, SVG IO, and Node.js APIs", () => {
    for (const relativePath of applicationFiles) {
      const source = readFileSync(join(projectRoot, relativePath), "utf8");
      expect(source, relativePath).not.toMatch(
        /from\s+["'](?:node:|[^"']*(?:\/cli\/|\.\.\/cli|\/svg\/|\.\.\/svg))/
      );
    }
  });

  it("does not scatter shape-type switches through CLI or application", () => {
    for (const relativePath of [...cliFiles, ...applicationFiles]) {
      const source = readFileSync(join(projectRoot, relativePath), "utf8");
      expect(source, relativePath).not.toMatch(/switch\s*\(/);
    }
  });
});
