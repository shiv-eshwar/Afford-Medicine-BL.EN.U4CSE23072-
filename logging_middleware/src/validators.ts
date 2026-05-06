const STACKS = new Set(["backend", "frontend"]);
const LEVELS = new Set(["debug", "info", "warn", "error", "fatal"]);

const BACKEND_ONLY = new Set([
  "cache",
  "controller",
  "cron_job",
  "db",
  "domain",
  "handler",
  "repository",
  "route",
  "service",
]);

const FRONTEND_ONLY = new Set([
  "api",
  "component",
  "hook",
  "page",
  "state",
  "style",
]);

const SHARED = new Set(["auth", "config", "middleware", "utils"]);

export function check(stack: string, level: string, pkg: string, message: string): boolean {
  if (!STACKS.has(stack)) return false;
  if (!LEVELS.has(level)) return false;

  const inShared = SHARED.has(pkg);
  const inBackend = BACKEND_ONLY.has(pkg);
  const inFrontend = FRONTEND_ONLY.has(pkg);

  if (!inShared && !inBackend && !inFrontend) return false;
  if (stack === "backend" && inFrontend) return false;
  if (stack === "frontend" && inBackend) return false;

  if (typeof message !== "string" || message.length === 0) return false;
  return true;
}
