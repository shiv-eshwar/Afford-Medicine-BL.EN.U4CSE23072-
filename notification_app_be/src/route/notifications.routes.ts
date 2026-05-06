import { Router } from "express";
import {
  listNotifications,
  listPriority,
  markAllNotificationsRead,
  markNotificationRead,
} from "../handler/notifications.handler.js";

export const notificationsRouter = Router();

notificationsRouter.get("/", listNotifications);
notificationsRouter.get("/priority", listPriority);
notificationsRouter.post("/:id/read", markNotificationRead);
notificationsRouter.post("/read-all", markAllNotificationsRead);
