# KLD School Electronic Medical Records and Student Clinic Portal

**Release:** 1.2.0  
**Stack:** React + Vite, Node.js + Express, MySQL/MariaDB through XAMPP  
**Database:** `kld_school_emr`

KLD School EMR is a local full-stack clinic-management and patient-portal application for Kolehiyo ng Lungsod ng Dasmariñas. Version 1.2.0 is an incremental upgrade that preserves the existing React/Express/MySQL installation and adds a redesigned public clinic site, announcement galleries, versioned policy acceptance, patient and medicine archives, stronger duplicate protection, reports, and backup/restore tooling.

## Architecture

```text
React 18 + Vite + Tailwind CSS
        |
        | Axios REST API
        | JWT in HTTP-only cookies + CSRF
        v
Node.js + Express
        |
        | MySQL2 parameterized queries + transactions
        v
MySQL / MariaDB supplied by XAMPP
```

Default local addresses:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- API health: `http://localhost:5000/api/health`
- Database: `127.0.0.1:3306`
- Database name: `kld_school_emr`

All ports and secrets remain configurable through environment variables.

## Version 1.2.0 highlights

### Public clinic website and media

- Rebuilt the public landing page with a white, forest-green, and soft-accent institutional design.
- Added responsive navigation, two-column hero, clinic information, services, announcements, promotions, About Us, team, appointment CTA, contact, and footer sections.
- Added public announcement/promotion listing and detail routes with publication dates, cover images, multi-image galleries, and image enlargement.
- Fixed hero image/video replacement rules: administrators can preserve, remove, replace, or switch media types; videos support fallback images and controls.
- Added client previews, upload progress, file-size/type messages, and backend MIME/signature validation.

### Privacy Policy and Terms

- Added public Privacy Policy and Terms pages and pre-login links.
- Added separate first-login acknowledgment and acceptance checkboxes.
- Added versioned legal documents, immutable published versions, per-user acceptance timestamps, IP/user-agent capture, and reacceptance after a new version is published.
- Added a permission-controlled Privacy & Terms administration page and audit events.

### Patient and medicine archives

- Added true archive/unarchive workflows instead of deleting clinical or inventory records.
- Archived records are excluded from active lists and new transactions but remain readable in histories and reports.
- Patient archiving blocks unresolved appointments, open visits, and active follow-ups.
- Medicine archiving blocks pending adjustments/open stock counts and preserves every batch balance.
- Added a dedicated Archives page with Patient and Medicine tabs, search, filters, pagination, actor/date/reason details, and conflict-aware restoration.

### Reliability, reports, and operations

- Added stable idempotency keys for consultation creation, medicine issuance, and stock receipt while retaining appointment/queue duplicate protection.
- Added unsaved-change protection to consultation entry and clearer saved-versus-refresh-failed messaging for landing administration.
- Strengthened explicit batch issuance to require positive, unexpired stock in the locked database query.
- Added patient-type filters, appointment attendance, medicine consumption, expiry reporting, and audited CSV/PDF exports.
- Added PowerShell backup/restore tools covering both the MySQL database and uploaded files.

## Retained Version 1.1.0 capabilities

### Hotfixes

- Consultation creation and visit-history opening no longer fail into a blank screen. Pages now have guarded navigation, normalized API data, loading, empty, error, retry, and application-level error-boundary states.
- Medicine creation now treats an unselected category as an optional value, aligns React field names with Zod validation, preserves entered data, and displays field-level errors.
- Medical attachments are private; only branding and public landing media are directly exposed.

### Public landing page

Administrators can configure:

- hero image or accessible video with fallback image;
- hero heading, description, and call-to-action buttons;
- announcements and promotions;
- clinic services;
- About Us and Our Team;
- contact details, location, and operating hours;
- item ordering and publication visibility.

Appointment requests require authentication. The anonymous queue display shows queue numbers and status only.

### Appointment scheduling and queue

- Services, durations, weekly schedules, capacity, daily limits, unavailable dates, minimum notice, and advance-booking windows
- Student and staff appointment requests
- Staff confirmation, decline, cancellation, proposed alternative, and rescheduling
- Student acceptance/decline of alternatives
- Confirmation, change, cancellation, and reminder notifications using the existing in-app and SMTP queue
- Transactional overbooking protection and idempotency keys
- Check-in that creates or links one visit and one queue record
- Walk-in queue registration
- Waiting, called, in-consultation, completed, and cancelled states
- Urgent/emergency prioritization with audit logging

