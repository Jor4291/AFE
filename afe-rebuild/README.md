# AFE Rebuild — IT Equipment Request Portal (v2)

A ground-up rebuild of the Norton Lilly IT Equipment Request ("AFE") portal, replacing the legacy PHP app at `afe.cirruscom.net`.

> Location note: this folder currently lives inside the legacy site folder for convenience. Move it to its own Git repository when you're ready.

## Why rebuild
The legacy app works but has hard limits: two shared admin passwords (no per-user identity or audit trail), SQL-injectable admin scripts, hardcoded credentials in source, and a JotForm-derived request form that's difficult to maintain. See `../CHANGES_accounting-removal.md` for the most recent workflow change carried into this rebuild.

## Stack
- **Backend:** Laravel (PHP 8.2+), MySQL — stays compatible with current SiteGround-style hosting and reuses the existing database.
- **Frontend:** Blade + Tailwind CSS (option to add Livewire/Alpine for interactivity). See `prototype/index.html` for the target UI/UX.
- **Auth:** Per-user accounts (username/password) with roles and hashed passwords (bcrypt). Full audit trail of every action.
- **Email:** Laravel Mail over the existing SMTP2GO account (replaces the copy-pasted PHPMailer blocks).

## v1 scope (parity + auth & audit)
1. Everything the current system does — request intake, BU-Leader approval, the new Replacement/New-Equipment routing (Megan notified on repurposed; Megan + Stefan review net-new), Helpdesk order notification, and status tracking (Ordered → Shipped → Received).
2. Real per-user accounts with roles: **Requester, BU Leader, Reviewer, IT/Helpdesk, Admin**.
3. An audit log recording who did what and when (the thing shared logins can't give today).
4. Data migrated from the legacy `submissions` / `flags` tables.

## Repo layout
```
afe-rebuild/
  README.md                 # this file
  docs/
    ARCHITECTURE.md         # roles, workflow, security, deploy
    DATA-MODEL.md           # new schema + legacy mapping
  database/
    migrations/             # Laravel migrations (new schema)
    seeders/                # roles + first admin user
  prototype/
    index.html              # static UI/UX design reference
    demo.html               # interactive "smoke & mirrors" demo — working flows, no server
```

## Try the demo
Open `prototype/demo.html` in any browser (double-click — no install, no server). Data is faked in your browser (localStorage); use **Reset demo data** in the top banner to start over. Suggested smoke test:
1. Sign in (any email/password) → land on the dashboard.
2. Click **+ New request**, choose **New equipment**, complete the wizard, submit → it appears in **BU review**.
3. Switch **Viewing as → BU Leader**, open the request, **Approve** → it moves to **Needs review** (net-new routing).
4. Switch to **Reviewer (Megan)**, **Approve → notify Helpdesk** → it becomes **Approved**.
5. Switch to **IT / Helpdesk** → mark **Ordered → Shipped → Received**.
6. Try a **Replacement** request instead — BU approval sends it straight to Approved (no reviewer step), matching the live routing.

## Getting started (once Laravel is installed)
```bash
composer create-project laravel/laravel .   # into this folder
# copy the migrations/ and seeders/ here into database/
php artisan migrate --seed
php artisan serve
```

## Status
Kickoff. Foundational docs, data model, and UI prototype are in place. Next: stand up the Laravel app and wire the request wizard + dashboard to the schema.
