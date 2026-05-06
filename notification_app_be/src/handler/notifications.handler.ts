import type { NextFunction, Request, Response } from "express";
import { Log } from "logging-middleware";
import { list, markAllRead, markRead, priority } from "../service/notifications.service.js";
import { isType } from "../domain/notification.js";

function toInt(v: unknown): number | undefined {
  if (typeof v !== "string" || v.trim() === "") return undefined;
  const n = Number(v);
  if (!Number.isFinite(n)) return undefined;
  return Math.floor(n);
}

function toBool(v: unknown): boolean | undefined {
  if (v === "true") return true;
  if (v === "false") return false;
  return undefined;
}

export async function listNotifications(req: Request, res: Response, next: NextFunction) {
  try {
    const t = req.query.notification_type ?? req.query.type;
    const result = await list({
      limit: toInt(req.query.limit),
      page: toInt(req.query.page),
      notificationType: isType(t) ? t : undefined,
      isRead: toBool(req.query.is_read),
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function listPriority(req: Request, res: Response, next: NextFunction) {
  try {
    const t = req.query.notification_type ?? req.query.type;
    const result = await priority(toInt(req.query.n) ?? 10, isType(t) ? t : undefined);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export function markNotificationRead(req: Request, res: Response): void {
  const id = req.params.id;
  if (!id) {
    res.status(400).json({ error: { code: "BAD_REQUEST", message: "id required" } });
    return;
  }
  res.json(markRead(id));
}

export function markAllNotificationsRead(req: Request, res: Response): void {
  const body = req.body as { ids?: unknown };
  const ids = Array.isArray(body?.ids)
    ? body.ids.filter((x): x is string => typeof x === "string")
    : [];
  if (ids.length === 0) {
    void Log("backend", "warn", "handler", "mark-all-read called with empty ids");
  }
  res.json(markAllRead(ids));
}
