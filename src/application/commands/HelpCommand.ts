import { CommandArguments } from "../CommandArguments.js";
import type { CommandContext } from "../CommandContext.js";
import { CommandResult } from "../CommandResult.js";
import type { CommandRegistry } from "../CommandRegistry.js";
import type { EditorCommand } from "../EditorCommand.js";

export class HelpCommand implements EditorCommand {
  public readonly name = "help";
  public readonly usage = "help";
  public readonly description = "Show the commands implemented in this phase.";
  public readonly category = "readOnly";

  public constructor(private readonly registry: CommandRegistry) {}

  public execute(
    _context: CommandContext,
    arguments_: readonly string[]
  ): CommandResult {
    const commandArguments = new CommandArguments(arguments_, this.usage);
    commandArguments.requireExactCount(0);
    const lines = ["Available commands:"];

    for (const command of this.registry.list()) {
      lines.push(`  ${command.usage} — ${command.description}`);
    }

    return new CommandResult(lines.join("\n"));
  }
}
