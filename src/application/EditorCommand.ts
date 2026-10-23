import type { CommandContext } from "./CommandContext.js";
import type { CommandResult } from "./CommandResult.js";

export interface EditorCommand {
  readonly name: string;
  readonly usage: string;
  readonly description: string;
  execute(
    context: CommandContext,
    arguments_: readonly string[]
  ): CommandResult;
}
