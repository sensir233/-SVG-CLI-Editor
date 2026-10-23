import { DomainError } from "../domain/DomainError.js";
import { GroupShape } from "../domain/shapes/GroupShape.js";
import type { Shape } from "../domain/Shape.js";
import type { SvgDocument } from "../domain/SvgDocument.js";
import { ApplicationError } from "./ApplicationError.js";
import type { CommandContext } from "./CommandContext.js";
import type { CommandResult } from "./CommandResult.js";
import type { CommandExecutor } from "./CommandExecutor.js";
import type { CommandRegistry } from "./CommandRegistry.js";

export class EditorSession implements CommandExecutor, CommandContext {
  private _document: SvgDocument | undefined;

  public constructor(private readonly registry: CommandRegistry) {}

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
      return this.registry.execute(commandName, arguments_, this);
    } catch (error) {
      if (error instanceof DomainError) {
        throw new ApplicationError("DOMAIN_ERROR", error.message);
      }

      throw error;
    }
  }
}
