import { ApplicationError } from "./ApplicationError.js";
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

  public resolve(name: string): EditorCommand {
    const command = this._commands.get(name);

    if (command === undefined) {
      throw new ApplicationError(
        "UNKNOWN_COMMAND",
        `unknown command: ${name}`
      );
    }

    return command;
  }

  public list(): readonly EditorCommand[] {
    return [...this._commands.values()];
  }
}
