# logging_middleware

A reusable, dependency-free TypeScript logger that posts structured entries to
the upstream evaluation service's `POST /evaluation-service/logs` endpoint.

It is consumed by both the backend and frontend so that all observability flows
through a single contract — no inbuilt loggers, no `console.*`.

## Public API

```ts
import { Log, configureLogger } from "logging-middleware";

configureLogger({
  baseUrl: "http://20.207.122.201/evaluation-service",
  tokenProvider: async () => getCurrentBearerToken(),
});

await Log("backend", "error", "handler", "received string, expected bool");
await Log("frontend", "info", "page", "priority inbox rendered with n=10");
```

## Function signature

```ts
Log(
  stack: "backend" | "frontend",
  level: "debug" | "info" | "warn" | "error" | "fatal",
  pkg: BackendOnlyPackage | FrontendOnlyPackage | SharedPackage,
  message: string
): Promise<{ logID: string; message: string } | null>
```

| Stack    | Allowed packages                                                                                                          |
| -------- | ------------------------------------------------------------------------------------------------------------------------- |
| backend  | `cache`, `controller`, `cron_job`, `db`, `domain`, `handler`, `repository`, `route`, `service`, `auth`, `config`, `middleware`, `utils` |
| frontend | `api`, `component`, `hook`, `page`, `state`, `style`, `auth`, `config`, `middleware`, `utils`                              |

## Behaviour

- Validates `stack` / `level` / `package` and rejects mismatches (e.g. logging with package `db` from a frontend stack).
- All values are forced to lowercase before being sent.
- `Authorization: Bearer <token>` automatically prepended if `token` or `tokenProvider` is configured.
- Network and parsing failures are swallowed and return `null` — logging never breaks the caller.
- Pure `fetch`; runs in Node 18+ and modern browsers without polyfills.

## Build

```bash
npm install
npm run build   # emits dist/index.js (ESM), dist/index.cjs (CJS), dist/index.d.ts
```
