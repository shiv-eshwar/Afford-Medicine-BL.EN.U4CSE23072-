import { Log } from "logging-middleware";
import { config } from "../config/index.js";
import { TtlCache } from "../cache/lru.js";
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

const CACHE_TTL_MS = 30_000;
const cache = new TtlCache<string, UpstreamNotification[]>(CACHE_TTL_MS, 64);

function buildKey(q: UpstreamQuery): string {
  return [q.limit ?? "", q.page ?? "", q.notificationType ?? ""].join("|");
}

function buildUrl(q: UpstreamQuery): string {
  const url = new URL(`${config.evalBaseUrl}/notifications`);
  if (q.limit !== undefined) url.searchParams.set("limit", String(q.limit));
  if (q.page !== undefined) url.searchParams.set("page", String(q.page));
  if (q.notificationType)
    url.searchParams.set("notification_type", q.notificationType);
  return url.toString();
}

async function fetchOnce(
  url: string,
  token: string
): Promise<{ status: number; body: UpstreamResponse | null }> {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });
  let body: UpstreamResponse | null = null;
  if (res.ok) {
    body = (await res.json()) as UpstreamResponse;
  }
  return { status: res.status, body };
}

export async function fetchUpstreamNotifications(
  q: UpstreamQuery = {}
): Promise<UpstreamNotification[]> {
  const cacheKey = buildKey(q);
  const cached = cache.get(cacheKey);
  if (cached) {
    await Log(
      "backend",
      "debug",
      "cache",
      `cache hit for notifications query "${cacheKey}"`
    );
    return cached;
  }

  const url = buildUrl(q);
  await Log(
    "backend",
    "info",
    "service",
    `fetching upstream notifications: ${url}`
  );

  let token = await getAccessToken();
  let { status, body } = await fetchOnce(url, token);

  if (status === 401 || status === 403) {
    await Log(
      "backend",
      "warn",
      "service",
      "upstream returned 401/403; refreshing token and retrying"
    );
    invalidateToken();
    token = await getAccessToken(true);
    ({ status, body } = await fetchOnce(url, token));
  }

  if (!body) {
    await Log(
      "backend",
      "error",
      "service",
      `upstream notifications fetch failed: status=${status}`
    );
    throw Object.assign(new Error("upstream notifications fetch failed"), {
      status: 502,
    });
  }

  const list = Array.isArray(body.notifications) ? body.notifications : [];
  cache.set(cacheKey, list);
  await Log(
    "backend",
    "info",
    "service",
    `fetched ${list.length} notifications from upstream`
  );
  return list;
}

export async function fetchAllUpstreamNotifications(
  notificationType?: NotificationType
): Promise<UpstreamNotification[]> {
  return fetchUpstreamNotifications({ notificationType });
}

export function decorateWithReadState(
  upstream: UpstreamNotification[]
): Notification[] {
  return upstream.map((n) => fromUpstream(n, readStateRepo.isRead(n.ID)));
}
