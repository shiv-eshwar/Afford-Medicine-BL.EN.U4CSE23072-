# notification_app_be

Express + TypeScript backend that fronts the upstream evaluation service for the
campus notifications platform. Adds:

- Bearer-token lifecycle (auto-register on first run, auto-refresh on 401).
- 30 s read-through cache so repeated FE polls don't hammer upstream.
- Read-state tracking (in-memory) so the FE can distinguish new vs. viewed.
- Priority-inbox scoring + size-n min-heap for efficient top-n.
- Every meaningful step routed through `logging-middleware`.

## Endpoints

| Method | Path                              | Notes                                                  |
| ------ | --------------------------------- | ------------------------------------------------------ |
| GET    | `/healthz`                        | `{ ok: true, ts: ... }`                                |
| GET    | `/api/notifications`              | Query: `limit`, `page`, `notification_type`, `is_read` |
| GET    | `/api/notifications/priority`     | Query: `n` (1-50, default 10), `notification_type`     |
| POST   | `/api/notifications/:id/read`     | Marks one read                                          |
| POST   | `/api/notifications/read-all`     | Body `{ "ids": ["..."] }`; bulk mark                    |

All responses use the shape `{ data, meta }` for success or `{ error: { code, message } }` on failure.

## Folder map

| Folder         | Allowed `Log()` package |
| -------------- | ----------------------- |
| `auth/`        | `auth`                  |
| `cache/`       | `cache`                 |
| `config/`      | `config`                |
| `domain/`      | `domain`                |
| `handler/`     | `handler`               |
| `middleware/`  | `middleware`            |
| `repository/`  | `repository`            |
| `route/`       | `route`                 |
| `service/`     | `service`, `cache`      |
| `utils/`       | `utils`                 |

## Run

```bash
npm install              # also pulls in ../logging_middleware via file: link
cp .env.example .env     # fill in EMAIL, NAME, MOBILE_NO, GITHUB_USERNAME, ROLL_NO
npm run dev              # starts on :4000 with tsx watch
```

On first run, if `CLIENT_ID` / `CLIENT_SECRET` are not in `.env`, the service
calls upstream `/register` once and writes a local `.credentials.json`
(gitignored). Subsequent runs re-use that file.

## Build

```bash
npm run build && npm start
```
