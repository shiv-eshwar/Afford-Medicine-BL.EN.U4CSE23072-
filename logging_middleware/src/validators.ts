import type {
  BackendOnlyPackage,
  FrontendOnlyPackage,
  Level,
  Package,
  SharedPackage,
  Stack,
} from "./types";

const STACKS: ReadonlySet<Stack> = new Set(["backend", "frontend"]);

const LEVELS: ReadonlySet<Level> = new Set([
  "debug",
  "info",
  "warn",
  "error",
  "fatal",
]);

const BACKEND_ONLY: ReadonlySet<BackendOnlyPackage> = new Set([
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

const FRONTEND_ONLY: ReadonlySet<FrontendOnlyPackage> = new Set([
  "api",
  "component",
  "hook",
  "page",
  "state",
  "style",
]);

const SHARED: ReadonlySet<SharedPackage> = new Set([
  "auth",
  "config",
  "middleware",
  "utils",
]);

export class LogValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LogValidationError";
  }
}

export function validate(
  stack: string,
  level: string,
  pkg: string,
  message: string
): { stack: Stack; level: Level; pkg: Package; message: string } {
  const s = stack?.toLowerCase?.() as Stack;
  const l = level?.toLowerCase?.() as Level;
  const p = pkg?.toLowerCase?.() as Package;

  if (!STACKS.has(s)) {
    throw new LogValidationError(
      `Invalid stack "${stack}". Allowed: backend | frontend`
    );
  }
  if (!LEVELS.has(l)) {
    throw new LogValidationError(
      `Invalid level "${level}". Allowed: debug | info | warn | error | fatal`
    );
  }

  const isShared = SHARED.has(p as SharedPackage);
  const isBackendOnly = BACKEND_ONLY.has(p as BackendOnlyPackage);
  const isFrontendOnly = FRONTEND_ONLY.has(p as FrontendOnlyPackage);

  if (!isShared && !isBackendOnly && !isFrontendOnly) {
    throw new LogValidationError(`Unknown package "${pkg}".`);
  }

  if (s === "backend" && isFrontendOnly) {
    throw new LogValidationError(
      `Package "${pkg}" is not allowed in stack "backend"`
    );
  }
  if (s === "frontend" && isBackendOnly) {
    throw new LogValidationError(
      `Package "${pkg}" is not allowed in stack "frontend"`
    );
  }

  if (typeof message !== "string" || message.length === 0) {
    throw new LogValidationError("Log message must be a non-empty string");
  }

  return { stack: s, level: l, pkg: p, message };
}
