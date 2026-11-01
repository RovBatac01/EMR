# Validation Report — KLD School EMR 1.2.0

## Release identity

- **Project:** KLD School Electronic Medical Records and Student Clinic Portal
- **Version:** 1.2.0
- **Release type:** non-destructive incremental upgrade from 1.1.0
- **Validation date:** November 1, 2026
- **Architecture:** React/Vite + Express/Node.js + MySQL/MariaDB through XAMPP
- **Migration:** `database/migrations/002_upgrade_v1_2_0.sql`

## Scope inspected

The uploaded v1.1.0 source was reviewed and extended without replacing its required technology stack. The upgrade adds:

- redesigned public landing experience;
- announcement/promotion galleries;
- reliable hero image/video management;
- versioned Privacy Policy and Terms acceptance;
- patient and medicine archive/unarchive workflows;
- dedicated Archives administration;
- high-consequence request idempotency;
- patient/archive transaction locking;
- enhanced reporting and export auditing;
- database/upload backup and restore utilities;
- ordered non-destructive migration and verification SQL.

## Completed automated validation

| Validation | Result |
|---|---:|
| Clean-package static validation | PASS — 246 checks |
| Backend/build-script syntax | PASS — 49 files |
| Node automated tests | PASS — 20/20 |
| Source AST parse | PASS — 131 files |
| Import integrity | PASS — 936 imports, 0 unresolved relatives |
| Lucide icon exports | PASS — 0 invalid imports |
| Duplicate object keys | PASS — 0 |
| Final package secret/artifact hygiene | PASS — no actual `.env`, `node_modules`, `client/dist`, or user-uploaded medical/landing files |
| ZIP/TAR integrity and clean extraction | PASS — ZIP and TAR.GZ integrity, manifest verification, clean extraction, 246 static checks, and 20 Node tests |

Raw generated logs are included under `validation-logs/` in the release.

## Migration validation

The v1.2 migration was statically checked for the following:

- no `DROP DATABASE`;
- no `TRUNCATE TABLE`;
- no deletion or replacement of existing clinical records;
- safe-if-missing column/index/foreign-key helper procedures;
- conversion of existing single post images into gallery records;
- versioned policy-document and acceptance tables;
- archive metadata and actor foreign keys on patients and medicines;
- append-only archive event records;
- unique idempotency key per user/scope/key;
- new permission seeds and administrator role grants;
- system version and schema-migration marker;
- restoration of `FOREIGN_KEY_CHECKS` and removal of temporary procedures.

A read-only verification script checks the migration marker, system version, required tables/columns/indexes/permissions, current legal documents, and clinical-record totals after migration.

## Security and authorization validation

Source and contract tests confirm:

- policy acceptance is enforced before session creation;
- the exact accepted document ID/version is persisted and audited;
- published legal versions are immutable;
- landing management, policy management, archive viewing, archive, and unarchive require backend permissions;
- corresponding frontend routes/actions are permission-aware but are not treated as the security boundary;
- archived patients and medicines are blocked from new transactions;
- historical records remain readable through permission-controlled clinical routes;
- medical uploads remain private and authenticated;
- report exports are audited;
- user credentials, JWTs, and private environment variables are not included in the release package.

## Data-integrity validation

Source-level checks confirm:

- archiving updates metadata/status instead of deleting patients or medicines;
- medicine archive never modifies a batch quantity;
- unarchive restores the original row and ID;
- duplicate/conflict rules execute before restoration;
- patient archive checks active appointments, open visits, and active follow-ups;
- medicine archive checks pending/applied adjustments and open/submitted stock counts;
- patient rows are locked before new appointment, visit, or issuance archive-state checks;
- medicine rows and batches are locked for receipt, issuance, adjustment, and archive operations;
- consultation creation, medicine issuance, and stock receipt use unique backend idempotency records;
- expired/empty stock is excluded in the batch-lock SQL;
- issuance voiding is limited to a locked `COMPLETED` record so stock is restored only once.

## Frontend validation

The React application source passed parser and import checks for:

- public navigation, landing sections, announcements, details, galleries, and public policies;
- login policy prompt and separate checkboxes;
- landing/media administration;
- policy administration;
- archives search/filter/pagination/restore;
- patient and medicine archive confirmations;
- reports, filters, exports, loading, empty, success, and error states;
- route permission wrappers;
- valid Lucide React icons;
- cleanup of new preview object URLs and guarded asynchronous policy loading.

## Defects found and corrected during validation

1. **Landing gallery foreign-key order:** gallery records were initially at risk of being inserted before the parent post. The parent now commits first inside the same transaction.
2. **Hero validation duplicate branch:** a duplicated throw statement was removed.
3. **Landing deletion atomicity:** post deletion and its audit entry now share a transaction; stored files are removed only after commit.
4. **Explicit medicine batch eligibility:** the locking SQL now excludes expired and empty batches, not only the subsequent JavaScript check.
5. **Archive/new-transaction race:** patient lookup now supports `FOR UPDATE`, and appointment, visit, and issuance creation lock the patient before checking archive status.
6. **Duplicate object key:** a repeated archive error-code property was removed.
7. **Package metadata:** accidental circular `file:..` self-dependencies were removed from client/server package manifests and lockfiles.
8. **Saved-versus-refresh state:** landing administration now reports when persistence succeeded but the follow-up refresh failed.

## Build-environment limitations

The build container does not contain the user's XAMPP/MySQL database or SMTP account. The uploaded dependency directories were Windows-generated/incomplete; specifically, the Linux Rollup optional native package directory was empty. The npm registry was unreachable (`EAI_AGAIN`), so a clean platform-specific install could not be performed.

Accordingly, this report does **not** claim:

- live execution of the migration against the user's existing database;
- live API-to-MySQL integration or smoke tests;
- real simultaneous MySQL transaction tests;
- a successful installed-dependency Vite production build in this container;
- browser/device/accessibility runtime testing;
- real SMTP delivery;
- successful backup restoration in a separate environment.

These are explicitly marked Pending in `COMPLETION_CHECKLIST_v1.2.0.md` and `TEST_RESULTS_v1.2.0.md`.

## Required target-workstation commands

After backing up, preserving `server/.env` and `server/uploads/`, installing clean dependencies, and applying migration 002:

```powershell
npm run verify:source
npm test
npm run build
npm run dev
npm run smoke
```

Then complete every Pending acceptance item, including direct unauthorized API calls, simultaneous capacity and inventory operations, archive/unarchive preservation comparisons, policy reacceptance, media refresh persistence, real SMTP, and a separate-environment restore.

## Validation conclusion

The v1.2.0 source, migration design, frontend/backend integration contracts, permissions, audit hooks, archive preservation rules, and reliability safeguards pass the completed automated checks. The release remains subject to the clearly identified target-workstation acceptance tests before use with production medical information.
