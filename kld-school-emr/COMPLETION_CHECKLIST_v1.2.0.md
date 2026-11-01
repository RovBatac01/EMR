# Completion Checklist — KLD School EMR 1.2.0

Status meanings:

- **Passed** — existing functionality was retained and its relevant regression contract passed.
- **Fixed and Verified** — the requested change is implemented across UI/API/database contracts and automated source checks pass.
- **Not Applicable** — the item does not apply to this release.
- **Pending** — requires the target Windows/XAMPP database, browser, SMTP service, or a separate restoration environment and is not claimed as completed in the build container.

## Requested v1.2.0 features

| Requirement | Status | Evidence and qualification |
|---|---|---|
| Modern white/forest-green/sage public landing page | **Fixed and Verified** | Responsive React page, public header/footer, two-column hero, services, announcements, About, team, contact, operating information, CTA, and real `/api/public/landing` data. Source parsing/import checks pass. Manual device review remains in the workstation section. |
| All public navigation and CTA links | **Fixed and Verified** | Home anchors, announcements, policies, sign-in, authenticated appointment path, contact/location, and footer links are wired through React Router or configured URLs. |
| Admin-managed landing content | **Fixed and Verified** | `LandingContentPage.jsx` is backed by authenticated `publicLanding.js` routes and database content tables with `landing.manage` authorization. |
| Announcements/promotions create, edit, publish, unpublish, delete | **Fixed and Verified** | Admin CRUD, publication windows/date, draft/published state, audit events, and database persistence are present. |
| Multiple announcement pictures and selected cover | **Fixed and Verified** | `landing_content_media`, upload limits/signatures, cover selection, ordering, removal, public card cover, gallery, and lightbox are implemented. Parent-before-media insertion is contract-tested. |
| View All and mobile post details | **Fixed and Verified** | Public list and detail routes exist with responsive cards, full body, image gallery, and enlarged accessible modal. |
| Hero image/video validation and persistence fix | **Fixed and Verified** | Type/file consistency, previews, upload progress, size/type/signature errors, preserve/no-replacement behavior, remove/replace actions, fallback image handling, and media-type switching are implemented. |
| Pre-login Privacy Policy and Terms access | **Fixed and Verified** | Public policy routes and login links/modal/full-page views are available before authentication. |
| Separate first-login policy acknowledgments | **Fixed and Verified** | Backend credential verification returns HTTP 428 when current versions are missing; separate unchecked checkboxes are required before session creation. |
| Version/timestamp acceptance records and reacceptance | **Fixed and Verified** | `policy_documents` and `policy_acceptances` persist user, version, timestamp, IP, and user agent; publishing a new version archives the prior version and triggers reacceptance. |
| Admin-managed legal documents | **Fixed and Verified** | Draft/create/edit/publish/delete-draft workflow with immutable published versions, backend permission checks, and audit events. |
| Patient archive | **Fixed and Verified** | Confirmation/reason, blocker checks, archive metadata, audit/event history, active-list exclusion, read-only archived profile, and no deletion of clinical history. |
| Medicine archive | **Fixed and Verified** | Confirmation/reason, open-adjustment/stock-count blockers, explicit remaining-stock acknowledgment, unchanged balances, active-list exclusion, and preserved issuance history. |
| Dedicated Archives page | **Fixed and Verified** | Patient and Medicine tabs, search, type/category/date filters, pagination, details, archive actor/date/reason, and permission-controlled navigation. |
| Patient unarchive | **Fixed and Verified** | Confirmation, original ID/history restoration, status restoration, active-record duplicate conflict check, event/audit records. |
| Medicine unarchive | **Fixed and Verified** | Confirmation, original stock/history restoration, category/duplicate conflict checks, one record restored without stock mutation, event/audit records. |
| Frontend and backend permissions | **Fixed and Verified** | `ProtectedRoute` permission checks and Express `authorize(...)` checks cover landing management, policies, archives, archive/unarchive actions. Backend remains authoritative. |
| Archive/unarchive/policy audit events | **Fixed and Verified** | Dedicated action codes and metadata are written through backend audit utilities. |

## Comprehensive audit items

