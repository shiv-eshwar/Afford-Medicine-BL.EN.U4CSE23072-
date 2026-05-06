import { Log } from "logging-middleware";
import {
  decorateWithReadState,
  fetchUpstreamNotifications,
  fetchAllUpstreamNotifications,
} from "./upstream.service.js";
import {
  TYPE_WEIGHTS,
  isNotificationType,
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
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface PriorityResult {
  data: PriorityNotification[];
  meta: {
    n: number;
    weights: Record<NotificationType, number>;
  };
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function clamp(value: number | undefined, def: number, max: number): number {
  if (!Number.isFinite(value as number)) return def;
  const v = Math.floor(value as number);
  if (v < 1) return def;
  return Math.min(v, max);
}

export async function list(params: ListParams = {}): Promise<ListResult> {
  const limit = clamp(params.limit, DEFAULT_LIMIT, MAX_LIMIT);
  const page = clamp(params.page, 1, 1_000_000);
  const notificationType =
    params.notificationType && isNotificationType(params.notificationType)
      ? params.notificationType
      : undefined;

  await Log(
    "backend",
    "info",
    "service",
    `list request: page=${page} limit=${limit} type=${notificationType ?? "all"} is_read=${params.isRead ?? "any"}`
  );

  const upstream = await fetchUpstreamNotifications({
    limit,
    page,
    notificationType,
  });

  let decorated = decorateWithReadState(upstream);

  if (typeof params.isRead === "boolean") {
    decorated = decorated.filter((n) => n.is_read === params.isRead);
  }

  return {
    data: decorated,
    meta: {
      page,
      limit,
      total: decorated.length,
    },
  };
}

export async function priority(
  n: number = 10,
  notificationType?: NotificationType
): Promise<PriorityResult> {
  const cap = clamp(n, 10, 50);
  await Log(
    "backend",
    "info",
    "service",
    `priority request: n=${cap} type=${notificationType ?? "all"}`
  );

  const upstream = await fetchAllUpstreamNotifications(notificationType);
  const decorated = decorateWithReadState(upstream);
  const top = topNPriority(decorated, cap);

  return {
    data: top,
    meta: {
      n: cap,
      weights: TYPE_WEIGHTS,
    },
  };
}

export function markRead(id: string): { id: string; is_read: true } {
  readStateRepo.markRead(id);
  return { id, is_read: true };
}

export function markAllRead(ids: string[]): { count: number } {
  const count = readStateRepo.markManyRead(ids);
  return { count };
}
