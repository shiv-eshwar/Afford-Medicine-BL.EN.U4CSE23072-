import type { LogResponse } from "./types";
import { check } from "./validators";

const env = (globalThis as { process?: { env?: Record<string, string | undefined> } })
  .process?.env ?? {};

const BASE_URL = env.LOG_BASE_URL || "http://20.207.122.201/evaluation-service";

let token: string | undefined = env.LOG_AUTH_TOKEN;

export function setAuthToken(t: string | undefined): void {
  token = t;
}

export async function Log(
  stack: string,
  level: string,
  pkg: string,
  message: string
): Promise<LogResponse | null> {
  const s = (stack || "").toLowerCase();
  const l = (level || "").toLowerCase();
  const p = (pkg || "").toLowerCase();

  if (!check(s, l, p, message)) return null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${BASE_URL}/logs`, {
      method: "POST",
      headers,
      body: JSON.stringify({ stack: s, level: l, package: p, message }),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as Partial<LogResponse>;
    if (typeof body?.logID === "string" && typeof body?.message === "string") {
      return { logID: body.logID, message: body.message };
    }
    return null;
  } catch {
    return null;
  }
}
