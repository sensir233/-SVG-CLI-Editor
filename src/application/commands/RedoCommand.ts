import { CommandArguments } from "../CommandArguments.js";
import type { CommandContext } from "../CommandContext.js";
import { CommandResult } from "../CommandResult.js";
import type { EditorCommand } from "../EditorCommand.js";

export class RedoCommand implements EditorCommand {
  public readonly name = "redo";
  public readonly usage = "redo";
  public readonly description = "Redo the most recently undone edit.";
  public readonly category = "history";

  public execute(
    context: CommandContext,
    arguments_: readonly string[]
  ): CommandResult {
    const commandArguments = new CommandArguments(arguments_, this.usage);
    commandArguments.requireExactCount(0);
    context.redo();
    return new CommandResult("redo complete");
  }
}
