import type { CommandResult } from "./CommandResult.js";

export interface CommandExecutor {
  execute(commandName: string, arguments_: readonly string[]): CommandResult;
}
