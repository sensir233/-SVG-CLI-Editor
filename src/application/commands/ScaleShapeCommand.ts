import { CommandArguments } from "../CommandArguments.js";
import type { CommandContext } from "../CommandContext.js";
import { CommandResult } from "../CommandResult.js";
import type { EditorCommand } from "../EditorCommand.js";
import { ShapeTypeNameVisitor } from "../ShapeTypeNameVisitor.js";

export class ScaleShapeCommand implements EditorCommand {
  public readonly name = "scale";
  public readonly usage = "scale <id> <factor>";
  public readonly description = "Scale a shape or group from the origin.";
  public readonly category = "edit";

  public execute(
    context: CommandContext,
    arguments_: readonly string[]
  ): CommandResult {
    const commandArguments = new CommandArguments(arguments_, this.usage);
    commandArguments.requireExactCount(2);
    const id = commandArguments.required(0);
    const factor = commandArguments.finiteNumber(1, "factor");
    const shape = context.requireShape(id);
    shape.scale(factor);
    const typeName = shape.accept(new ShapeTypeNameVisitor());
    return new CommandResult(`${typeName}#${id} scaled by ${factor}`);
  }
}
