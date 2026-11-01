# REST API Overview

Base URL: `http://localhost:5000/api`

Responses use:

```json
{
  "success": true,
  "message": "Request completed successfully.",
  "data": {},
  "meta": { "page": 1, "limit": 20, "total": 100, "pages": 5 }
}
```

Authentication uses an HTTP-only JWT cookie. Before a state-changing request, obtain `GET /auth/csrf` and send the readable `XSRF-TOKEN` cookie value as `X-CSRF-Token`.

## Authentication

- `GET /auth/csrf`
- `POST /auth/login`
- `GET /auth/me`
- `POST /auth/logout`
- `POST /auth/change-password`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `POST /auth/register-student`
- `POST /auth/verify-student`
- `POST /auth/activate-account`

## Students and clinic records

- `GET|POST /students`
- `GET /students/search`
- `GET|PATCH /students/:id`
- `GET|POST /visits`
- `GET|PATCH /visits/:id`
- `GET|POST /consultations`
- `GET|PATCH /consultations/:id`
- `POST /consultations/:id/release`

## Medicines

- `GET|POST /medicines`
- `GET /medicines/categories`
- `GET /medicines/low-stock`
- `GET /medicines/expired`
- `GET|PATCH /medicines/:id`
- `POST /medicines/:id/batches`
- `GET|POST /medicine-issuance`
- `GET /medicine-issuance/:id`
- `POST /medicine-issuance/:id/void`

## Administration

- `GET|POST /staff`
- `GET /staff/roles`
- `GET|PATCH /staff/:id`
- `POST /staff/:id/reset-password`
- `GET /staff/:id/activity`
- `GET /reports/dashboard`
- `GET /reports/summary`
- `GET /reports/visits.csv`
- `GET /reports/visits.pdf`
- `GET /activity-logs`
- `GET|PATCH /settings`
- `GET /settings/public`
- `POST|DELETE /settings/logo`
- `GET|PATCH /student-accounts`
- `POST /student-accounts/:id/resend-activation`
- `POST /student-accounts/:id/revoke`
- `POST /student-accounts/import`
- `GET|POST /forms`
- `POST /forms/:id/version`
- `POST /forms/:id/assign`
- `GET /forms/submissions`
- `GET /email-logs`
- `POST /email-logs/:id/retry`
- `GET /notifications`
- `PATCH /notifications/:id/read`
- `POST /notifications/read-all`

## Student portal

All endpoints derive student ownership from the authenticated student session:

- `GET /student-portal/dashboard`
- `GET /student-portal/profile`
- `GET /student-portal/visits`
- `GET /student-portal/consultations`
- `GET /student-portal/medicines`
- `GET /student-portal/forms`
- `POST /student-portal/forms/:assignmentId/submit`
- `GET /student-portal/forms/submissions/:id`
- `GET /student-portal/notifications`

---

# Version 1.1.0 API additions

All authenticated cookie mutations require `X-CSRF-Token`. Permissions are enforced by the backend.

## Public landing and queue

- `GET /api/public/landing`
- `GET /api/queue/public?date=YYYY-MM-DD`
- `GET /api/public/landing/admin`
- `PATCH /api/public/landing/admin/config`
- `POST /api/public/landing/admin/items`
- `PATCH /api/public/landing/admin/items/:id`
- `DELETE /api/public/landing/admin/items/:id`

## Shared patients and employees

- `GET /api/patients`
- `GET /api/patients/search`
- `POST /api/patients`
- `GET /api/patients/:id`
- `PATCH /api/patients/:id`
- `DELETE /api/patients/:id`
- `GET /api/patients/employee-categories`
- `POST /api/patients/employee-categories`
- `PATCH /api/patients/employee-categories/:id`
- `DELETE /api/patients/employee-categories/:id`

## Appointments

- `GET /api/appointments/services`
- `GET /api/appointments/availability`
- `GET /api/appointments`
- `POST /api/appointments`
- `PATCH /api/appointments/:id/status`
- `POST /api/appointments/:id/respond`
- `POST /api/appointments/:id/cancel`
- `POST /api/appointments/:id/check-in`
- `GET /api/appointments/admin/schedules`
- `POST/PATCH /api/appointments/admin/services`
- `POST/PATCH/DELETE /api/appointments/admin/schedules`
- `POST/DELETE /api/appointments/admin/unavailable-dates`

