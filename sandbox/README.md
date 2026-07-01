# Sandbox (Vercel preview)

Temporary **read-only preview** deployed to Vercel. Uses serverless Node API routes to read legacy SiteGround MySQL data.

This is **not** the production app. Production lives in `apps/portal/` (Laravel).

## Routes

| Path | File |
|------|------|
| `/` | `public/login.html` |
| `/app` | `public/app.html` |

## Local preview

```bash
npm install
npx vercel dev
```

Set env vars from `.env.example` in the project root.

## Auth

Login is validated server-side via `/api/auth-check` and middleware on all `/api/*` routes. Credentials are configured with `BASIC_AUTH_USER` and `BASIC_AUTH_PASSWORD` in Vercel.

The shared client module is `public/js/auth.js` — it validates tokens asynchronously before showing any page content (prevents redirect flicker).
