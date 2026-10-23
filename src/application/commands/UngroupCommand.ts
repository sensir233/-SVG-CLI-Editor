import { CommandArguments } from "../CommandArguments.js";
import type { CommandContext } from "../CommandContext.js";
import { CommandResult } from "../CommandResult.js";
import type { EditorCommand } from "../EditorCommand.js";

export class UngroupCommand implements EditorCommand {
  public readonly name = "ungroup";
  public readonly usage = "ungroup <gid>";
  public readonly description = "Dissolve a nested group in place.";
  public readonly category = "edit";

  public execute(
    context: CommandContext,
    arguments_: readonly string[]
  ): CommandResult {
    const commandArguments = new CommandArguments(arguments_, this.usage);
    commandArguments.requireExactCount(1);
    const groupId = commandArguments.required(0);
    const group = context.requireContainer(groupId);

    context.requireDocument().ungroupShape(group.id);
    return new CommandResult(`g#${group.id} ungrouped`);
  }
}
