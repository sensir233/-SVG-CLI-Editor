import { CliParsingError } from "./CliParsingError.js";

export class CommandLexer {
  public tokenize(line: string): string[] {
    if (line.trim().length === 0 || line.trimStart().startsWith("#")) {
      return [];
    }

    const tokens: string[] = [];
    let current = "";
    let inQuote = false;
    let escaping = false;
    let hasToken = false;

    for (const character of line) {
      if (inQuote) {
        if (escaping) {
          current += character;
          escaping = false;
        } else if (character === "\\") {
          escaping = true;
        } else if (character === '"') {
          inQuote = false;
        } else {
          current += character;
        }

        continue;
      }

      if (character === '"') {
        inQuote = true;
        hasToken = true;
      } else if (/\s/.test(character)) {
        if (hasToken) {
          tokens.push(current);
          current = "";
          hasToken = false;
        }
      } else {
        current += character;
        hasToken = true;
      }
    }

    if (inQuote) {
      throw new CliParsingError("unterminated quoted argument");
    }

    if (escaping) {
      current += "\\";
    }

    if (hasToken) {
      tokens.push(current);
    }

    return tokens;
  }
}
