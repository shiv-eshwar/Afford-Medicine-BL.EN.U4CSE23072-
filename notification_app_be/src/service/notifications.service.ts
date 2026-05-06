import { Log } from "logging-middleware";
import { decorate, fetchUpstreamNotifications } from "./upstream.service.js";
import {
  TYPE_WEIGHTS,
  isType,
  type Notification,
  type NotificationType,
  type PriorityNotification,
} from "../domain/notification.js";
import { topNPriority } from "../utils/priority.js";
import { readStateRepo } from "../repository/notifications.repo.js";

export interface ListParams {
  limit?: number;
  page?: number;
  notificationType?: NotificationType;
  isRead?: boolean;
}

export interface ListResult {
  data: Notification[];
  meta: { page: number; limit: number; total: number };
}

export interface PriorityResult {
  data: PriorityNotification[];
  meta: { n: number; weights: Record<NotificationType, number> };
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function clamp(v: number | undefined, def: number, max: number): number {
  if (!Number.isFinite(v as number)) return def;
  const n = Math.floor(v as number);
  if (n < 1) return def;
  return Math.min(n, max);
}

export async function list(params: ListParams = {}): Promise<ListResult> {
  const limit = clamp(params.limit, DEFAULT_LIMIT, MAX_LIMIT);
  const page = clamp(params.page, 1, 1_000_000);
  const type =
    params.notificationType && isType(params.notificationType)
      ? params.notificationType
      : undefined;

  await Log(
    "backend",
    "info",
    "service",
    `list page=${page} limit=${limit} type=${type ?? "all"} is_read=${params.isRead ?? "any"}`
  );

  const upstream = await fetchUpstreamNotifications({ limit, page, notificationType: type });
  let items = decorate(upstream);

  if (typeof params.isRead === "boolean") {
    items = items.filter((n) => n.is_read === params.isRead);
  }

  return { data: items, meta: { page, limit, total: items.length } };
}

export async function priority(
  n = 10,
  notificationType?: NotificationType
): Promise<PriorityResult> {
  const cap = clamp(n, 10, 50);
  await Log(
    "backend",
    "info",
    "service",
    `priority n=${cap} type=${notificationType ?? "all"}`
  );

  const upstream = await fetchUpstreamNotifications({ notificationType });
  const items = decorate(upstream);
  const top = topNPriority(items, cap);

  return { data: top, meta: { n: cap, weights: TYPE_WEIGHTS } };
}

export function markRead(id: string) {
  readStateRepo.markRead(id);
  return { id, is_read: true as const };
}

export function markAllRead(ids: string[]) {
  return { count: readStateRepo.markManyRead(ids) };
}
