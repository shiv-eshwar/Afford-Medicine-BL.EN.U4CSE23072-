import type { NextFunction, Request, Response } from "express";
import { Log } from "logging-middleware";

export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = process.hrtime.bigint();
  res.on("finish", () => {
    const ms = Number(process.hrtime.bigint() - start) / 1_000_000;
    const level =
      res.statusCode >= 500
        ? "error"
        : res.statusCode >= 400
          ? "warn"
          : "info";
    void Log(
      "backend",
      level,
      "middleware",
      `${req.method} ${req.originalUrl} -> ${res.statusCode} in ${ms.toFixed(1)}ms`
    );
  });
  next();
}
