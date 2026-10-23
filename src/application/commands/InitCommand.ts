import { SvgDocument } from "../../domain/SvgDocument.js";
import { CommandArguments } from "../CommandArguments.js";
import type { CommandContext } from "../CommandContext.js";
import { CommandResult } from "../CommandResult.js";
import type { EditorCommand } from "../EditorCommand.js";

export class InitCommand implements EditorCommand {
  public readonly name = "init";
  public readonly usage = "init [w] [h]";
  public readonly description = "Create a new SVG document.";

  public execute(
    context: CommandContext,
    arguments_: readonly string[]
  ): CommandResult {
    const commandArguments = new CommandArguments(arguments_, this.usage);
    commandArguments.requireRange(0, 2);
    const width =
      commandArguments.optional(0) === undefined
        ? 800
        : commandArguments.finiteNumber(0, "width");
    const height =
      commandArguments.optional(1) === undefined
        ? 600
        : commandArguments.finiteNumber(1, "height");
    const document = new SvgDocument(width, height);

    context.setDocument(document);
    return new CommandResult(
      `canvas ${document.width}x${document.height} created`
    );
  }
}
