# AFE System — Accounting Approval Removal & Reviewer Routing

**Requested by:** Megan McDaniel (via Neill) — June 2026
**Summary:** Removed the unconditional "Accounting" (CFO / Raul Moreira) final-approval gate and replaced it with routing based on the request's **Request Type** (`req_type`).

## New behavior

After a Business Unit Leader approves a request:

| Request Type | Meaning | What happens |
|---|---|---|
| **Replacement** | Repurposed equipment | BU approval is **final**. Auto-approved, Helpdesk order desk notified, **Megan McDaniel notified** (non-blocking). |
| **New Equipment** | Net-new equipment | **Megan + Stefan** notified to review. Helpdesk is **not** told until Megan gives final approval (existing approve link → `finalapprove.php`). |

The old Accounting/CFO email (to Raul Moreira / Patricio Garcia) no longer fires for any request.

## Files changed (all under `public_html/`)

**`updatestatus.php`** — the admin-dashboard status dropdown (the live approval path). Replaced the unconditional "email Raul for final approval" block with the `req_type` branch above. Replacement auto-sets `final_approval=1` and emails the order desk (`helpdesk@cirrus-systems.net`, `supportdesk@nextlevel-it.com`) + Megan; New Equipment emails Megan + Stefan (`swolf@nortonlilly.com`) the approve/decline links. Submitter still gets a status email. Also fixed the pre-existing bug where SMTP host/user/pass were set on the wrong `$mail1` object instead of the sending object.

**`submit/accept.php`** — the BU-Leader email "Accept" link. Now records BU approval (`status=1`) and branches the same way instead of always jumping straight to the Helpdesk. Replacement → auto full approval + order desk + Megan; New Equipment → notify Megan + Stefan, no Helpdesk yet.

**`submit/finalapprove.php`** — Megan's final approval for net-new. Recipient list aligned to the current order desk (`helpdesk@cirrus-systems.net` + `supportdesk@nextlevel-it.com`); removed stale `wregan@` / `jalidor@cirrus-systems.net` addresses.

**`accept1.php`** — the admin "Renotify" action. Repointed from Accounting (`pgarcia@nortonlilly.com`) to the reviewers Megan + Stefan; subject/heading updated.

**`home.php`** — admin table: "Renotify Accounting" menu item relabeled to "Renotify Reviewers"; "Accounting Status" column relabeled to "Final Approval".

**`submit/index.php`** — at submission time, **Replacement (repurposed)** requests now CC Megan McDaniel on the approver email so she sees them alongside the BU Leader for her validity review (before approval). Net-new requests are unaffected here (Megan + Stefan are notified when the BU Leader approves).

**`home.php` + new `updatefinalstatus.php`** (Megan's dashboard control) — the "Final Approval" column is now an editable dropdown (Pending / Approved / Denied), just like the "Edit Supervisor Status" dropdown. Megan can clear final approval directly from the dashboard (after checking with Stefan) instead of waiting on an email link. Setting it to **Approved** stamps the final-approval date and emails the Helpdesk order desk (and Comm Team for phones); the submitter also gets a status email.

## Not changed / left as dead endpoints
`submit/finaldecline.php` still works (Megan's deny path for net-new). No DB schema change was needed — `status` = BU decision, `final_approval` = final/reviewer decision, both reused as-is.

## Deploy
These edits are in the local working copy. Upload the changed files to SiteGround (`public_html/`) via SFTP/File Manager, overwriting the live versions. No database migration required.

## Test checklist (after deploy)
1. Submit a **Replacement** request → BU Leader approves → confirm Helpdesk + Megan get the "Ready for Order" email and status shows fully approved.
2. Submit a **New Equipment** request → BU Leader approves → confirm **Megan + Stefan** (not Helpdesk) get the "Needs Review" email; Helpdesk gets nothing yet.
3. As Megan, either click the approve link in that email **or** set the "Final Approval" dropdown to Approved on the dashboard → confirm Helpdesk now gets the order email and `final_approval` flips to approved.
4. Confirm **no** email goes to Raul Moreira / Patricio Garcia in any path.

## Notes / recommendations (not done)
- SMTP password, DB credentials, and admin passwords are hardcoded in these PHP files. If this system is kept rather than rebuilt, move them to a non-web-readable config include.
- For repurposed requests Megan is now CC'd at **submission time** (in `submit/index.php`) **and** notified again when it's approved/ordered (in `updatestatus.php` / `submit/accept.php`). If the second, order-confirmation email is unwanted noise, remove her `AddAddress` from the Replacement branch in those two files.
