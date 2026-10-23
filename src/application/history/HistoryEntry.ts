import type { DocumentSnapshot } from "./DocumentSnapshot.js";

export class HistoryEntry {
  public constructor(
    public readonly before: DocumentSnapshot,
    public readonly after: DocumentSnapshot
  ) {
    Object.freeze(this);
  }
}
