import { Log } from "logging-middleware";

// in-memory read state. brief says don't store notifications themselves,
// but we still need to know which ones the user has seen to render new vs
// already-viewed in the UI. FE also mirrors this in localStorage.
const readIds = new Set<string>();

export const readStateRepo = {
  isRead(id: string): boolean {
    return readIds.has(id);
  },

  markRead(id: string): void {
    if (!readIds.has(id)) {
      readIds.add(id);
      void Log("backend", "info", "repository", `marked ${id} read`);
    }
  },

  markManyRead(ids: Iterable<string>): number {
    let n = 0;
    for (const id of ids) {
      if (!readIds.has(id)) {
        readIds.add(id);
        n += 1;
      }
    }
    if (n > 0) void Log("backend", "info", "repository", `bulk-marked ${n} read`);
    return n;
  },

  size(): number {
    return readIds.size;
  },
};
