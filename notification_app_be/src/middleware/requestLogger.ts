import type { NextFunction, Request, Response } from "express";
import { Log } from "logging-middleware";

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - start;
    const level =
      res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";
    void Log(
      "backend",
      level,
      "middleware",
      `${req.method} ${req.originalUrl} -> ${res.statusCode} in ${ms}ms`
    );
  });
  next();
}
