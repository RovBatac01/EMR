# Test Results — KLD School EMR 1.2.0

## Scope

This report covers the incremental 1.2.0 upgrade applied to the uploaded KLD School EMR 1.1.0 source. The release retains the React/Vite frontend, Express/MySQL backend, authentication, roles, medical records, SMTP configuration model, and existing v1.1 modules while adding the requested public-site, policy-acceptance, archive, reporting, backup, and reliability work.

The automated checks below validate source structure and implementation contracts. They do not replace execution against the user's actual Windows/XAMPP database and SMTP environment.

## Automated results completed in the build environment

| Check | Result |
|---|---|
| Clean-package static architecture, security, route, migration, and feature contracts | PASS — 246 checks |
| Backend and build-script JavaScript syntax | PASS — 49 files |
| Node unit/security/upgrade contract tests | PASS — 20 of 20 |
| JavaScript/JSX AST parsing | PASS — 131 source files, 0 parse errors |
| Import resolution | PASS — 936 import declarations, 0 missing relative imports |
| Lucide React icon validation | PASS — 0 invalid named icons |
| Duplicate object-key scan | PASS — 0 duplicate keys |
| Migration destructive-operation scan | PASS — no `DROP DATABASE` or `TRUNCATE TABLE` in v1.2 migration |
| Version consistency | PASS — root, client, server, and `VERSION` are 1.2.0 |
| Secret/build-artifact hygiene in final package | PASS — no actual `.env`, `node_modules`, `client/dist`, or user-uploaded medical/landing files |
| Archive integrity and clean extraction | PASS — ZIP and TAR.GZ integrity, manifest verification, clean extraction, 246 static checks, and 20 Node tests |
| Vite production build in this Linux build environment | PENDING — see limitation below |
| Live API/MySQL/SMTP/browser tests | PENDING — target workstation required |

## Automated Node test coverage

The 20 passing tests cover:

1. SHA-256 determinism and timing-safe comparison.
2. Private medical-upload exposure controls.
3. Active licensed Doctor requirement for clinical sign-off.
4. Medicine optional-category validation and field errors.
5. Appointment capacity, booking windows, and idempotency.
6. Stale physical-stock-count rejection.
7. Non-destructive student-to-patient migration contracts.
8. Consultation error-boundary and recovery states.
9. Audited patient viewing, protected downloads, and report exports.
10. Incremental v1.2 schema additions.
11. Versioned policy acceptance and immutable published versions.
12. Pre-login policy access and separate acknowledgments.
13. Landing hero persistence and announcement gallery contracts.
14. Patient/medicine archive blocker and preservation rules.
15. Active-selection exclusion with historical readability.
16. Consultation, issuance, and receipt idempotency.
17. Expired/empty medicine-batch rejection and single void restoration.
18. Frontend and backend permission enforcement for new modules.
19. Database-and-upload backup/restore tooling without embedded credentials.
20. Patient row locks before new appointment, visit, or issuance archive checks.

## Requested workflows verified by source and contract tests

### Public landing and announcements

- Responsive public header, footer, two-column hero, services, announcements/promotions, About, team, appointment CTA, contact, and clinic information.
- Public announcement list and complete post detail.
- Multiple images per post, selected cover image, mobile gallery, and enlarged image dialog.
- Admin create, update, publish/unpublish, delete, publication date/window, ordering, and media removal.
- Image/video file-size, MIME, and signature validation.
- Hero image/video/fallback preview, upload progress, preserve-without-replacement, replace, remove, and media-type consistency.
- Save failures are distinguished from “saved successfully, but refresh failed.”

### Privacy Policy and Terms

- Publicly readable documents before login.
- Credential verification without session creation when current acknowledgments are missing.
- Separate unchecked Privacy and Terms controls.
- Acceptance records include account, exact document/version, date/time, IP, and user agent.
- Publishing a new version archives the previous current version and requires acceptance again.
- Published versions are immutable; administrators create a new draft for changes.

### Patient and medicine archives

- Archive is a metadata/status transition, not a delete.
- Patient archive is blocked by active appointments, open visits, and active follow-ups.
- Medicine archive is blocked by pending/applied inventory work and open/submitted stock counts.
- Remaining medicine stock requires explicit acknowledgment and is not changed.
- Archived records are excluded from active lists and new selections while historical references remain readable.
- Archives page includes Patients and Medicines tabs, search, filters, pagination, actor, date, reason, details, and restoration.
- Unarchive retains the original record ID, medical history, stock, and transactions and reports conflicts.
- Archive/unarchive operations and policy acceptance are audited.
- New appointment, visit, and medicine-issuance transactions lock the patient row before archive-state validation.

### Reliability and safeguards

