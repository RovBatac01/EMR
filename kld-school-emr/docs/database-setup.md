# Database Setup and Upgrade

## Existing database

Back up `kld_school_emr` and `server/uploads/` before changing the schema. Do not import `schema.sql` or `seed.sql` over an existing installation.

### Existing version 1.1.0

Run only:

```text
database/migrations/002_upgrade_v1_2_0.sql
```

Then run the read-only verification script:

```text
database/migrations/verify_002_upgrade_v1_2_0.sql
```

### Existing version 1.0.0

Run in order:

```text
1. database/migrations/001_upgrade_v1_1_0.sql
2. database/migrations/002_upgrade_v1_2_0.sql
3. database/migrations/verify_002_upgrade_v1_2_0.sql
```

The ordered migrations preserve existing records and add shared patients, appointments, queue, follow-ups, employee patients, Doctor sign-off, inventory controls, corrections, measurements, private attachments, landing galleries, versioned policy acceptance, record archives, and idempotency records.

See `UPGRADE_v1.2.0.md` for backup, application replacement, validation, and rollback instructions.

## Fresh development database

Start MySQL/MariaDB through XAMPP and import in this order:

```text
1. database/schema.sql
2. database/seed.sql
3. database/migrations/001_upgrade_v1_1_0.sql
4. database/migrations/002_upgrade_v1_2_0.sql
```

`schema.sql` intentionally recreates `kld_school_emr`; never use it as an upgrade script.

## DBeaver connection

```text
Server: 127.0.0.1
Port: 3306
Database: kld_school_emr
Username: root (or the configured local account)
Password: the configured XAMPP MySQL/MariaDB password
```

Use **SQL Editor → Open SQL Script** and execute the entire selected file.

## phpMyAdmin

Open `http://localhost/phpmyadmin`, select/import the appropriate SQL file, and ensure the active database is `kld_school_emr` before applying a migration.

## Verification queries

```sql
SELECT version, description, applied_at
FROM schema_migrations
ORDER BY applied_at DESC;

SELECT setting_value
FROM system_settings
WHERE setting_key = 'system_version';

SELECT document_type, version, status, published_at
FROM policy_documents
WHERE status = 'PUBLISHED'
ORDER BY document_type;

SELECT
  (SELECT COUNT(*) FROM students) AS students,
  (SELECT COUNT(*) FROM patients WHERE patient_type = 'STUDENT') AS student_patients,
  (SELECT COUNT(*) FROM visits WHERE patient_id IS NULL) AS visits_missing_patient,
  (SELECT COUNT(*) FROM consultations WHERE patient_id IS NULL) AS consultations_missing_patient,
  (SELECT COUNT(*) FROM medicine_issuances WHERE patient_id IS NULL) AS issuances_missing_patient;
```

Expected latest migration: `002_upgrade_v1_2_0`. Expected system version: `1.2.0`. Existing clinical rows should remain linked and readable.

## Backup and rollback

The project includes:

```text
scripts/backup-local.ps1
scripts/restore-local.ps1
docs/backup-and-restore.md
```

Use a full structure-and-data SQL export plus an uploads backup before migration. If rollback is necessary, restore the pre-upgrade dump and previous application source. Do not manually delete clinical migration columns or tables from a live database.
