import { Log } from "logging-middleware";

/**
 * In-memory read-state repository.
 *
 * The brief explicitly forbids storing the notifications themselves
 * ("you need not store the notifications in a database, nor are you supposed
 *  to hard-code or create notifications yourself"). It is silent on read
 * state, which is needed to distinguish new vs. already-viewed in the UI.
 *
 * We keep a process-local set of read IDs. The frontend mirrors the same
 * data in localStorage so a fresh BE process doesn't lose user state.
 */
class ReadStateRepo {
  private readIds = new Set<string>();

  isRead(id: string): boolean {
    return this.readIds.has(id);
  }

  markRead(id: string): void {
    if (!this.readIds.has(id)) {
      this.readIds.add(id);
      void Log("backend", "info", "repository", `marked notification ${id} as read`);
    }
  }

  markManyRead(ids: Iterable<string>): number {
    let count = 0;
    for (const id of ids) {
      if (!this.readIds.has(id)) {
        this.readIds.add(id);
        count += 1;
      }
    }
    if (count > 0) {
      void Log(
        "backend",
        "info",
        "repository",
        `bulk-marked ${count} notifications as read`
      );
    }
    return count;
  }

  unmarkRead(id: string): void {
    this.readIds.delete(id);
  }

  snapshotIds(): string[] {
    return [...this.readIds];
  }

  size(): number {
    return this.readIds.size;
  }
}

export const readStateRepo = new ReadStateRepo();
