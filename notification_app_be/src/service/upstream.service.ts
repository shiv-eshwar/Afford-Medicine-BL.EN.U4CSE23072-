import { Log } from "logging-middleware";
import { config } from "../config/index.js";
import { cacheGet, cacheSet } from "../cache/lru.js";
import {
  fromUpstream,
  type Notification,
  type NotificationType,
  type UpstreamNotification,
} from "../domain/notification.js";
import { readStateRepo } from "../repository/notifications.repo.js";
import { getAccessToken, invalidateToken } from "../auth/upstreamAuth.js";

interface UpstreamResponse {
  notifications: UpstreamNotification[];
}

export interface UpstreamQuery {
  limit?: number;
  page?: number;
  notificationType?: NotificationType;
}

function key(q: UpstreamQuery): string {
  return [q.limit ?? "", q.page ?? "", q.notificationType ?? ""].join("|");
}

function buildUrl(q: UpstreamQuery): string {
  const url = new URL(`${config.evalBaseUrl}/notifications`);
  if (q.limit !== undefined) url.searchParams.set("limit", String(q.limit));
  if (q.page !== undefined) url.searchParams.set("page", String(q.page));
  if (q.notificationType) url.searchParams.set("notification_type", q.notificationType);
  return url.toString();
}

async function callOnce(url: string, token: string) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  let body: UpstreamResponse | null = null;
  if (res.ok) body = (await res.json()) as UpstreamResponse;
  return { status: res.status, body };
}

export async function fetchUpstreamNotifications(
  q: UpstreamQuery = {}
): Promise<UpstreamNotification[]> {
  const k = key(q);
  const hit = cacheGet<UpstreamNotification[]>(k);
  if (hit) {
    await Log("backend", "debug", "cache", `cache hit for "${k}"`);
    return hit;
  }

  const url = buildUrl(q);
  await Log("backend", "info", "service", `fetching: ${url}`);

  let token = await getAccessToken();
  let { status, body } = await callOnce(url, token);

  if (status === 401 || status === 403) {
    await Log("backend", "warn", "service", `${status} from upstream, refreshing token`);
    invalidateToken();
    token = await getAccessToken(true);
    ({ status, body } = await callOnce(url, token));
  }

  if (!body) {
    await Log("backend", "error", "service", `upstream fetch failed status=${status}`);
    throw Object.assign(new Error("upstream fetch failed"), { status: 502 });
  }

  const list = Array.isArray(body.notifications) ? body.notifications : [];
  cacheSet(k, list);
  await Log("backend", "info", "service", `fetched ${list.length} notifications`);
  return list;
}

export function decorate(items: UpstreamNotification[]): Notification[] {
  return items.map((n) => fromUpstream(n, readStateRepo.isRead(n.ID)));
}
