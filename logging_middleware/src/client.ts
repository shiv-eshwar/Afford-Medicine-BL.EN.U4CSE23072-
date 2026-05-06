import type { LogResponse, LoggerConfig } from "./types";
import { validate } from "./validators";

const DEFAULT_BASE_URL = "http://20.207.122.201/evaluation-service";
const DEFAULT_TIMEOUT_MS = 5000;

let activeConfig: Required<
  Omit<LoggerConfig, "token" | "tokenProvider" | "fetchImpl">
> &
  Pick<LoggerConfig, "token" | "tokenProvider" | "fetchImpl"> = {
  baseUrl: DEFAULT_BASE_URL,
  timeoutMs: DEFAULT_TIMEOUT_MS,
  token: undefined,
  tokenProvider: undefined,
  fetchImpl: undefined,
};

export function configureLogger(config: LoggerConfig): void {
  activeConfig = {
    baseUrl: config.baseUrl ?? activeConfig.baseUrl,
    timeoutMs: config.timeoutMs ?? activeConfig.timeoutMs,
    token: config.token ?? activeConfig.token,
    tokenProvider: config.tokenProvider ?? activeConfig.tokenProvider,
    fetchImpl: config.fetchImpl ?? activeConfig.fetchImpl,
  };
}

async function resolveToken(): Promise<string | undefined> {
  if (activeConfig.token) return activeConfig.token;
  if (activeConfig.tokenProvider) {
    try {
      return await activeConfig.tokenProvider();
    } catch {
      return undefined;
    }
  }
  return undefined;
}

function pickFetch(): typeof fetch | undefined {
  if (activeConfig.fetchImpl) return activeConfig.fetchImpl;
  if (typeof fetch !== "undefined") return fetch;
  return undefined;
}

/**
 * Posts a single log entry to the upstream evaluation service.
 *
 * Returns the parsed `{ logID, message }` body on success, or `null` on any
 * failure (network error, non-2xx, validation error). Logging never throws —
 * a broken log pipeline must not break the calling application.
 */
export async function Log(
  stack: string,
  level: string,
  pkg: string,
  message: string
): Promise<LogResponse | null> {
  let payload;
  try {
    payload = validate(stack, level, pkg, message);
  } catch {
    return null;
  }

  const fetchImpl = pickFetch();
  if (!fetchImpl) return null;

  const token = await resolveToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (token) {
    headers["Authorization"] = token.startsWith("Bearer ")
      ? token
      : `Bearer ${token}`;
  }

  const controller =
    typeof AbortController !== "undefined" ? new AbortController() : undefined;
  const timer = controller
    ? setTimeout(() => controller.abort(), activeConfig.timeoutMs)
    : undefined;

  try {
    const res = await fetchImpl(`${activeConfig.baseUrl}/logs`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        stack: payload.stack,
        level: payload.level,
        package: payload.pkg,
        message: payload.message,
      }),
      signal: controller?.signal,
    });

    if (!res.ok) return null;
    const body = (await res.json()) as Partial<LogResponse>;
    if (typeof body?.logID === "string" && typeof body?.message === "string") {
      return { logID: body.logID, message: body.message };
    }
    return null;
  } catch {
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}
