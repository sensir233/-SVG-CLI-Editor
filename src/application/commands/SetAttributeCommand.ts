import { CommandArguments } from "../CommandArguments.js";
import type { CommandContext } from "../CommandContext.js";
import { CommandResult } from "../CommandResult.js";
import type { EditorCommand } from "../EditorCommand.js";
import { ShapeTypeNameVisitor } from "../ShapeTypeNameVisitor.js";

export class SetAttributeCommand implements EditorCommand {
  public readonly name = "set";
  public readonly usage = "set <id> <attribute> <value>";
  public readonly description = "Set an allowed shape attribute.";

  public execute(
    context: CommandContext,
    arguments_: readonly string[]
  ): CommandResult {
    const commandArguments = new CommandArguments(arguments_, this.usage);
    commandArguments.requireExactCount(3);
    const id = commandArguments.required(0);
    const attribute = commandArguments.required(1);
    const value = commandArguments.required(2);

    const shape = context.requireShape(id);
    shape.setAttribute(attribute, value);
    const typeName = shape.accept(new ShapeTypeNameVisitor());
    return new CommandResult(
      `${typeName}#${id} updated: ${attribute}="${value}"`
    );
  }
}
