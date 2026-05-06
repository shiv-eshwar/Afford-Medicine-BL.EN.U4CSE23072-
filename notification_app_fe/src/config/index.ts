export const config = {
  apiBase: process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000",
  evalBaseUrl:
    process.env.NEXT_PUBLIC_EVAL_BASE_URL || "http://20.207.122.201/evaluation-service",
};

export const NOTIFICATION_TYPES = ["Event", "Result", "Placement"] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const PRIORITY_N_OPTIONS = [10, 15, 20] as const;
