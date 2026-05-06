# notification_app_fe

Next.js 14 + Material UI frontend.

## Pages

- `/` - all notifications, paginated, with type filter
- `/priority` - top-n unread, slider for n (10/15/20), type filter

Unread cards are bold with a coloured left border and a "New" chip. Read
cards fade out. Cards auto-mark-as-read when they sit in the viewport for
~800ms (IntersectionObserver). Read state is mirrored to localStorage so a
refresh keeps it.

Mobile uses a fixed bottom navigation, desktop uses tabs in the AppBar.

## Run

```bash
npm install
cp .env.local.example .env.local
npm run dev    # http://localhost:3000
```

Talks to the backend at `NEXT_PUBLIC_API_BASE` (default
`http://localhost:4000`). The browser never sees upstream credentials.

## Build

```bash
npm run build && npm start
```
