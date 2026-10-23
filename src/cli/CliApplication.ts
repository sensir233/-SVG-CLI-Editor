import { createInterface } from "node:readline";
import type { Readable, Writable } from "node:stream";
import type { CommandExecutor } from "../application/CommandExecutor.js";
import { CommandLexer } from "./CommandLexer.js";

export class CliApplication {
  public static readonly STARTUP_MESSAGE =
    "svg-editor 0.1 — type 'help' for commands";
  public static readonly PROMPT = "svg> ";

  private readonly lexer = new CommandLexer();

  public constructor(
    private readonly executor: CommandExecutor,
    private readonly input: Readable,
    private readonly output: Writable
  ) {}

  public async run(): Promise<void> {
    const readline = createInterface({
      input: this.input,
      crlfDelay: Number.POSITIVE_INFINITY,
      terminal: false
    });
    const lines = readline[Symbol.asyncIterator]();

    this.output.write(`${CliApplication.STARTUP_MESSAGE}\n`);

    while (true) {
      this.output.write(CliApplication.PROMPT);
      const next = await lines.next();

      if (next.done) {
        break;
      }

      const response = this.executeLine(next.value);

      if (response !== undefined) {
        this.output.write(`${response}\n`);
      }
    }

    readline.close();
  }

  public executeLine(line: string): string | undefined {
    try {
      const tokens = this.lexer.tokenize(line);

      if (tokens.length === 0) {
        return undefined;
      }

      const [commandName, ...arguments_] = tokens;

      if (commandName === undefined) {
        return undefined;
      }

      return this.executor.execute(commandName, arguments_).message;
    } catch (error) {
      if (error instanceof Error) {
        return `error: ${error.message}`;
      }

      return "error: unknown failure";
    }
  }
}
