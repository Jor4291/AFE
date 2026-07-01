# Architecture

## Roles
| Role | Who | Can do |
|---|---|---|
| **Requester** | Any employee (or someone submitting on their behalf) | Create/submit a request, view their own requests and status timeline. |
| **BU Leader** | Denny Garner, Andreas Ebensperger, Stefan Wolf, etc. | Approve/deny requests submitted to them; add notes. |
| **Reviewer** | Megan McDaniel (and Stefan for net-new) | Review requests after BU approval, give final approval or deny, add notes. Sees the whole queue. |
| **IT / Helpdesk** | Cirrus / Next Level IT | See fully-approved requests, update fulfilment status (Ordered → Shipped → Received). |
| **Admin** | System owners | Manage users/roles, all of the above, view audit log. |

Roles are assigned per user. A user can hold more than one role (e.g. Stefan is both a BU Leader and a net-new Reviewer).

## Approval workflow (v1 = current behavior, made explicit)
```
Requester submits
        │
        ▼
  BU Leader review ──deny──► Denied (requester notified)
        │ approve
        ▼
  Is it net-new? ──────────────► No (Replacement / repurposed)
        │ Yes                         │  Reviewer (Megan) notified — non-blocking
        ▼                             ▼
  Reviewer review          Final approved → Helpdesk notified to order
  (Megan + Stefan) ─deny─► Denied            │
        │ approve                            ▼
        ▼                            Ordered → Shipped → Received → Closed
  Final approved → Helpdesk notified to order → (same fulfilment track)
```
- **Replacement** = repurposed equipment: BU-Leader approval is final; Megan is notified but doesn't block.
- **New Equipment** = net-new: after BU approval, Megan + Stefan review; Helpdesk isn't told until final approval.
- The legacy "Accounting/CFO" stage (Raul Moreira) is **removed** — this rebuild never reintroduces it.

Each state transition writes an **audit_log** row (who, what, when, from→to). Every decision also writes an **approvals** row so the full chain is reconstructable.

## Notifications
Laravel Mailables over the existing SMTP2GO account. One template per event (submitted, needs-BU-approval, needs-review, approved/ready-to-order, denied, status-update) instead of the copy-pasted HTML blocks in the legacy app. Recipients are resolved from roles/users, not hardcoded addresses.

## Authentication
Two ways in, one account model. **Email + password is the baseline and always available** — it works for external Next Level developers, contractors, and anyone without a Microsoft 365 account. Microsoft 365 SSO is an optional convenience layer on top for `@nortonlilly.com` staff.

- **Email/password (baseline):** Laravel Breeze/Fortify. Bcrypt hashes, login throttling, "remember me", self-service password reset, and admin-initiated invites/resets. Every user can use this.
- **Microsoft 365 SSO (optional):** Laravel Socialite with the Azure provider. On first SSO login the app matches the Microsoft email to an existing user (or provisions one) and stores `oauth_provider='azure'` + `oauth_id`. SSO users can also be given a password so they can fall back to email/password if SSO is ever unavailable.
- **One identity either way:** both methods resolve to the same `users` row and the same roles, so audit logs and permissions don't care how you signed in.
- **Provisioning:** Admins create accounts and assign roles. External devs get email/password accounts; they never need M365.

## Security (the point of the rebuild)
- Per-user accounts, bcrypt-hashed passwords, login throttling, password reset.
- Role/permission checks on every route and action (Laravel policies/gates).
- All DB access via Eloquent/parameter binding — no string-concatenated SQL.
- Secrets (DB, SMTP) in `.env`, never in source; `.env` outside the web root.
- Remove `phpinfo.php`, backup archives, and any world-readable secrets from the deploy.
- CSRF protection on all forms (Laravel default); signed URLs for any email action links.
- Full audit trail for accountability.

## Deploy (SiteGround)
Laravel runs on SiteGround (PHP 8.x + MySQL, Composer available via SSH/Site Tools).
1. Point the domain/subdomain document root at `public/`.
2. `composer install --no-dev`, set `.env`, `php artisan key:generate`, `php artisan migrate --seed`.
3. `php artisan config:cache route:cache view:cache`.
4. Run the legacy→new data migration script (see DATA-MODEL.md), verify, then cut over DNS.
Run old and new in parallel during verification; the new app can read a copy of the legacy data first.
