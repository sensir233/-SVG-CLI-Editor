import { CommandArguments } from "../CommandArguments.js";
import type { CommandContext } from "../CommandContext.js";
import { CommandResult } from "../CommandResult.js";
import type { EditorCommand } from "../EditorCommand.js";
import { ShapeTypeNameVisitor } from "../ShapeTypeNameVisitor.js";

export class BackCommand implements EditorCommand {
  public readonly name = "back";
  public readonly usage = "back <id>";
  public readonly description = "Move a shape to the back of its siblings.";
  public readonly category = "edit";

  public execute(
    context: CommandContext,
    arguments_: readonly string[]
  ): CommandResult {
    const commandArguments = new CommandArguments(arguments_, this.usage);
    commandArguments.requireExactCount(1);
    const id = commandArguments.required(0);
    const shape = context.requireShape(id);
    context.requireDocument().sendToBack(id);
    const typeName = shape.accept(new ShapeTypeNameVisitor());
    return new CommandResult(`${typeName}#${id} moved to back`);
  }
}
