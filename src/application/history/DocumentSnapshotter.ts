import { SvgDocument } from "../../domain/SvgDocument.js";
import type { ShapeFactory } from "../ShapeFactory.js";
import { DocumentSnapshot } from "./DocumentSnapshot.js";
import type { ShapeSnapshot } from "./ShapeSnapshot.js";
import { ShapeSnapshotVisitor } from "./ShapeSnapshotVisitor.js";

export class DocumentSnapshotter {
  private readonly visitor = new ShapeSnapshotVisitor();

  public constructor(private readonly shapeFactory: ShapeFactory) {}

  public capture(document: SvgDocument): DocumentSnapshot {
    return new DocumentSnapshot(
      document.width,
      document.height,
      document.rootChildren.map((shape) =>
        shape.accept<ShapeSnapshot>(this.visitor)
      )
    );
  }

  public restore(snapshot: DocumentSnapshot): SvgDocument {
    const document = new SvgDocument(snapshot.width, snapshot.height);

    for (const shapeSnapshot of snapshot.rootChildren) {
      document.addShape(this.shapeFactory.restore(shapeSnapshot));
    }

    return document;
  }
}
