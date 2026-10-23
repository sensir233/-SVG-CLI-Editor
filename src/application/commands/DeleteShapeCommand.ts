import { CommandArguments } from "../CommandArguments.js";
import type { CommandContext } from "../CommandContext.js";
import { CommandResult } from "../CommandResult.js";
import type { EditorCommand } from "../EditorCommand.js";
import { ShapeTypeNameVisitor } from "../ShapeTypeNameVisitor.js";

export class DeleteShapeCommand implements EditorCommand {
  public readonly name = "delete";
  public readonly usage = "delete <id>";
  public readonly description = "Delete a shape and all of its children.";

  public execute(
    context: CommandContext,
    arguments_: readonly string[]
  ): CommandResult {
    const commandArguments = new CommandArguments(arguments_, this.usage);
    commandArguments.requireExactCount(1);
    const id = commandArguments.required(0);

    const shape = context.requireShape(id);
    const typeName = shape.accept(new ShapeTypeNameVisitor());
    context.requireDocument().removeShape(id);
    return new CommandResult(`${typeName}#${id} deleted`);
  }
}
