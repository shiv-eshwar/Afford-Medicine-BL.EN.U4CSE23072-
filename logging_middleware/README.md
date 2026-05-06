# logging_middleware

Reusable logger that posts to `POST /evaluation-service/logs`. Used by both
the backend and the frontend so we never have to use `console.*`.

## Usage

```ts
import { Log } from "logging-middleware";

await Log("backend", "error", "handler", "received string, expected bool");
await Log("frontend", "info", "page", "priority inbox rendered");
```

`Log(stack, level, package, message)` returns the `{ logID, message }` body
on success or `null` on any failure (network down, 4xx, validation error).
We swallow errors on purpose: broken logging shouldn't break the app.

Allowed values:

- `stack`: `backend` | `frontend`
- `level`: `debug` | `info` | `warn` | `error` | `fatal`
- backend-only `package`: `cache`, `controller`, `cron_job`, `db`, `domain`,
  `handler`, `repository`, `route`, `service`
- frontend-only `package`: `api`, `component`, `hook`, `page`, `state`, `style`
- shared `package`: `auth`, `config`, `middleware`, `utils`

The logger validates the package against the stack so we can't accidentally
log with `db` from the frontend.

## Auth token

The logger sends `Authorization: Bearer <token>` if `LOG_AUTH_TOKEN` is set
in the environment, or you can call `setAuthToken()` from app code (used by
the backend's token manager so logs piggyback on the same auth flow).

## Build

```bash
npm install
npm run build   # ESM + CJS + d.ts in dist/
```
