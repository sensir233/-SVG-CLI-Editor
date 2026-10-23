import { DomainError } from "../domain/DomainError.js";
import { GroupShape } from "../domain/shapes/GroupShape.js";
import type { Shape } from "../domain/Shape.js";
import type { SvgDocument } from "../domain/SvgDocument.js";
import { ApplicationError } from "./ApplicationError.js";
import type { CommandContext } from "./CommandContext.js";
import type { CommandResult } from "./CommandResult.js";
import type { CommandExecutor } from "./CommandExecutor.js";
import type { CommandRegistry } from "./CommandRegistry.js";
import type { EditorCommand } from "./EditorCommand.js";
import { CommandHistory } from "./history/CommandHistory.js";
import type { DocumentSnapshot } from "./history/DocumentSnapshot.js";
import type { DocumentSnapshotter } from "./history/DocumentSnapshotter.js";

export class EditorSession implements CommandExecutor, CommandContext {
  private _document: SvgDocument | undefined;

  public constructor(
    private readonly registry: CommandRegistry,
    private readonly snapshotter: DocumentSnapshotter,
    private readonly history = new CommandHistory()
  ) {}

  public get document(): SvgDocument | undefined {
    return this._document;
  }

  public setDocument(document: SvgDocument): void {
    this._document = document;
  }

  public requireDocument(): SvgDocument {
    if (this._document === undefined) {
      throw new ApplicationError(
        "NO_DOCUMENT",
        "no document. use 'init' or 'read' first"
      );
    }

    return this._document;
  }

  public requireShape(id: string): Shape {
    const shape = this.requireDocument().findById(id);

    if (shape === undefined) {
      throw new ApplicationError(
        "INVALID_ARGUMENT",
        `no such shape: ${id}`
      );
    }

    return shape;
  }

  public requireContainer(id: string): GroupShape {
    const shape = this.requireDocument().findById(id);

    if (shape === undefined) {
      throw new ApplicationError(
        "INVALID_ARGUMENT",
        `no such container: ${id}`
      );
    }

    if (!(shape instanceof GroupShape)) {
      throw new ApplicationError(
        "INVALID_ARGUMENT",
        `not a container: ${id}`
      );
    }

    return shape;
  }

  public execute(
    commandName: string,
    arguments_: readonly string[]
  ): CommandResult {
    try {
      const command = this.registry.resolve(commandName);

      if (command.category === "edit") {
        return this.executeEdit(command, arguments_);
      }

      const result = command.execute(this, arguments_);

      if (command.category === "document") {
        this.history.resetAfterDocumentCommand();
      }

      return result;
    } catch (error) {
      if (error instanceof DomainError) {
        throw new ApplicationError("DOMAIN_ERROR", error.message);
      }

      throw error;
    }
  }

  public undo(): void {
    this.history.undo((snapshot) => {
      this._document = this.snapshotter.restore(snapshot);
    });
  }

  public redo(): void {
    this.history.redo((snapshot) => {
      this._document = this.snapshotter.restore(snapshot);
    });
  }

  private executeEdit(
    command: EditorCommand,
    arguments_: readonly string[]
  ): CommandResult {
    if (this._document === undefined) {
      return command.execute(this, arguments_);
    }

    const before = this.snapshotter.capture(this._document);

    try {
      const result = command.execute(this, arguments_);
      const after = this.snapshotter.capture(this.requireDocument());
      this.history.record(before, after);
      return result;
    } catch (error) {
      this.restoreAfterFailedEdit(before);
      throw error;
    }
  }

  private restoreAfterFailedEdit(before: DocumentSnapshot): void {
    let current: DocumentSnapshot | undefined;

    if (this._document !== undefined) {
      try {
        current = this.snapshotter.capture(this._document);
      } catch {
        current = undefined;
      }
    }

    if (current !== undefined && current.hasSameState(before)) {
      return;
    }

    this._document = this.snapshotter.restore(before);
  }
}
