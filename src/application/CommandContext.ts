import type { GroupShape } from "../domain/shapes/GroupShape.js";
import type { Shape } from "../domain/Shape.js";
import type { SvgDocument } from "../domain/SvgDocument.js";

export interface CommandContext {
  readonly document: SvgDocument | undefined;
  setDocument(document: SvgDocument): void;
  requireDocument(): SvgDocument;
  requireShape(id: string): Shape;
  requireContainer(id: string): GroupShape;
}
