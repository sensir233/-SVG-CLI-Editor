import { PassThrough, Readable } from "node:stream";
import { describe, expect, it } from "vitest";
import { CliApplication } from "../../src/cli/CliApplication.js";
import { TestEditor } from "../application/TestEditor.js";

describe("CliApplication", () => {
  it("starts the REPL and processes empty and comment lines", async () => {
    const editor = new TestEditor();
    const input = Readable.from(["\n# comment\ninit 400 300\n"]);
    const output = new PassThrough();
    let text = "";
    output.on("data", (chunk: Buffer) => {
      text += chunk.toString();
    });

    await new CliApplication(editor.session, input, output).run();

    expect(text.startsWith("svg-editor 0.1 — type 'help' for commands\n")).toBe(
      true
    );
    expect(text).toContain("svg> canvas 400x300 created\n");
    expect(text).not.toContain("error:");
    expect(text.match(/svg> /g)).toHaveLength(4);
  });

  it("parses quoted text and executes multiple commands in one session", async () => {
    const editor = new TestEditor();
    const script = [
      "init 800 600",
      "create g scene",
      'create text title 20 40 "My Diagram" in scene',
      "move title 5 6",
      "set title text \"My Diagram v2\"",
      "delete title"
    ].join("\n");
    const input = Readable.from([`${script}\n`]);
    const output = new PassThrough();
    let text = "";
    output.on("data", (chunk: Buffer) => {
      text += chunk.toString();
    });

    await new CliApplication(editor.session, input, output).run();

    expect(text).toContain("text#title created in g#scene");
    expect(text).toContain("text#title moved by (5,6)");
    expect(text).toContain('text#title updated: text="My Diagram v2"');
    expect(text).toContain("text#title deleted");
    expect(editor.document.findById("title")).toBeUndefined();
  });

  it("continues after errors and keeps the previous document intact", async () => {
    const editor = new TestEditor();
    const script = [
      "unknown",
      "init 100 100",
      "create rect r1 0 0 50 50",
      "create rect bad 0 0 -50 20",
      "move missing 10 10",
      "scale r1 0",
      "create hexagon h1",
      "create circle c1 10 10 5"
    ].join("\n");
    const input = Readable.from([`${script}\n`]);
    const output = new PassThrough();
    let text = "";
    output.on("data", (chunk: Buffer) => {
      text += chunk.toString();
    });

    await new CliApplication(editor.session, input, output).run();

    expect(text).toContain("error: unknown command: unknown");
    expect(text).toContain("error: invalid width: -50");
    expect(text).toContain("error: no such shape: missing");
    expect(text).toContain("error: scale factor must be positive");
    expect(text).toContain(
      "error: unknown shape type: hexagon (is the plugin loaded?)"
    );
    expect(text).toContain("circle#c1 created");
    expect(editor.document.findById("r1")).toBeDefined();
    expect(editor.document.findById("bad")).toBeUndefined();
  });

  it("reports parse failures without throwing out of the REPL", () => {
    const editor = new TestEditor();
    const cli = new CliApplication(
      editor.session,
      Readable.from([]),
      new PassThrough()
    );

    expect(cli.executeLine('create text t 0 0 "unterminated')).toBe(
      "error: unterminated quoted argument"
    );
    expect(cli.executeLine("")).toBeUndefined();
  });
});
