import { CliApplication } from "./cli/CliApplication.js";
import { CommandRegistry } from "./application/CommandRegistry.js";
import { AddToGroupCommand } from "./application/commands/AddToGroupCommand.js";
import { BackCommand } from "./application/commands/BackCommand.js";
import { CreateShapeCommand } from "./application/commands/CreateShapeCommand.js";
import { DeleteShapeCommand } from "./application/commands/DeleteShapeCommand.js";
import { FrontCommand } from "./application/commands/FrontCommand.js";
import { GroupCommand } from "./application/commands/GroupCommand.js";
import { HelpCommand } from "./application/commands/HelpCommand.js";
import { InitCommand } from "./application/commands/InitCommand.js";
import { MoveShapeCommand } from "./application/commands/MoveShapeCommand.js";
import { ScaleShapeCommand } from "./application/commands/ScaleShapeCommand.js";
import { SetAttributeCommand } from "./application/commands/SetAttributeCommand.js";
import { UngroupCommand } from "./application/commands/UngroupCommand.js";
import { EditorSession } from "./application/EditorSession.js";
import { ShapeFactory } from "./application/ShapeFactory.js";

const shapeFactory = new ShapeFactory();
const registry = new CommandRegistry();

registry.register(new InitCommand());
registry.register(new CreateShapeCommand(shapeFactory));
registry.register(new DeleteShapeCommand());
registry.register(new MoveShapeCommand());
registry.register(new ScaleShapeCommand());
registry.register(new SetAttributeCommand());
registry.register(new GroupCommand());
registry.register(new UngroupCommand());
registry.register(new AddToGroupCommand());
registry.register(new FrontCommand());
registry.register(new BackCommand());
registry.register(new HelpCommand(registry));

const session = new EditorSession(registry);
const cli = new CliApplication(session, process.stdin, process.stdout);

await cli.run();
