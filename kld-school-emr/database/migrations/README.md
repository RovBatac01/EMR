# Database Migrations

Back up the database and uploaded files before every migration. Apply migrations in filename order.

## Existing installation

### From version 1.0.0

```text
1. 001_upgrade_v1_1_0.sql
2. 002_upgrade_v1_2_0.sql
```

### From version 1.1.0

```text
1. 002_upgrade_v1_2_0.sql
```

Do not import `schema.sql` or `seed.sql` during an upgrade.

## Fresh development database

```text
1. database/schema.sql
2. database/seed.sql
3. database/migrations/001_upgrade_v1_1_0.sql
4. database/migrations/002_upgrade_v1_2_0.sql
```

`schema.sql` intentionally recreates the database and is therefore for fresh installations only.

## 001_upgrade_v1_1_0.sql

Adds the shared student/employee patient model, public landing foundation, appointments, queue, follow-ups, Doctor sign-off, inventory controls, correction requests, measurements, private attachments, and expanded audit metadata while preserving existing records.

See `UPGRADE_v1.1.0.md` when upgrading a 1.0.0 installation.

## 002_upgrade_v1_2_0.sql

Adds:

- announcement and promotion publication dates and multi-image galleries;
- versioned Privacy Policy and Terms documents;
- per-user document acceptance history;
- patient and medicine archive metadata and event history;
- archive, unarchive, policy-management, and archive-view permissions;
- generic idempotency records for consultation creation, medicine issuance, and stock receipt;
- system version 1.2.0.

The migration contains no `DROP DATABASE` or `TRUNCATE TABLE` operation.

See `UPGRADE_v1.2.0.md` for the complete procedure.

## Post-migration verification

Run:

```text
database/migrations/verify_002_upgrade_v1_2_0.sql
```

This script is read-only. It verifies the version marker, new tables, archive columns, permissions, published documents, and current clinical record totals.

## Validation commands

```powershell
npm run verify:source
npm test
npm run build
npm run dev
npm run smoke
```

## Rollback policy

Restore the pre-upgrade database dump, project folder, `server/.env`, and `server/uploads/`. Do not attempt an ad-hoc reverse migration on clinical data.
