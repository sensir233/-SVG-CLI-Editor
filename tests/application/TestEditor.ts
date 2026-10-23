import { CommandRegistry } from "../../src/application/CommandRegistry.js";
import { CreateShapeCommand } from "../../src/application/commands/CreateShapeCommand.js";
import { DeleteShapeCommand } from "../../src/application/commands/DeleteShapeCommand.js";
import { HelpCommand } from "../../src/application/commands/HelpCommand.js";
import { InitCommand } from "../../src/application/commands/InitCommand.js";
import { MoveShapeCommand } from "../../src/application/commands/MoveShapeCommand.js";
import { ScaleShapeCommand } from "../../src/application/commands/ScaleShapeCommand.js";
import { SetAttributeCommand } from "../../src/application/commands/SetAttributeCommand.js";
import { EditorSession } from "../../src/application/EditorSession.js";
import { ShapeFactory } from "../../src/application/ShapeFactory.js";
import type { SvgDocument } from "../../src/domain/SvgDocument.js";

export class TestEditor {
  public readonly session: EditorSession;

  public constructor() {
    const registry = new CommandRegistry();
    const shapeFactory = new ShapeFactory();

    registry.register(new InitCommand());
    registry.register(new CreateShapeCommand(shapeFactory));
    registry.register(new DeleteShapeCommand());
    registry.register(new MoveShapeCommand());
    registry.register(new ScaleShapeCommand());
    registry.register(new SetAttributeCommand());
    registry.register(new HelpCommand(registry));
    this.session = new EditorSession(registry);
  }

  public execute(commandName: string, ...arguments_: string[]): string {
    return this.session.execute(commandName, arguments_).message;
  }

  public get document(): SvgDocument {
    if (this.session.document === undefined) {
      throw new Error("test document has not been initialized");
    }

    return this.session.document;
  }
}
