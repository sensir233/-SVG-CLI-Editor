import { CommandArguments } from "../CommandArguments.js";
import type { CommandContext } from "../CommandContext.js";
import { CommandResult } from "../CommandResult.js";
import type { EditorCommand } from "../EditorCommand.js";

export class UndoCommand implements EditorCommand {
  public readonly name = "undo";
  public readonly usage = "undo";
  public readonly description = "Undo the most recent edit.";
  public readonly category = "history";

  public execute(
    context: CommandContext,
    arguments_: readonly string[]
  ): CommandResult {
    const commandArguments = new CommandArguments(arguments_, this.usage);
    commandArguments.requireExactCount(0);
    context.undo();
    return new CommandResult("undo complete");
  }
}
