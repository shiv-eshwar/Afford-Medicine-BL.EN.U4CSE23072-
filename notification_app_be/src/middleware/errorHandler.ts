import type { ErrorRequestHandler, Request, Response } from "express";
import { Log } from "logging-middleware";

interface HttpError extends Error {
  status?: number;
  code?: string;
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: { code: "NOT_FOUND", message: `route not found: ${req.method} ${req.path}` },
  });
}

export const errorHandler: ErrorRequestHandler = (err: HttpError, _req, res, _next) => {
  const status = err.status ?? 500;
  const code = err.code ?? (status >= 500 ? "INTERNAL_ERROR" : "BAD_REQUEST");
  const message = err.message ?? "unexpected server error";

  void Log(
    "backend",
    status >= 500 ? "error" : "warn",
    "middleware",
    `error status=${status} code=${code} msg=${message}`
  );

  res.status(status).json({ error: { code, message } });
};
