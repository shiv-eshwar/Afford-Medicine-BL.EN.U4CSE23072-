export type Stack = "backend" | "frontend";

export type Level = "debug" | "info" | "warn" | "error" | "fatal";

export type BackendPkg =
  | "cache"
  | "controller"
  | "cron_job"
  | "db"
  | "domain"
  | "handler"
  | "repository"
  | "route"
  | "service";

export type FrontendPkg =
  | "api"
  | "component"
  | "hook"
  | "page"
  | "state"
  | "style";

export type SharedPkg = "auth" | "config" | "middleware" | "utils";

export type Pkg = BackendPkg | FrontendPkg | SharedPkg;

export interface LogResponse {
  logID: string;
  message: string;
}
