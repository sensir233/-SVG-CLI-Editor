import type { GroupShape } from "../../domain/shapes/GroupShape.js";
import { CommandArguments } from "../CommandArguments.js";
import type { CommandContext } from "../CommandContext.js";
import { CommandResult } from "../CommandResult.js";
import type { EditorCommand } from "../EditorCommand.js";
import type { ShapeFactory } from "../ShapeFactory.js";
import { ShapeTypeNameVisitor } from "../ShapeTypeNameVisitor.js";

export class CreateShapeCommand implements EditorCommand {
  public readonly name = "create";
  public readonly usage =
    "create <type> <id> [params...] [in <containerId>]";
  public readonly description =
    "Create rect, circle, ellipse, line, text, or g.";

  public constructor(private readonly factory: ShapeFactory) {}

  public execute(
    context: CommandContext,
    arguments_: readonly string[]
  ): CommandResult {
    const document = context.requireDocument();
    const commandArguments = new CommandArguments(arguments_, this.usage);
    commandArguments.requireMinimum(2);
    const type = commandArguments.required(0);
    const id = commandArguments.required(1);

    const remaining = arguments_.slice(2);
    const inIndex = remaining.indexOf("in");
    let shapeParameters = remaining;
    let parent: GroupShape | null = null;

    if (inIndex !== -1) {
      if (
        inIndex !== remaining.length - 2 ||
        remaining[inIndex + 1] === undefined
      ) {
        commandArguments.rejectUsage();
      }

      const parentId = commandArguments.required(2 + inIndex + 1);

      parent = context.requireContainer(parentId);
      shapeParameters = remaining.slice(0, inIndex);
    }

    const shape = this.factory.create(type, id, shapeParameters);
    document.addShape(shape, parent);
    const typeName = shape.accept(new ShapeTypeNameVisitor());
    const parentSuffix = parent === null ? "" : ` in g#${parent.id}`;

    return new CommandResult(
      `${typeName}#${shape.id} created${parentSuffix}`
    );
  }
}
