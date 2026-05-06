import type { NextFunction, Request, Response } from "express";
import { Log } from "logging-middleware";
import {
  list,
  markAllRead,
  markRead,
  priority,
} from "../service/notifications.service.js";
import { isNotificationType } from "../domain/notification.js";

function parseInt32(v: unknown): number | undefined {
  if (typeof v !== "string" || v.trim() === "") return undefined;
  const n = Number(v);
  if (!Number.isFinite(n)) return undefined;
  return Math.floor(n);
}

function parseBool(v: unknown): boolean | undefined {
  if (v === "true") return true;
  if (v === "false") return false;
  return undefined;
}

export async function listNotifications(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const type = req.query.notification_type ?? req.query.type;
    const result = await list({
      limit: parseInt32(req.query.limit),
      page: parseInt32(req.query.page),
      notificationType: isNotificationType(type) ? type : undefined,
      isRead: parseBool(req.query.is_read),
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function listPriority(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const type = req.query.notification_type ?? req.query.type;
    const result = await priority(
      parseInt32(req.query.n) ?? 10,
      isNotificationType(type) ? type : undefined
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export function markNotificationRead(req: Request, res: Response): void {
  const id = req.params.id;
  if (!id || typeof id !== "string") {
    res.status(400).json({
      error: { code: "BAD_REQUEST", message: "id path param required" },
    });
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
    void Log(
      "backend",
      "warn",
      "handler",
      "mark-all-read called with empty ids array"
    );
  }
  res.json(markAllRead(ids));
}
