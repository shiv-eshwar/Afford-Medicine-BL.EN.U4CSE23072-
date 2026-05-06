# notification_app_be

Express + TypeScript backend that fronts the upstream notifications service.

## What it does

- handles auth against the upstream (`/register` once, `/auth` per token,
  refresh on 401)
- proxies `GET /notifications` with `limit`, `page`, `notification_type`
- adds a priority endpoint with the min-heap top-n scoring
- tracks read state in memory so the FE can show new vs. viewed
- 30s read-through cache so FE polls don't hammer upstream

## Endpoints

```
GET  /healthz
GET  /api/notifications?limit=&page=&notification_type=&is_read=
GET  /api/notifications/priority?n=&notification_type=
POST /api/notifications/:id/read
POST /api/notifications/read-all     body: { ids: [...] }
```

## Run

```bash
npm install
cp .env.example .env   # fill in EMAIL, NAME, MOBILE_NO, GITHUB_USERNAME, ROLL_NO
npm run dev            # :4000 with tsx watch
```

If `CLIENT_ID` / `CLIENT_SECRET` aren't set, the service calls `/register`
once and writes the result to `.credentials.json` (gitignored). Subsequent
runs reuse it.

## Build

```bash
npm run build && npm start
```
