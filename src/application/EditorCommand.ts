import type { CommandContext } from "./CommandContext.js";
import type { CommandResult } from "./CommandResult.js";

export type CommandCategory = "edit" | "document" | "readOnly" | "history";

export interface EditorCommand {
  readonly name: string;
  readonly usage: string;
  readonly description: string;
  readonly category: CommandCategory;
  execute(
    context: CommandContext,
    arguments_: readonly string[]
  ): CommandResult;
}