### Follow-up management

- Return visit scheduling from an existing consultation
- Patient and source-consultation linkage
- Reason, target date, assigned provider/doctor, notes, status, reminders, and appointment linkage
- Duplicate active-follow-up and duplicate appointment-link prevention
- Patient-profile history

### Student and employee patients

- Shared patient identity with existing student UUIDs preserved
- Employee patients with configurable category, department, position, and employment status
- Type-specific search/filter views
- Visits, consultations, medicine issuance, appointments, follow-ups, emergency contacts, guardians, attachments, and medical history for both patient types
- Employee patient status remains separate from clinic-system login permissions

### Doctor role and clinical sign-off

- Dedicated `DOCTOR` role and professional profile
- Specialization, professional license, expiration, signature name, and active status
- Nurses/staff may prepare consultations and vital signs
- Only an authenticated Doctor with an active, non-expired profile may clinically sign off
- Responsible doctor and completion/sign-off timestamps
- Clinical completion remains separate from release to the student portal
- Completed record amendments are audited through revision history

### Inventory controls

- Medicine Categories management with safe deactivation
- Batch-level adjustment requests for damaged, lost, expired, correction, and reconciliation events
- Mandatory reason and supporting notes
- Separate requester and authorized approver
- Before/after quantities and full audit timestamps
- Physical stock-count sessions with expected, counted, and variance values
- Row locks, stale-count detection, non-negative stock enforcement, and one-time processing

### Patient corrections and measurements

Students can submit approval-based requests for:

- contact information;
- guardian information;
- emergency contact information;
- health information.

The reviewer sees current and proposed values. Conflict detection prevents an approval from silently overwriting a record changed after submission. Students are notified of approval or rejection.

Students can also add dated, self-reported height and weight measurements. These remain separate from consultation vital signs and do not overwrite history.

### Auditing and privacy

The backend records:

- medical-record views;
- medical-attachment downloads;
- report exports;
- actor, affected record/report, timestamp, request method/path/ID, and limited metadata.

Passwords, JWTs, verification tokens, and unnecessary medical content are not written to the activity log.

## Required software

1. Windows 10/11
2. Node.js 20 LTS or newer
3. XAMPP with MySQL/MariaDB running
4. DBeaver Community recommended, or phpMyAdmin
5. Internet access for the first `npm install`

Apache is optional unless phpMyAdmin is used. The application itself is served by Node.js and Vite.

# Upgrade an existing installation

Use the complete procedure in:

```text
UPGRADE_v1.2.0.md
```

Summary for a current 1.1.0 installation:

1. Back up the database, project, `server/.env`, and `server/uploads/`.
2. Extract version 1.2.0 into a new folder.
3. Restore the preserved `.env` and merge uploads.
4. Run `npm run install:all`.
5. Import **only** `database/migrations/002_upgrade_v1_2_0.sql`.
6. Run `database/migrations/verify_002_upgrade_v1_2_0.sql`.
7. Run the validation commands and complete `COMPLETION_CHECKLIST_v1.2.0.md`.

When upgrading from 1.0.0, apply `001_upgrade_v1_1_0.sql` before `002_upgrade_v1_2_0.sql`.

Never import `database/schema.sql` or `database/seed.sql` over an existing database. The schema file intentionally creates a fresh database.

# Fresh development installation

## 1. Start MySQL

Open XAMPP Control Panel and start **MySQL**. Start Apache only when using phpMyAdmin.

## 2. Import the database in this order

```text
1. database/schema.sql
2. database/seed.sql
3. database/migrations/001_upgrade_v1_1_0.sql
4. database/migrations/002_upgrade_v1_2_0.sql
```

### DBeaver

Connect using the XAMPP credentials, open each file in the SQL Editor, and execute the entire script in the order above.

### phpMyAdmin

Import `schema.sql`, select `kld_school_emr`, then import `seed.sql`, migration `001`, and migration `002` in order.

## 3. Configure the backend

```powershell
Copy-Item server\.env.example server\.env
notepad server\.env
```

Minimum development configuration:

