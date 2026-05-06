import { Log } from "logging-middleware";
import { config, type NotificationType } from "@/config";

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  timestamp: string;
  is_read: boolean;
}

export interface PriorityNotification extends Notification {
  priority_score: number;
}

export interface ListResult {
  data: Notification[];
  meta: { page: number; limit: number; total: number };
}

export interface PriorityResult {
  data: PriorityNotification[];
  meta: { n: number; weights: Record<NotificationType, number> };
}

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${config.apiBase}${path}`;
  void Log("frontend", "debug", "api", `${init?.method ?? "GET"} ${url}`);

  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
    });
  } catch (err) {
    void Log("frontend", "error", "api", `network error: ${(err as Error).message}`);
    throw new ApiError("network unreachable", 0);
  }

  if (!res.ok) {
    let body: { error?: { message?: string } } | null = null;
    try {
      body = await res.json();
    } catch {
      // non-json body
    }
    const message = body?.error?.message ?? `request failed (${res.status})`;
    void Log(
      "frontend",
      res.status >= 500 ? "error" : "warn",
      "api",
      `non-2xx ${res.status} for ${path}: ${message}`
    );
    throw new ApiError(message, res.status);
  }

  return (await res.json()) as T;
}

export interface ListQuery {
  limit?: number;
  page?: number;
  notificationType?: NotificationType;
  isRead?: boolean;
}

export async function fetchNotifications(q: ListQuery = {}): Promise<ListResult> {
  const s = new URLSearchParams();
  if (q.limit !== undefined) s.set("limit", String(q.limit));
  if (q.page !== undefined) s.set("page", String(q.page));
  if (q.notificationType) s.set("notification_type", q.notificationType);
  if (q.isRead !== undefined) s.set("is_read", String(q.isRead));
  const qs = s.toString();
  return request<ListResult>(`/api/notifications${qs ? `?${qs}` : ""}`);
}

export async function fetchPriority(
  n: number,
  notificationType?: NotificationType
): Promise<PriorityResult> {
  const s = new URLSearchParams({ n: String(n) });
  if (notificationType) s.set("notification_type", notificationType);
  return request<PriorityResult>(`/api/notifications/priority?${s.toString()}`);
}

export async function markRead(id: string): Promise<void> {
  await request(`/api/notifications/${encodeURIComponent(id)}/read`, { method: "POST" });
}

export async function markManyRead(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await request(`/api/notifications/read-all`, {
    method: "POST",
    body: JSON.stringify({ ids }),
  });
}
