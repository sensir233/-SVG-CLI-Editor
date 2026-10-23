import { CommandRegistry } from "../../src/application/CommandRegistry.js";
import { AddToGroupCommand } from "../../src/application/commands/AddToGroupCommand.js";
import { BackCommand } from "../../src/application/commands/BackCommand.js";
import { CreateShapeCommand } from "../../src/application/commands/CreateShapeCommand.js";
import { DeleteShapeCommand } from "../../src/application/commands/DeleteShapeCommand.js";
import { FrontCommand } from "../../src/application/commands/FrontCommand.js";
import { GroupCommand } from "../../src/application/commands/GroupCommand.js";
import { HelpCommand } from "../../src/application/commands/HelpCommand.js";
import { InitCommand } from "../../src/application/commands/InitCommand.js";
import { MoveShapeCommand } from "../../src/application/commands/MoveShapeCommand.js";
import { RedoCommand } from "../../src/application/commands/RedoCommand.js";
import { ScaleShapeCommand } from "../../src/application/commands/ScaleShapeCommand.js";
import { SetAttributeCommand } from "../../src/application/commands/SetAttributeCommand.js";
import { UngroupCommand } from "../../src/application/commands/UngroupCommand.js";
import { UndoCommand } from "../../src/application/commands/UndoCommand.js";
import { EditorSession } from "../../src/application/EditorSession.js";
import { DocumentSnapshotter } from "../../src/application/history/DocumentSnapshotter.js";
import { ShapeFactory } from "../../src/application/ShapeFactory.js";
import type { EditorCommand } from "../../src/application/EditorCommand.js";
import type { SvgDocument } from "../../src/domain/SvgDocument.js";

export class TestEditor {
  public readonly session: EditorSession;
  private readonly registry: CommandRegistry;

  public constructor() {
    this.registry = new CommandRegistry();
    const shapeFactory = new ShapeFactory();

    this.registry.register(new InitCommand());
    this.registry.register(new CreateShapeCommand(shapeFactory));
    this.registry.register(new DeleteShapeCommand());
    this.registry.register(new MoveShapeCommand());
    this.registry.register(new ScaleShapeCommand());
    this.registry.register(new SetAttributeCommand());
    this.registry.register(new GroupCommand());
    this.registry.register(new UngroupCommand());
    this.registry.register(new AddToGroupCommand());
    this.registry.register(new FrontCommand());
    this.registry.register(new BackCommand());
    this.registry.register(new UndoCommand());
    this.registry.register(new RedoCommand());
    this.registry.register(new HelpCommand(this.registry));
    this.session = new EditorSession(
      this.registry,
      new DocumentSnapshotter(shapeFactory)
    );
  }

  public register(command: EditorCommand): void {
    this.registry.register(command);
  }

  public listCommands(): readonly EditorCommand[] {
    return this.registry.list();
  }

  public createSession(snapshotter: DocumentSnapshotter): EditorSession {
    return new EditorSession(this.registry, snapshotter);
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
