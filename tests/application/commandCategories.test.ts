import { describe, expect, it } from "vitest";
import type { CommandCategory } from "../../src/application/EditorCommand.js";
import { TestEditor } from "./TestEditor.js";

describe("command categories", () => {
  it("classifies commands with metadata instead of name checks in the session", () => {
    const editor = new TestEditor();
    const categories = new Map(
      editor.listCommands().map((command) => [command.name, command.category])
    );
    const expected = new Map<string, CommandCategory>([
      ["init", "document"],
      ["create", "edit"],
      ["delete", "edit"],
      ["move", "edit"],
      ["scale", "edit"],
      ["set", "edit"],
      ["group", "edit"],
      ["ungroup", "edit"],
      ["addto", "edit"],
      ["front", "edit"],
      ["back", "edit"],
      ["undo", "history"],
      ["redo", "history"],
      ["help", "readOnly"]
    ]);

    expect(categories).toEqual(expected);
  });
});
