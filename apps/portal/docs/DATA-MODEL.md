# Data model

Cleaner than the legacy single-table-with-two-flag-columns design. Core tables:

## `users`
Standard Laravel users plus profile fields. **Login is by `email` + hashed `password`** (the baseline that works for everyone, including external Next Level devs). `password` is nullable so an SSO-only account can exist without one; `oauth_provider`/`oauth_id` link an optional Microsoft 365 account.
`id, name, username (optional), email, password (nullable), oauth_provider (nullable), oauth_id (nullable), job_title, office, business_unit, phone, active, remember_token, timestamps`

## `roles` and `role_user`
`roles: id, name (requester|bu_leader|reviewer|it_helpdesk|admin), label`
`role_user: user_id, role_id` (many-to-many; a user can have several roles).

## `equipment_requests` (replaces legacy `submissions`)
Request facts + current position in the workflow.
`id, request_number, submitted_by_user_id (nullable), requester_email,
 request_type (replacement|new_equipment), equipment_type, reason, description,
 employee_first_name, employee_last_name, employee_job_title, employee_email,
 employee_phone, office, business_unit, cost_center, shipping_address, start_date,
 asset_tag, current_carrier, transfer_number, international_travel,
 submit_to_user_id, stage (submitted|bu_review|reviewer_review|approved|ordered|shipped|received|closed|denied|cancelled),
 timestamps`

## `approvals` (the decision chain — new)
One row per decision at each stage. Reconstructs the full approval history.
`id, equipment_request_id, stage (bu_leader|reviewer|final|fulfilment), actor_user_id,
 decision (pending|approved|denied), decided_at, notes, timestamps`

## `audit_logs` (accountability — new)
Append-only record of every meaningful action.
`id, auditable_type, auditable_id, actor_user_id, action, from_value, to_value, meta (json), ip_address, created_at`

## `request_notes` (replaces the legacy addnotes feature)
`id, equipment_request_id, user_id, body, timestamps`

---

## Legacy → new mapping (`submissions` → `equipment_requests`)
| Legacy column | New column | Notes |
|---|---|---|
| `id` | `id` / `request_number` | Keep numeric id; `request_number` can mirror it or become a formatted AFE #. |
| `sub_date` | `created_at` | |
| `req_type` | `request_type` | "Replacement"→`replacement`, "New Equipment"→`new_equipment`. |
| `equip_type` | `equipment_type` | |
| `requester` | `requester_email` | |
| `f_name` / `l_name` | `employee_first_name` / `employee_last_name` | |
| `job_title` | `employee_job_title` | |
| `email` | `employee_email` | |
| `phone_area` + `phone_num` | `employee_phone` | Concatenate. |
| `office` | `office` | |
| `bus_unit` | `business_unit` | |
| `cost_center` | `cost_center` | |
| `shipping_address` | `shipping_address` | |
| `start_date` | `start_date` | |
| `reason` | `reason` | |
| `description` | `description` | |
| `asset_tag` | `asset_tag` | |
| `cur_carrier` | `current_carrier` | |
| `trans_area`+`trans_num` | `transfer_number` | |
| `international` | `international_travel` | |
| `submit_to` | `submit_to_user_id` | Resolve email → user; keep email as fallback. |
| `status` (0–4) | first `approvals` row (stage=bu_leader) + `stage` | 0 pending,1 accepted,2 denied,3 more-info,4 cancelled. |
| `final_approval` (0–2) | `approvals` row (stage=final) + `stage` | 0 pending,1 approved,2 denied. |
| `manager_app_date` | `approvals.decided_at` (bu_leader) | |
| `final_app_date` | `approvals.decided_at` (final) | |
| `cirrus_status` | `stage` (ordered/shipped/received) + fulfilment approvals | |
| `notes` | seed a `request_notes` row | |
| `itunes_email`/`itunes_password` | drop | Apple section already removed from the form. |
| legacy `flags` table | fold into `audit_logs` | Was an ad-hoc approval-flag audit; superseded. |

Dropped legacy fields: `pol_rep`, `pol_rep_num`, `other_items`, `pref_carrier`, `user_is`, `pos_is` — carry over only if still needed; otherwise archive with the raw legacy dump.
