# Upgrade Guide — KLD School EMR 1.0.0 to 1.1.0

This release is an **in-place, non-destructive upgrade** for an existing `kld_school_emr` installation. It preserves current records, user accounts, password hashes, sessions, SMTP settings in `server/.env`, and uploaded files when the steps below are followed.

## Before starting

1. Schedule a maintenance window and stop the Node/Vite processes.
2. Back up the database.
3. Back up the complete current project directory, especially:
   - `server/.env`
   - `server/uploads/`
   - any custom reverse-proxy or startup configuration
4. Confirm the current application is the 1.0.0 React/Express/MySQL release and the database is named `kld_school_emr`.
5. Do **not** import `database/schema.sql` or `database/seed.sql` over an existing installation. Those files are for a fresh installation and `schema.sql` intentionally recreates the database.

## Step 1 — Back up MySQL/MariaDB

### DBeaver

1. Right-click `kld_school_emr`.
2. Select **Tools → Dump database**.
3. Include structure and data.
4. Save the SQL dump outside the project folder.

### phpMyAdmin

1. Select `kld_school_emr`.
2. Choose **Export**.
3. Select **Custom**, SQL format, all tables, structure and data.
4. Download the backup.

## Step 2 — Preserve configuration and uploads

From the existing installation, copy these somewhere safe:

```text
server/.env
server/uploads/
```

The release ZIP intentionally does not contain a real `.env` file. Keep the working SMTP and database values from the existing installation.

## Step 3 — Replace the application source

Recommended method:

1. Extract the 1.1.0 package to a new folder.
2. Copy the existing `server/.env` into the new `server/` folder.
3. Copy the existing `server/uploads/` directory into the new `server/` folder and merge it without deleting files.
4. Do not copy old `node_modules` directories. Install clean dependencies instead.

This method makes rollback easier than overwriting the old folder.

## Step 4 — Install/update dependencies

Open PowerShell in the new project root:

```powershell
npm run install:all
```

No Supabase, Firebase, PHP application server, or cloud database is required.

## Step 5 — Apply the migration once

Run only:

```text
database/migrations/001_upgrade_v1_1_0.sql
```

### DBeaver

1. Connect to the same XAMPP MySQL/MariaDB server.
2. Open **SQL Editor → Open SQL Script**.
3. Select `database/migrations/001_upgrade_v1_1_0.sql`.
4. Confirm the script begins with `USE kld_school_emr;`.
5. Execute the complete script once.

### phpMyAdmin

1. Select `kld_school_emr`.
2. Choose **Import**.
3. Select `database/migrations/001_upgrade_v1_1_0.sql`.
4. Import once.

Do not run the migration repeatedly. It contains one-time `ALTER TABLE` statements.

## Step 6 — Verify the migration

Run these queries:

```sql
SELECT version, description, applied_at
FROM kld_school_emr.schema_migrations
ORDER BY applied_at DESC;
```

Expected latest version:

```text
001_upgrade_v1_1_0
```

Verify student preservation and shared patient backfill:

```sql
SELECT
  (SELECT COUNT(*) FROM students) AS students,
  (SELECT COUNT(*) FROM patients WHERE patient_type = 'STUDENT') AS student_patients,
  (SELECT COUNT(*) FROM visits WHERE patient_id IS NULL) AS visits_missing_patient,
  (SELECT COUNT(*) FROM consultations WHERE patient_id IS NULL) AS consultations_missing_patient,
  (SELECT COUNT(*) FROM medicine_issuances WHERE patient_id IS NULL) AS issuances_missing_patient;
```

For a normal 1.0.0 database, `students` and `student_patients` should match, and all three `*_missing_patient` counts should be `0`.

Verify system version:

```sql
SELECT setting_value
FROM system_settings
WHERE setting_key = 'system_version';
```

Expected:

```text
1.1.0
```

## Step 7 — Start the system

```powershell
npm run dev
```

Open:

```text
http://localhost:5173
```

The backend remains:

```text
http://localhost:5000
```

## Step 8 — Create or convert a Doctor account

1. Sign in as Super Administrator.
2. Open **Staff Management**.
3. Add or edit an account.
4. Select **Clinic Doctor**.
5. Enter a professional license number and, when applicable, expiration date and specialization.

A Doctor cannot sign off a consultation without an active professional profile and license number. An expired license date blocks sign-off.

## Step 9 — Configure new modules

1. **Landing Content** — publish hero media, announcements, services, team, contact, and operating information.
2. **Appointment Schedules** — configure services, weekly schedules, capacity, notice periods, advance-booking limits, and unavailable dates.
3. **Medicine Categories** — review/deactivate categories safely.
4. **Inventory Control** — assign request/approval duties according to existing roles.
5. **Employee Categories** — customize personnel categories before registering employee patients.

## Step 10 — Run verification

```powershell
npm run verify:source
npm test
npm run build
npm run dev
npm run smoke
```

Also complete the manual acceptance checklist in `TEST_RESULTS.md` against a backup or test copy of the database before production use.

## Rollback

If the upgrade fails:

1. Stop Node/Vite.
2. Restore the previous project folder.
3. Restore the pre-upgrade database dump.
4. Restore `server/.env` and `server/uploads/` if necessary.
5. Start the previous version and verify login and core records.

Because the migration adds tables/columns and backfills references, rollback should be performed by restoring the backup rather than manually dropping new objects.
