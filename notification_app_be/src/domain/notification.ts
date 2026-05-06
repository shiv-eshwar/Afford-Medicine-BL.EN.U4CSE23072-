export type NotificationType = "Event" | "Result" | "Placement";

export interface UpstreamNotification {
  ID: string;
  Type: NotificationType;
  Message: string;
  Timestamp: string;
}

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

export const TYPE_WEIGHTS: Record<NotificationType, number> = {
  Placement: 3,
  Result: 2,
  Event: 1,
};

export function isNotificationType(v: unknown): v is NotificationType {
  return v === "Event" || v === "Result" || v === "Placement";
}

export function fromUpstream(
  u: UpstreamNotification,
  is_read: boolean
): Notification {
  return {
    id: u.ID,
    type: u.Type,
    message: u.Message,
    timestamp: u.Timestamp,
    is_read,
  };
}
