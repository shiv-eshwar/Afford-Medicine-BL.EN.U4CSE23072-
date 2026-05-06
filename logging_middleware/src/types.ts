export type Stack = "backend" | "frontend";

export type Level = "debug" | "info" | "warn" | "error" | "fatal";

export type BackendOnlyPackage =
  | "cache"
  | "controller"
  | "cron_job"
  | "db"
  | "domain"
  | "handler"
  | "repository"
  | "route"
  | "service";

export type FrontendOnlyPackage =
  | "api"
  | "component"
  | "hook"
  | "page"
  | "state"
  | "style";

export type SharedPackage = "auth" | "config" | "middleware" | "utils";

export type Package = BackendOnlyPackage | FrontendOnlyPackage | SharedPackage;

export interface LogResponse {
  logID: string;
  message: string;
}

export interface LoggerConfig {
  baseUrl?: string;
  token?: string;
  tokenProvider?: () => string | Promise<string>;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}