## Queue and follow-ups

- `GET /api/queue`
- `POST /api/queue/walk-in`
- `PATCH /api/queue/:id/status`
- `PATCH /api/queue/:id/priority`
- `GET /api/follow-ups`
- `POST /api/follow-ups`
- `PATCH /api/follow-ups/:id`
- `POST /api/follow-ups/:id/link-appointment`

## Consultation sign-off

- `POST /api/consultations/:id/sign-off` — Doctor role and valid active professional profile required
- `POST /api/consultations/:id/release` — separate authorized release action

## Inventory control

- `GET /api/inventory-control/batches`
- `GET/POST /api/inventory-control/adjustments`
- `POST /api/inventory-control/adjustments/:id/approve`
- `POST /api/inventory-control/adjustments/:id/reject`
- `GET/POST /api/inventory-control/stock-counts`
- `GET /api/inventory-control/stock-counts/:id`
- `PATCH /api/inventory-control/stock-counts/:sessionId/items/:itemId`
- `POST /api/inventory-control/stock-counts/:id/submit`

## Patient corrections and measurements

- `POST /api/patient-corrections`
- `GET /api/patient-corrections/mine`
- `GET /api/patient-corrections`
- `POST /api/patient-corrections/:id/review`
- `GET /api/student-portal/measurements`
- `POST /api/student-portal/measurements`

## Private medical attachments

- `POST /api/attachments`
- `GET /api/attachments/:id/download`
- `DELETE /api/attachments/:id`

The download endpoint validates authentication and record access and creates a `DOWNLOAD_MEDICAL_ATTACHMENT` audit entry.

---

# Version 1.2.0 API additions and changes

## Public landing posts

- `GET /api/public/landing`
- `GET /api/public/posts?type=ANNOUNCEMENT|PROMOTION&page=1&limit=12`
- `GET /api/public/posts/:id`
- `GET /api/public/landing/admin`
- `PATCH /api/public/landing/admin/config`
- `POST /api/public/landing/admin/items`
- `PATCH /api/public/landing/admin/items/:id`
- `DELETE /api/public/landing/admin/items/:id`
- `DELETE /api/public/landing/admin/items/:id/media/:mediaId`

Landing administration requires `landing.manage`. Post requests may include multiple `images`, `coverIndex` or `coverMediaId`, `publicationDate`, visibility dates, and publication state.

## Privacy Policy and Terms

Public:

- `GET /api/policies/public`
- `GET /api/policies/public/privacy`
- `GET /api/policies/public/terms`

Authenticated:

- `GET /api/policies/acceptance-status`

Administration (`policies.manage`):

- `GET /api/policies/admin`
- `POST /api/policies/admin`
- `PATCH /api/policies/admin/:id`
- `POST /api/policies/admin/:id/publish`
- `DELETE /api/policies/admin/:id` — unpublished drafts only

`POST /api/auth/login` may return HTTP `428` with `details.code = POLICY_ACCEPTANCE_REQUIRED` and the current missing documents. The retry must include the matching document IDs and separate acceptance booleans.

## Archives

Read (`archives.read`):

- `GET /api/archives/patients`
- `GET /api/archives/medicines`

Patient actions:

- `GET /api/archives/patients/:id/eligibility`
- `POST /api/archives/patients/:id/archive`
- `POST /api/archives/patients/:id/unarchive`

Medicine actions:

- `GET /api/archives/medicines/:id/eligibility`
- `POST /api/archives/medicines/:id/archive`
- `POST /api/archives/medicines/:id/unarchive`

Archive/unarchive routes require their specific backend permission and a CSRF token. Archiving does not delete records or mutate medicine balances.

## Active-record behavior

- Active patient and medicine lists exclude archived records.
- Duplicate-patient checks include active and archived matches.
- Historical visit, consultation, issuance, and report joins retain archived references.
- Direct patient/medicine `DELETE` operations are not used for record retirement; clients must use the archive workflow.

## Idempotent high-consequence submissions

Consultation creation, medicine issuance, and stock receipt accept a stable client-generated `idempotencyKey`. A retry after an uncertain response must reuse the same key. The server returns the original resource instead of creating a duplicate.