- Stable idempotency keys are reused for uncertain consultation, medicine issuance, and stock-receipt retries.
- Appointment and queue duplicate protections remain in place.
- Expired or empty explicit medicine batches are rejected in the locking query; automatic selection remains first-expiring eligible stock.
- Completed issuance is locked before voiding so stock cannot be restored twice.
- Patient registration warns about possible active and archived duplicates without automatically merging.
- Reports include date and patient-type filters, appointment attendance, medicine consumption, expiry, staff results, CSV/PDF/print actions, permission checks, and export audit events.
- PowerShell backup/restore utilities cover the MySQL database and uploaded files.

## Frontend validation

A Babel AST pass examined all application source under `client/src`, `server`, and `scripts`:

- 131 files parsed.
- 936 import declarations inspected.
- No syntax/JSX parse errors.
- No missing relative modules.
- No invalid Lucide React named imports.
- No duplicate static object keys.

This is stronger than a text-only import scan, but it does not simulate a browser.

## Production-build limitation

The uploaded project contained Windows-generated/incomplete dependency directories. The Linux build attempt reached Rollup but could not load the platform package `@rollup/rollup-linux-x64-gnu` because its uploaded directory was empty. A clean install could not be performed because the npm registry was unreachable from the build container (`EAI_AGAIN`).

Therefore, a successful Vite production build is **not claimed** here. On the Windows workstation, delete all old `node_modules`, run `npm run install:all`, and then run `npm run build`.

## Target Windows/XAMPP acceptance checklist — Pending

Complete these checks before production use:

### Migration and preservation

- [ ] Back up the current database and `server/uploads/`.
- [ ] Record pre-migration counts for patients, visits, consultations, issuances, batches, users, and activity logs.
- [ ] Apply `002_upgrade_v1_2_0.sql` once after v1.1.0.
- [ ] Run `verify_002_upgrade_v1_2_0.sql` with no missing object or permission result.
- [ ] Confirm pre-existing accounts, password hashes, records, IDs, uploads, and SMTP settings remain intact.

### Authentication and policies

- [ ] Confirm Privacy and Terms are readable before login.
- [ ] Use valid credentials and verify no session is created until each required current document is separately accepted.
- [ ] Confirm one acceptance row per account/document and corresponding audit records.
- [ ] Publish a new version and confirm existing accounts are prompted again exactly once.
- [ ] Verify password reset expiry/single use, logout, session expiry, and session revocation after password change.

### Landing and media

- [ ] Save a hero image, refresh, and verify persistence.
- [ ] Replace it with a video plus fallback, refresh, and verify controls/fallback.
- [ ] Remove hero/fallback media without validation errors.
- [ ] Reject oversized, unsupported, or signature-spoofed files with clear messages.
- [ ] Create a multi-image announcement, choose a cover, publish it, view its gallery/lightbox, and test mobile rendering.
- [ ] Confirm draft/unpublished posts are not visible publicly.

### Archives and history preservation

- [ ] Verify unresolved patient appointments/visits/follow-ups block archiving without silent cancellation.
- [ ] Archive a staged patient and confirm exclusion from new selections while history remains readable.
- [ ] Unarchive and compare its original ID and linked-record counts.
- [ ] Verify pending inventory work/open stock counts block medicine archiving.
- [ ] Archive a staged medicine with stock and confirm every batch balance is unchanged.
- [ ] Unarchive and compare all original stock balances and issuance history.
- [ ] Verify unauthorized direct archive/unarchive API calls return 403.

### Duplicate and concurrency tests

- [ ] Submit the same consultation idempotency key twice and confirm one consultation.
- [ ] Submit the same medicine issuance key twice and confirm one issuance and one deduction.
- [ ] Submit the same stock-receipt key twice and confirm one batch receipt.
- [ ] Submit simultaneous requests for the last appointment slot and verify only capacity-allowed requests commit.
- [ ] Run archive concurrently with a new visit/appointment/issuance and verify the row-locking rules prevent an inconsistent result.
- [ ] Attempt simultaneous issuance/reconciliation and verify stock remains consistent.

### UI, API, SMTP, backup, and restore

- [ ] Run `npm run verify:source`, `npm test`, `npm run build`, `npm run dev`, and `npm run smoke`.
- [ ] Check every page in browser console for runtime/render/effect errors.
- [ ] Test desktop, tablet, narrow mobile, light/dark/system themes, keyboard focus, dialogs, tables, and reduced motion.
- [ ] Confirm field-level errors preserve entered data across the targeted forms.
- [ ] Test real SMTP password-reset and notification delivery.
- [ ] Run the backup utility and restore its database/uploads archive in a separate test environment.

## Conclusion

The source-level release and its non-destructive migration contracts pass the completed automated checks. Production acceptance remains dependent on the Pending Windows/XAMPP, browser, SMTP, concurrency, and separate-environment restore tests above.
