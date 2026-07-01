# AFE Portal (IT Equipment Request)

Monorepo for replacing the legacy Norton Lilly AFE portal.

## Structure

```
/
  apps/portal/          Production Laravel app (target: SiteGround)
  sandbox/              Vercel read-only preview (legacy DB)
  api/                  Vercel serverless routes (sandbox only)
  lib/                  Shared DB mapping for sandbox API
  middleware.js         API auth for sandbox
  legacy/               (gitignored) old public_html reference
```

## Environments

| Environment | Host | Code |
|-------------|------|------|
| **Preview** | Vercel (`*.vercel.app`) | `sandbox/public` + `api/` |
| **Production** | SiteGround | `apps/portal/` (Laravel) |
| **Legacy** | afe.cirruscom.net | `legacy/public_html/` (gitignored) |

## Quick start — preview (Vercel)

1. Set Vercel env vars (see `.env.example`)
2. Deploy from `main`
3. Open `/` → sign in → `/app` dashboard

## Quick start — production (local)

See [apps/portal/README.md](apps/portal/README.md).

## Documentation

- [Architecture & workflow](apps/portal/docs/ARCHITECTURE.md)
- [Data model](apps/portal/docs/DATA-MODEL.md)
- [Accounting removal changes](CHANGES_accounting-removal.md)
