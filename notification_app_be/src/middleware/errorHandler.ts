import type { ErrorRequestHandler, NextFunction, Request, Response } from "express";
import { Log } from "logging-middleware";

interface HttpError extends Error {
  status?: number;
  code?: string;
}

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    error: { code: "NOT_FOUND", message: `route not found: ${req.method} ${req.path}` },
  });
};

export const errorHandler: ErrorRequestHandler = (
  err: HttpError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const status = err.status ?? 500;
  const code = err.code ?? (status >= 500 ? "INTERNAL_ERROR" : "BAD_REQUEST");
  const message = err.message ?? "unexpected server error";

  void Log(
    "backend",
    status >= 500 ? "error" : "warn",
    "middleware",
    `error in request pipeline: status=${status} code=${code} msg=${message}`
  );

  res.status(status).json({ error: { code, message } });
};
