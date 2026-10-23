import { CommandArguments } from "../CommandArguments.js";
import type { CommandContext } from "../CommandContext.js";
import { CommandResult } from "../CommandResult.js";
import type { EditorCommand } from "../EditorCommand.js";
import { ShapeTypeNameVisitor } from "../ShapeTypeNameVisitor.js";

export class AddToGroupCommand implements EditorCommand {
  public readonly name = "addto";
  public readonly usage = "addto <gid> <id>";
  public readonly description = "Move an existing shape to a group's end.";
  public readonly category = "edit";

  public execute(
    context: CommandContext,
    arguments_: readonly string[]
  ): CommandResult {
    const commandArguments = new CommandArguments(arguments_, this.usage);
    commandArguments.requireExactCount(2);
    const groupId = commandArguments.required(0);
    const shapeId = commandArguments.required(1);
    const group = context.requireContainer(groupId);
    const shape = context.requireShape(shapeId);
    context.requireDocument().addShapeToGroup(group.id, shape.id);
    const typeName = shape.accept(new ShapeTypeNameVisitor());

    return new CommandResult(
      `${typeName}#${shape.id} moved into g#${group.id}`
    );
  }
}
