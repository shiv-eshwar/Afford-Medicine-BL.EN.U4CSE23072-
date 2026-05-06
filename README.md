# Campus Notifications

Full-stack project for the campus notifications platform. Four pieces:

- `logging_middleware/` - reusable logger used by BE + FE
- `notification_app_be/` - Express + TS backend (proxies the upstream API)
- `notification_app_fe/` - Next.js + MUI frontend on `localhost:3000`
- `notification_system_design.md` - design notes (Stages 1-6)

## Run

```bash
# build the logger first (BE + FE link to it via file:)
cd logging_middleware && npm install && npm run build && cd ..

# backend on :4000
cd notification_app_be
cp .env.example .env  # fill in EMAIL, NAME, MOBILE_NO, GITHUB_USERNAME, ROLL_NO
npm install && npm run dev

# in another shell, frontend on :3000
cd notification_app_fe
cp .env.local.example .env.local
npm install && npm run dev
```

Then http://localhost:3000 (all notifications) and http://localhost:3000/priority (priority inbox).