```env
NODE_ENV=development
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=kld_school_emr
DB_USER=root
DB_PASSWORD=
DB_TIMEZONE=+08:00
JWT_SECRET=replace-with-a-long-random-secret-at-least-32-characters
EMAIL_MODE=log
APP_URL=http://localhost:5173
```

Generate a strong secret in PowerShell:

```powershell
[Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(48))
```

For the existing installation, keep its working database, JWT, cookie, and SMTP configuration rather than replacing it with examples.

## 4. Optional frontend configuration

The Vite proxy works without `client/.env`. For an explicit API URL:

```powershell
Copy-Item client\.env.example client\.env
```

```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=KLD School EMR
```

Never put database credentials or JWT secrets in the frontend environment.

## 5. Install and run

```powershell
npm run install:all
npm run dev
```

Open:

```text
http://localhost:5173
```

## Fictional development accounts

Fresh seed data uses the development password:

```text
Demo@12345
```

| Role | Username | Email |
|---|---|---|
| Super Administrator | `admin` | `admin@kldclinic.local` |
| Clinic Administrator | `clinic.admin` | `clinic.admin@kldclinic.local` |
| Clinic Staff/Nurse | `nurse.maria` | `nurse.maria@kldclinic.local` |
| Clinic Staff | `clinic.paolo` | `clinic.paolo@kldclinic.local` |
| Viewer | `viewer.noel` | `viewer.noel@kldclinic.local` |
| KLD Student | `student.ava` | `ava.reyes@student.kld.local` |

The upgrade migrations do not reset existing account credentials. Change all development credentials before using non-fictional data.

## Clinic name, logo, and landing content

Administrator settings remain database-backed:

```text
Settings → Clinic Branding
```

Change the school name, clinic name, system name, contact, address, operating information, and institutional logo.

Manage the public website through:

```text
Landing Content
```

Manage versioned legal documents through:

```text
Privacy & Terms
```

Inspect or restore archived records through:

```text
Archives
```

## SMTP

The migrations do not replace `server/.env`. Existing working SMTP settings are preserved when that file is copied to the upgraded source.

Development mode:

```env
EMAIL_MODE=log
```

SMTP mode:

```env
EMAIL_MODE=smtp
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-user
SMTP_PASSWORD=your-password
SMTP_FROM="KLD Clinic <clinic@example.com>"
```

Restart the backend after environment changes.

## Verification

Dependency-free source checks:

```powershell
npm run verify:source
npm test
```

After dependencies are installed:

```powershell
npm run build
```

With the API and XAMPP database running:

```powershell
npm run dev
npm run smoke
```

See `TEST_RESULTS_v1.2.0.md` for completed checks, environment limitations, and the target-workstation acceptance checklist.

## Project layout

```text
kld-school-emr/
├── client/                  React/Vite frontend
├── server/                  Express REST API
├── database/
│   ├── schema.sql           fresh base schema only
│   ├── seed.sql             fictional fresh-install data
│   └── migrations/
│       ├── 001_upgrade_v1_1_0.sql
│       ├── 002_upgrade_v1_2_0.sql
│       └── verify_002_upgrade_v1_2_0.sql
├── docs/
├── scripts/
├── CHANGELOG.md
├── UPGRADE_v1.2.0.md
├── COMPLETION_CHECKLIST_v1.2.0.md
├── TEST_RESULTS_v1.2.0.md
├── VALIDATION_REPORT_v1.2.0.md
├── RUN_FIRST.md
└── README.md
```

## Security notes

- Backend permission checks are authoritative; navigation visibility is not treated as security.
- Student APIs derive patient ownership from the authenticated session.
- Employee patients do not automatically receive user accounts or permissions.
- SQL uses MySQL2 parameters.
- Cookie-authenticated mutations require a CSRF token.
- Appointments, stock reconciliation, and medicine issuance use transactions and row locks.
- Medical attachments are private and streamed through authenticated, audited routes.
- Public uploads are limited to branding and landing assets and are file-signature validated.
- Actual `.env` files are excluded from distribution and Git.

Additional documentation:

- `CHANGELOG.md`
- `UPGRADE_v1.2.0.md`
- `TEST_RESULTS_v1.2.0.md`
- `VALIDATION_REPORT_v1.2.0.md`
- `COMPLETION_CHECKLIST_v1.2.0.md`
- `docs/database-setup.md`
- `docs/api-documentation.md`
- `docs/user-guide.md`
