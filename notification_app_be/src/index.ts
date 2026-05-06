import express from "express";
import cors from "cors";
import { Log } from "logging-middleware";
import { config } from "./config/index.js";
import { getAccessToken } from "./auth/upstreamAuth.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { notificationsRouter } from "./route/notifications.routes.js";

const app = express();

app.use(express.json({ limit: "256kb" }));
app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true);
      const ok =
        config.allowedOrigins.includes("*") || config.allowedOrigins.includes(origin);
      cb(ok ? null : new Error(`origin not allowed: ${origin}`), ok);
    },
  })
);
app.use(requestLogger);

app.get("/healthz", (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

app.use("/api/notifications", notificationsRouter);

app.use(notFoundHandler);
app.use(errorHandler);

async function start() {
  await Log(
    "backend",
    "info",
    "config",
    `starting backend on port ${config.port} (${config.nodeEnv})`
  );
  try {
    await getAccessToken();
    await Log("backend", "info", "auth", "warmed access token at startup");
  } catch (err) {
    await Log(
      "backend",
      "error",
      "auth",
      `could not warm token: ${(err as Error).message}`
    );
  }

  app.listen(config.port, () => {
    void Log("backend", "info", "config", `ready at http://localhost:${config.port}`);
  });
}

start().catch(async (err) => {
  await Log("backend", "fatal", "config", `bootstrap failed: ${(err as Error).message}`);
  process.exit(1);
});
