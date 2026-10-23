import { CommandArguments } from "../CommandArguments.js";
import type { CommandContext } from "../CommandContext.js";
import { CommandResult } from "../CommandResult.js";
import type { EditorCommand } from "../EditorCommand.js";

export class GroupCommand implements EditorCommand {
  public readonly name = "group";
  public readonly usage = "group <newGid> <id1> <id2>...";
  public readonly description =
    "Group existing shapes while preserving document order.";
  public readonly category = "edit";

  public execute(
    context: CommandContext,
    arguments_: readonly string[]
  ): CommandResult {
    const commandArguments = new CommandArguments(arguments_, this.usage);
    commandArguments.requireMinimum(3);
    const newGroupId = commandArguments.required(0);
    const memberIds = arguments_.slice(1);
    const group = context
      .requireDocument()
      .groupShapes(newGroupId, memberIds);

    return new CommandResult(
      `g#${group.id} created with ${group.children.length} children`
    );
  }
}
