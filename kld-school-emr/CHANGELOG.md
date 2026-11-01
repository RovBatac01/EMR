# Changelog

## 1.2.0 — November 1, 2026

### Public landing page and media

- Rebuilt the public clinic landing page using the KLD forest-green institutional design with responsive navigation, hero, clinic information, services, announcements, promotions, About Us, team, appointment call-to-action, contact, and footer sections.
- Added public announcement/promotion list and detail pages with publication dates, selected cover images, multiple-image galleries, and accessible image enlargement.
- Fixed hero image/video upload behavior so existing media is preserved when no replacement is selected and administrators can remove, replace, or switch media types safely.
- Added image/video previews, upload progress, video fallback images, clear file-size/type messages, server-side MIME/signature checks, and refresh-failure distinction after a successful save.

### Privacy Policy and Terms

- Added public Privacy Policy and Terms pages and pre-login links.
- Added separate, unchecked first-login acknowledgment and acceptance controls.
- Added versioned policy documents, immutable published versions, per-user acceptance records, IP/user-agent/timestamp capture, and mandatory reacceptance after a new version is published.
- Added permission-controlled policy administration and audit events.

### Patient and medicine archives

- Added non-destructive patient and medicine archive/unarchive workflows.
- Added archive metadata, archive event history, responsible user, date, and optional reason.
- Added patient blockers for active appointments, open visits, and active follow-ups.
- Added medicine blockers for pending adjustments and open stock counts, plus explicit remaining-stock acknowledgment without changing balances.
- Added conflict-aware restoration preserving original IDs, medical history, medicine batches, stock, and transactions.
- Added a dedicated Archives page with Patients and Medicines tabs, search, filters, pagination, details, and permission-controlled restoration.

### Reliability and safeguards

- Added stable idempotency keys for consultation creation, medicine issuance, and stock receipt.
- Added unsaved-change warning for consultation entry.
- Strengthened explicit-batch issuance to lock only positive, unexpired stock.
- Retained one-time issuance void/restock locking and existing appointment/queue duplicate protection.
- Added active-versus-archived duplicate patient detection without automatic merging.

### Reports, backup, and audit

- Added patient-type filtering to reports and exports.
- Added appointment attendance and medicine expiration views alongside medicine consumption and staff activity.
- Excluded archived medicines from current active-inventory warning totals while preserving historical issuance/report references.
- Continued backend audit logging for report exports and added archive, unarchive, and policy-acceptance events.
- Added guarded PowerShell database-and-uploads backup/restore utilities and restoration documentation.

### Database

- Added ordered, non-destructive migration `database/migrations/002_upgrade_v1_2_0.sql`.
- Added read-only post-migration verification script `verify_002_upgrade_v1_2_0.sql`.
- Added `landing_content_media`, `policy_documents`, `policy_acceptances`, `archive_events`, and `api_idempotency_keys`.
- Added archive metadata to patients and medicines and updated system version to `1.2.0`.


## 1.1.0 — October 31, 2026

### Hotfixes

- Fixed consultation create/open paths that could render a blank page when an API response was incomplete, navigation state was missing, or a related record could not be loaded.
- Added a global React error boundary and explicit consultation loading, empty, not-found, permission, and retry states.
- Fixed medicine creation when no existing category is selected by normalizing blank optional values consistently between React and Zod.
- Added field-specific medicine validation feedback while preserving entered values after a failed request.
- Restricted medical attachments to authenticated, audited download routes instead of exposing the entire upload directory publicly.

### Public clinic experience

- Added a configurable, responsive public landing page.
- Added administrator-managed hero image/video, fallback image, heading, description, calls to action, announcements, promotions, services, About Us, team, contact, location, and operating-hours content.
- Added file-size, MIME-type, and file-signature validation for uploaded public media.
- Added an anonymous queue display that exposes queue numbers and statuses only.

### Appointments and queue

- Added service definitions, weekly schedules, slot durations, capacities, booking limits, minimum notice, maximum advance booking, and unavailable dates.
- Added student and staff appointment requests, confirmation, decline, cancellation, rescheduling proposals, and student acceptance/decline.
- Added in-app and SMTP-backed confirmation/change/reminder delivery.
- Added transactional slot-capacity checks, daily booking-limit checks, and idempotency protection.
- Added appointment check-in that creates or links exactly one visit and queue entry.
- Added walk-in queue registration and waiting, called, in-consultation, completed, and cancelled states.
- Added urgent/emergency priority management with audit logging.

### Follow-ups

- Added follow-up creation directly from a consultation.
- Added original consultation/patient linkage, reason, target date, assigned staff/doctor, status, notes, reminders, and appointment linkage.
- Added duplicate active-follow-up and duplicate appointment-link protection.
- Added follow-up history to patient profiles.

### Patients and employees

- Added a shared patient identity layer while preserving all existing student UUIDs and medical relationships.
- Added employee patients with configurable personnel categories, departments, employment status, profiles, visits, consultations, medicine issuance, appointments, and follow-ups.
- Kept employee patient records separate from clinic-system user permissions.
- Added student/employee tabs and type-specific filters.
- Added patient-submitted guardian, emergency-contact, contact, and health-information correction requests with approval/rejection, conflict detection, notifications, and immutable history.
- Added dated patient-submitted height and weight measurements without overwriting clinical vital signs.

### Doctors and consultations

- Added a dedicated Doctor role and professional profile.
- Added specialization, professional license number, license expiration, signature name, and active status.
- Nurses and clinic staff may prepare drafts and vital signs; only an authenticated Doctor with an active, non-expired professional profile may clinically sign off.
- Added responsible doctor, completion timestamp, sign-off timestamp, completion notes, revision history, and audit events.
- Kept clinical sign-off separate from release to the student portal.
- Preserved existing completed/released consultations as legacy-completed records during migration.

### Medicines and inventory controls

- Added Medicine Categories management with safe deactivation for categories already in use.
- Added batch-level adjustment requests for damaged, lost, expired, correction, and reconciliation events.
- Added mandatory reasons, supporting notes, requester/approver identities, review notes, before/after balances, and timestamps.
- Added physical stock-count sessions with expected, counted, and variance values.
- Added approval-based reconciliation with row locks, stale-count detection, non-negative stock enforcement, and one-time processing.

### Audit and privacy

- Added backend-enforced logs for medical-record views, medical-attachment downloads, and report exports.
- Added request method, request path, and request ID metadata without storing passwords or tokens.
- Added private medical attachment upload/download/delete workflow.
- Added request IDs to API requests and audit entries.

### Database

- Added ordered, non-destructive migration `database/migrations/001_upgrade_v1_1_0.sql`.
- Added `schema_migrations` and system version `1.1.0`.
- The migration does not drop, truncate, reseed, or replace the existing database.
