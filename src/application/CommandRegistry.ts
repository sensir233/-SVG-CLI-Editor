import { ApplicationError } from "./ApplicationError.js";
import type { CommandContext } from "./CommandContext.js";
import type { CommandResult } from "./CommandResult.js";
import type { EditorCommand } from "./EditorCommand.js";

export class CommandRegistry {
  private readonly _commands = new Map<string, EditorCommand>();

  public register(command: EditorCommand): void {
    if (this._commands.has(command.name)) {
      throw new ApplicationError(
        "INVALID_ARGUMENT",
        `duplicate command registration: ${command.name}`
      );
    }

    this._commands.set(command.name, command);
  }

  public execute(
    name: string,
    arguments_: readonly string[],
    context: CommandContext
  ): CommandResult {
    const command = this._commands.get(name);

    if (command === undefined) {
      throw new ApplicationError(
        "UNKNOWN_COMMAND",
        `unknown command: ${name}`
      );
    }

    return command.execute(context, arguments_);
  }

  public list(): readonly EditorCommand[] {
    return [...this._commands.values()];
  }
}
