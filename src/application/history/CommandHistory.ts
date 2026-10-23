import { ApplicationError } from "../ApplicationError.js";
import type { DocumentSnapshot } from "./DocumentSnapshot.js";
import { HistoryEntry } from "./HistoryEntry.js";

export class CommandHistory {
  private readonly undoStack: HistoryEntry[] = [];
  private readonly redoStack: HistoryEntry[] = [];
  private ioBarrier = false;

  public get undoDepth(): number {
    return this.undoStack.length;
  }

  public get redoDepth(): number {
    return this.redoStack.length;
  }

  public get isIoBarrierActive(): boolean {
    return this.ioBarrier;
  }

  public record(before: DocumentSnapshot, after: DocumentSnapshot): void {
    this.undoStack.push(new HistoryEntry(before, after));
    this.redoStack.length = 0;
    this.ioBarrier = false;
  }

  public resetAfterDocumentCommand(): void {
    this.undoStack.length = 0;
    this.redoStack.length = 0;
    this.ioBarrier = true;
  }

  public undo(restore: (snapshot: DocumentSnapshot) => void): void {
    this.assertHistoryAccessible();
    const entry = this.undoStack[this.undoStack.length - 1];

    if (entry === undefined) {
      throw new ApplicationError("HISTORY_UNAVAILABLE", "nothing to undo");
    }

    restore(entry.before);
    this.undoStack.pop();
    this.redoStack.push(entry);
  }

  public redo(restore: (snapshot: DocumentSnapshot) => void): void {
    this.assertHistoryAccessible();
    const entry = this.redoStack[this.redoStack.length - 1];

    if (entry === undefined) {
      throw new ApplicationError("HISTORY_UNAVAILABLE", "nothing to redo");
    }

    restore(entry.after);
    this.redoStack.pop();
    this.undoStack.push(entry);
  }

  private assertHistoryAccessible(): void {
    if (this.ioBarrier) {
      throw new ApplicationError(
        "IO_BARRIER",
        "undo not allowed after io command"
      );
    }
  }
}
