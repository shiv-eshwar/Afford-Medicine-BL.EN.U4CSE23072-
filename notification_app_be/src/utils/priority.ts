import {
  TYPE_WEIGHTS,
  type Notification,
  type NotificationType,
  type PriorityNotification,
} from "../domain/notification.js";

const HOUR_MS = 60 * 60 * 1000;

/**
 * Compute the priority score for a notification.
 *
 * Formula:
 *   score = typeWeight * 100 + recencyScore
 *   recencyScore = max(0, 100 - hoursSince(timestamp))
 *
 * The *100 multiplier guarantees type strictly dominates: a 4-day-old
 * Placement still beats a brand-new Event. Inside the same type, recency
 * is the tiebreaker.
 */
export function computeScore(
  type: NotificationType,
  timestamp: string,
  now: number = Date.now()
): number {
  const ts = Date.parse(timestamp);
  const hoursAgo = Number.isFinite(ts)
    ? Math.max(0, (now - ts) / HOUR_MS)
    : 100;
  const recencyScore = Math.max(0, 100 - hoursAgo);
  return TYPE_WEIGHTS[type] * 100 + recencyScore;
}

/**
 * Size-`n` min-heap keyed on priority score.
 *
 * The heap *root* is always the lowest-scoring member of the current top-n.
 * For each incoming notification, we either push it (heap not full),
 * replace the root (its score beats the current minimum), or discard it.
 *
 * Per-arrival cost: O(log n). Read top-n: O(n log n) sorted, O(n) unsorted.
 *
 * This is the canonical "k largest of a stream" pattern; memory is O(n)
 * regardless of how many notifications have ever flowed through.
 */
export class TopNHeap {
  private heap: PriorityNotification[] = [];

  constructor(private readonly capacity: number) {
    if (capacity <= 0) throw new Error("TopNHeap capacity must be > 0");
  }

  /** Returns true if `entry` was admitted into the heap. */
  offer(entry: PriorityNotification): boolean {
    if (this.heap.length < this.capacity) {
      this.heap.push(entry);
      this.siftUp(this.heap.length - 1);
      return true;
    }
    const root = this.heap[0];
    if (root && entry.priority_score > root.priority_score) {
      this.heap[0] = entry;
      this.siftDown(0);
      return true;
    }
    return false;
  }

  /** Returns the top-n in descending score order. */
  drainSorted(): PriorityNotification[] {
    return [...this.heap].sort((a, b) => b.priority_score - a.priority_score);
  }

  size(): number {
    return this.heap.length;
  }

  private siftUp(i: number): void {
    while (i > 0) {
      const parent = (i - 1) >> 1;
      const a = this.heap[i];
      const b = this.heap[parent];
      if (!a || !b) break;
      if (a.priority_score < b.priority_score) {
        this.heap[i] = b;
        this.heap[parent] = a;
        i = parent;
      } else {
        break;
      }
    }
  }

  private siftDown(i: number): void {
    const n = this.heap.length;
    while (true) {
      const l = i * 2 + 1;
      const r = i * 2 + 2;
      let smallest = i;
      const sCur = this.heap[smallest];
      const sL = l < n ? this.heap[l] : undefined;
      const sR = r < n ? this.heap[r] : undefined;
      if (sL && sCur && sL.priority_score < sCur.priority_score) smallest = l;
      const sBest = this.heap[smallest];
      if (sR && sBest && sR.priority_score < sBest.priority_score) smallest = r;
      if (smallest === i) return;
      const a = this.heap[i];
      const b = this.heap[smallest];
      if (!a || !b) return;
      this.heap[i] = b;
      this.heap[smallest] = a;
      i = smallest;
    }
  }
}

/**
 * Compute the top-n unread notifications by priority, given a flat list.
 * Streams the input through a size-n min-heap so the function works on
 * arbitrarily large batches without sorting the entire input.
 */
export function topNPriority(
  notifications: Notification[],
  n: number,
  now: number = Date.now()
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
