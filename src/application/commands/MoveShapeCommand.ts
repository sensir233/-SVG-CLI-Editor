import { CommandArguments } from "../CommandArguments.js";
import type { CommandContext } from "../CommandContext.js";
import { CommandResult } from "../CommandResult.js";
import type { EditorCommand } from "../EditorCommand.js";
import { ShapeTypeNameVisitor } from "../ShapeTypeNameVisitor.js";

export class MoveShapeCommand implements EditorCommand {
  public readonly name = "move";
  public readonly usage = "move <id> <dx> <dy>";
  public readonly description = "Move a shape or group by a delta.";
  public readonly category = "edit";

  public execute(
    context: CommandContext,
    arguments_: readonly string[]
  ): CommandResult {
    const commandArguments = new CommandArguments(arguments_, this.usage);
    commandArguments.requireExactCount(3);
    const id = commandArguments.required(0);
    const dx = commandArguments.finiteNumber(1, "dx");
    const dy = commandArguments.finiteNumber(2, "dy");
    const shape = context.requireShape(id);
    shape.move(dx, dy);
    const typeName = shape.accept(new ShapeTypeNameVisitor());
    return new CommandResult(`${typeName}#${id} moved by (${dx},${dy})`);
  }
}
