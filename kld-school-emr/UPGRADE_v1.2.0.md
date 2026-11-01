# Upgrade Guide — KLD School EMR 1.1.0 to 1.2.0

Version 1.2.0 is an **incremental, non-destructive upgrade**. It adds the redesigned public site, announcement galleries, versioned Privacy Policy and Terms acceptance, patient and medicine archiving, duplicate-submission safeguards, enhanced reports, and local backup/restore utilities.

The migration does not recreate or reseed the database. Existing records, account IDs, password hashes, consultations, visits, medicine balances, transactions, SMTP configuration, and uploaded files remain in place when this guide is followed.

## Before starting

1. Confirm the current database is `kld_school_emr`.
2. Prefer upgrading from version 1.1.0. When upgrading from 1.0.0, apply `001_upgrade_v1_1_0.sql` before `002_upgrade_v1_2_0.sql`.
3. Schedule a maintenance window and stop the Node/Vite processes.
4. Back up both the database and `server/uploads/`.
5. Save the existing `server/.env` separately.
6. Do **not** import `database/schema.sql` or `database/seed.sql` over an existing installation.

## Step 1 — Create a backup

The release includes a Windows PowerShell backup utility:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\backup-local.ps1
```

It reads the existing backend configuration, creates a MySQL/MariaDB dump through `mysqldump`, copies `server/uploads/`, writes a manifest, and produces a ZIP in `backups/`.

A manual DBeaver or phpMyAdmin export is also recommended before a production upgrade.

### DBeaver

1. Right-click `kld_school_emr`.
2. Select **Tools → Dump database**.
3. Include structure and data.
4. Save the dump outside the application folder.

### phpMyAdmin

1. Select `kld_school_emr`.
2. Choose **Export → Custom**.
3. Include all tables, structure, and data.
4. Download the SQL file.

## Step 2 — Extract the new source

1. Extract the 1.2.0 ZIP to a new folder.
2. Copy the working `server/.env` from the old installation into the new `server/` folder.
3. Merge the old `server/uploads/` directory into the new project without deleting existing files.
4. Do not copy old `node_modules` directories. Install dependencies cleanly.

Keeping the old project folder unchanged provides a simple application-source rollback.

## Step 3 — Install dependencies

From the new project root:

```powershell
npm run install:all
```

## Step 4 — Apply the database migration once

For an existing 1.1.0 database, run only:

```text
database/migrations/002_upgrade_v1_2_0.sql
```

### DBeaver

1. Connect to the same XAMPP MySQL/MariaDB server.
2. Open **SQL Editor → Open SQL Script**.
3. Select `002_upgrade_v1_2_0.sql`.
4. Confirm the script begins with `USE kld_school_emr;`.
5. Execute the entire script once.

### phpMyAdmin

1. Select `kld_school_emr`.
2. Choose **Import**.
3. Select `002_upgrade_v1_2_0.sql`.
4. Import once.

The migration is designed to tolerate a retry after an interrupted column/index/foreign-key addition, but a database backup remains the required rollback mechanism.

## Step 5 — Verify the migration

Run:

```text
database/migrations/verify_002_upgrade_v1_2_0.sql
```

At minimum, verify:

```sql
SELECT version, description, applied_at
FROM schema_migrations
ORDER BY applied_at DESC;
```

Expected latest version:

```text
002_upgrade_v1_2_0
```

Verify the application version:

```sql
SELECT setting_value
FROM system_settings
WHERE setting_key = 'system_version';
```

Expected:

```text
1.2.0
```

Verify the two currently published legal documents:

```sql
SELECT document_type, version, status
FROM policy_documents
WHERE status = 'PUBLISHED'
ORDER BY document_type;
```

Expected: one `PRIVACY_POLICY` and one `TERMS_AND_CONDITIONS` row.

## Step 6 — Start and validate the source

```powershell
npm run verify:source
npm test
npm run build
npm run dev
```

In another PowerShell window:

```powershell
npm run smoke
```

Open:

```text
http://localhost:5173
```

## Step 7 — Configure the new administration areas

After signing in as Super Administrator or another permitted account:

1. **Public Landing Page** — review hero media, operating information, services, About Us, team members, announcements, promotions, publication dates, galleries, and cover images.
2. **Privacy & Terms** — review the seeded version 1.0 documents. Create and publish a new version when the institution approves updated text.
3. **Archives** — verify the Patients and Medicines tabs, permissions, filters, details, and restoration workflow.
4. **Reports** — verify date and patient-type filters and authorized exports.
5. **Settings** — confirm the school name, clinic name, institutional logo, contact information, and operating information.

## Step 8 — Acceptance checks

Complete the target-workstation checks in:

```text
COMPLETION_CHECKLIST_v1.2.0.md
```

Important checks include:

- first login requires separate acceptance of the current Privacy Policy and Terms;
- publishing a new legal-document version requires acceptance again;
- hero media can be preserved, removed, replaced, and switched between image/video;
- announcement galleries retain the selected cover image and open in the public detail view;
- archived patients and medicines disappear from active selections but remain readable in history;
- unresolved appointments, visits, follow-ups, adjustments, or stock counts block archiving;
- unarchiving restores the original ID and stock/history without duplication;
- consultation creation, medicine issuance, and stock receipts remain single-processing under retry;
- unauthorized direct API requests are rejected.

## Fresh installation order

For a completely new development database, import in this order:

```text
1. database/schema.sql
2. database/seed.sql
3. database/migrations/001_upgrade_v1_1_0.sql
4. database/migrations/002_upgrade_v1_2_0.sql
```

Do not use this sequence on an existing database because `schema.sql` intentionally recreates `kld_school_emr`.

## Rollback

If the upgrade cannot be accepted:

1. Stop Node/Vite.
2. Restore the pre-upgrade database dump.
3. Restore the previous project folder.
4. Restore `server/.env` and `server/uploads/`.
5. Start the previous version and verify login, records, medicine balances, and SMTP.

Use the documented restore utility only after reviewing its parameters:

```powershell
Get-Help .\scripts\restore-local.ps1 -Detailed
```

For a clinical system, rollback should use the complete backup instead of manually dropping new tables or columns.
