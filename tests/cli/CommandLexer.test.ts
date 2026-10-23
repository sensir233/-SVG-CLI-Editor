import { describe, expect, it } from "vitest";
import { CliParsingError } from "../../src/cli/CliParsingError.js";
import { CommandLexer } from "../../src/cli/CommandLexer.js";

describe("CommandLexer", () => {
  const lexer = new CommandLexer();

  it("ignores empty and comment lines", () => {
    expect(lexer.tokenize("")).toEqual([]);
    expect(lexer.tokenize("   ")).toEqual([]);
    expect(lexer.tokenize("# hidden command")).toEqual([]);
    expect(lexer.tokenize("   # another comment")).toEqual([]);
  });

  it("keeps color tokens beginning with hash", () => {
    expect(lexer.tokenize("create rect r 0 0 1 1 #ffffff")).toEqual([
      "create",
      "rect",
      "r",
      "0",
      "0",
      "1",
      "1",
      "#ffffff"
    ]);
  });

  it("parses quoted arguments with spaces and escaped quotes", () => {
    expect(
      lexer.tokenize('create text title 20 40 "My Diagram"')
    ).toEqual(["create", "text", "title", "20", "40", "My Diagram"]);
    expect(lexer.tokenize('set title text "say \\"hello\\""')).toEqual([
      "set",
      "title",
      "text",
      'say "hello"'
    ]);
    expect(lexer.tokenize('set title text ""')).toEqual([
      "set",
      "title",
      "text",
      ""
    ]);
  });

  it("rejects an unterminated quoted argument", () => {
    expect(() => lexer.tokenize('create text t 0 0 "unfinished')).toThrowError(
      CliParsingError
    );
    expect(() => lexer.tokenize('create text t 0 0 "unfinished')).toThrow(
      "unterminated quoted argument"
    );
  });
});
