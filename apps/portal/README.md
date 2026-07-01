# AFE Portal — Production app (Laravel)

Ground-up replacement for the legacy PHP portal at `afe.cirruscom.net`.

## Stack

- **PHP 8.2+** / **Laravel 11+**
- **MySQL** (SiteGround — legacy `submissions` table today, new schema in `database/migrations/`)
- **Blade + Tailwind** (UI reference: `../../sandbox/public/app.html`)
- **Laravel Breeze/Fortify** for auth; optional Microsoft 365 SSO later

## Install (first time)

Requires [Composer](https://getcomposer.org/) and PHP 8.2+:

```bash
cd apps/portal
composer create-project laravel/laravel tmp && robocopy tmp . /E & rmdir /S /Q tmp
# migrations/ and seeders/ are already here — merge into database/
php artisan migrate --seed
php artisan serve
```

On macOS/Linux use `mv tmp/* tmp/.[!.]* .` instead of robocopy.

## What's here now

```
apps/portal/
  README.md
  docs/           ARCHITECTURE.md, DATA-MODEL.md
  database/
    migrations/   New schema (equipment_requests, approvals, audit_logs, …)
    seeders/      Roles + admin user
  app/            Laravel app code (after composer install)
  routes/         Web + API routes (after composer install)
  resources/views Blade templates (after composer install)
```

## Deploy target

**Production:** SiteGround (PHP + MySQL), document root `public/`.

**Preview:** Vercel sandbox at repo root (`sandbox/`) — read-only legacy data for stakeholders.

## Next build steps

1. `composer create-project` into this directory
2. Copy migrations/seeders into Laravel `database/`
3. Implement auth (Breeze) + role middleware
4. Dashboard + request detail (port UI from sandbox)
5. Request wizard + approval workflow
6. Legacy → new data migration script
7. Cutover DNS from legacy `public_html/`

See `docs/ARCHITECTURE.md` for roles, workflow, and security requirements.