| Priority / item | Status | Evidence and qualification |
|---|---|---|
| Critical — invalid icon/import/JSX audit | **Fixed and Verified** | All frontend source files parse; relative imports resolve; every named `lucide-react` import exists in the installed package. |
| Critical — React effect cleanup | **Fixed and Verified** | New object URLs are revoked, async public-policy fetch has an active guard, and new pages avoid state updates after cleanup where applicable. Browser runtime review is still listed below. |
| Critical — undefined SQL parameters | **Fixed and Verified** | New routes use MySQL2 placeholders with matched parameter arrays; contract and syntax checks pass. Live SQL execution is Pending. |
| Critical — frontend/backend validation alignment | **Passed** | Existing medicine validation hotfix remains; new hero/gallery/archive/policy schemas match submitted fields and render safe messages. |
| Critical — field-level/preserved form errors | **Fixed and Verified** | Existing medicine form retains values; landing settings distinguish save failure from “saved but refresh failed”; policy/archive forms preserve state until success. |
| Critical — duplicate submissions | **Fixed and Verified** | Existing appointment idempotency retained; consultation create, medicine issuance, and stock receipt use stable client keys plus unique backend idempotency records. |
| Critical — record-level authorization | **Passed** | Existing student ownership protections are retained. New archive/policy/content APIs require permissions on the backend. Live adversarial requests are Pending. |
| High — archive workflow rules | **Fixed and Verified** | Patients with active appointments/open visits/follow-ups are blocked; medicines with pending adjustments/open counts are blocked; remaining stock is disclosed and preserved. |
| High — appointment completion | **Passed** | Existing transactional capacity, cancellation, alternatives, reminders, no-show, queue check-in, and duplicate visit/queue protections remain in v1.2. Live concurrency remains Pending. |
| High — consultation integrity | **Fixed and Verified** | Existing drafts, Doctor sign-off, revisions, and release separation remain; new consultation creation idempotency and unsaved-change warning are included. |
| High — inventory safeguards | **Fixed and Verified** | Expired/empty explicit batches are rejected in the SQL lock query, FEFO behavior remains for automatic selection, negative stock is blocked, and void restoration locks completed issuance exactly once. |
| High — backup and restore | **Fixed and Verified** | PowerShell utilities back up MySQL plus uploads, avoid command-line password exposure, create a manifest, and provide guarded restore. A real separate-environment restore is **Pending**. |
| Medium — media previews/progress/fallback/gallery | **Fixed and Verified** | Image/video preview, progress, type/size/signature validation, video fallback, cover preview, galleries, and post-refresh loading are implemented. |
| Medium — account recovery and sessions | **Passed** | Existing single-use/expiring reset tokens, HTTP-only JWT session, logout, expiry, and password-change behavior are retained. Live SMTP reset-link delivery is Pending. |
| Medium — search and duplicate detection | **Fixed and Verified** | Patient search remains; registration duplicate check reports active and archived matches without merging. |
| Medium — reports and exports | **Fixed and Verified** | Date and patient-type filters, visit, attendance, medicine consumption, expiry, staff results, CSV/PDF/print support, backend permission, and export auditing are included. |
| Medium — accessibility/mobile | **Fixed and Verified** | Labels, focusable controls, semantic buttons/links, responsive grids/cards/tables, modal labels, loading/empty/error states, and reduced-motion foundations are present. Manual keyboard/screen-size review is Pending. |

## Automated verification completed in the build environment

- Backend/build-script syntax checks, excluding dependency source files.
- Node unit and source-contract tests.
- Frontend Babel parsing.
- Frontend relative-import resolution.
- Lucide named-export validation.
- Static architecture/security/database contract validation.
- Clean package hygiene checks.
- ZIP/TAR archive integrity and clean extraction checks.

Exact counts are recorded in `TEST_RESULTS_v1.2.0.md` and `VALIDATION_REPORT_v1.2.0.md`.

## Target Windows/XAMPP acceptance — Pending

These items cannot be honestly marked complete without the user's actual XAMPP database, SMTP account, and browsers:

- [ ] Apply `002_upgrade_v1_2_0.sql` to a current database backup with zero SQL errors.
- [ ] Run `verify_002_upgrade_v1_2_0.sql` and compare pre/post clinical record totals.
- [ ] Confirm existing accounts, password hashes, records, uploads, and SMTP settings remain intact.
- [ ] Run the Vite production build after a clean `npm install` on Windows.
- [ ] Run `npm run smoke` against the live API/MySQL database.
- [ ] Test unauthorized direct API calls for every new action.
- [ ] Test two simultaneous requests for a final appointment slot.
- [ ] Retry the same consultation, issuance, and stock receipt key and confirm one resource/transaction only.
- [ ] Archive/unarchive a staged patient and verify all visits, consultations, attachments, and IDs are unchanged.
- [ ] Archive/unarchive a staged medicine and verify every batch balance and historical issuance is unchanged.
- [ ] Publish new Privacy/Terms versions and verify existing users are prompted once per new version.
- [ ] Test hero image, hero video, fallback, removal, replacement, and browser refresh persistence.
- [ ] Test announcement gallery upload, selected cover, deletion, public card, lightbox, and mobile rendering.
- [ ] Complete keyboard, tablet, mobile, contrast, focus, and reduced-motion review.
- [ ] Send real SMTP password-reset/policy-related notifications as applicable.
- [ ] Restore a database-and-uploads backup into a separate test environment and document the result.

Do not deploy this clinical system to production until the Pending workstation checks have been completed and recorded.
