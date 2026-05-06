import {
  TYPE_WEIGHTS,
  type Notification,
  type NotificationType,
  type PriorityNotification,
} from "../domain/notification.js";

const HOUR = 60 * 60 * 1000;

// score = typeWeight*100 + max(0, 100 - hoursAgo)
// the *100 makes type strictly dominant, recency is the tiebreaker inside a type
export function computeScore(type: NotificationType, ts: string, now = Date.now()): number {
  const t = Date.parse(ts);
  const hoursAgo = Number.isFinite(t) ? Math.max(0, (now - t) / HOUR) : 100;
  const recency = Math.max(0, 100 - hoursAgo);
  return TYPE_WEIGHTS[type] * 100 + recency;
}

// size-n min-heap. root = smallest score in the current top-n.
// for each new item:
//   - if heap not full -> push
//   - else if newScore > root.score -> replace root, sift down
//   - else discard
// O(log n) per arrival, O(n) memory regardless of stream length.
export class TopNHeap {
  private heap: PriorityNotification[] = [];
  constructor(private readonly cap: number) {
    if (cap <= 0) throw new Error("cap must be > 0");
  }

  offer(entry: PriorityNotification): boolean {
    if (this.heap.length < this.cap) {
      this.heap.push(entry);
      this.up(this.heap.length - 1);
      return true;
    }
    const root = this.heap[0];
    if (root && entry.priority_score > root.priority_score) {
      this.heap[0] = entry;
      this.down(0);
      return true;
    }
    return false;
  }

  drainSorted(): PriorityNotification[] {
    return [...this.heap].sort((a, b) => b.priority_score - a.priority_score);
  }

  size(): number {
    return this.heap.length;
  }

  private up(i: number): void {
    while (i > 0) {
      const p = (i - 1) >> 1;
      const a = this.heap[i];
      const b = this.heap[p];
      if (!a || !b || a.priority_score >= b.priority_score) break;
      this.heap[i] = b;
      this.heap[p] = a;
      i = p;
    }
  }

  private down(i: number): void {
    const n = this.heap.length;
    while (true) {
      const l = i * 2 + 1;
      const r = i * 2 + 2;
      let s = i;
      const cur = this.heap[s];
      const lv = l < n ? this.heap[l] : undefined;
      const rv = r < n ? this.heap[r] : undefined;
      if (lv && cur && lv.priority_score < cur.priority_score) s = l;
      const best = this.heap[s];
      if (rv && best && rv.priority_score < best.priority_score) s = r;
      if (s === i) return;
      const a = this.heap[i];
      const b = this.heap[s];
      if (!a || !b) return;
      this.heap[i] = b;
      this.heap[s] = a;
      i = s;
    }
  }
}

export function topNPriority(
  notifications: Notification[],
  n: number,
  now = Date.now()
): PriorityNotification[] {
  const cap = Math.max(1, Math.min(n, notifications.length || n));
  const heap = new TopNHeap(cap);
  for (const item of notifications) {
    if (item.is_read) continue;
    const score = computeScore(item.type, item.timestamp, now);
    heap.offer({ ...item, priority_score: Math.round(score * 100) / 100 });
  }
  return heap.drainSorted();
}
