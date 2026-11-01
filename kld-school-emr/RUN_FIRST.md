# Run First — Version 1.2.0

## Upgrade an existing 1.1.0 installation

1. Stop the current Node/Vite processes.
2. Back up the complete `kld_school_emr` database and `server/uploads/`.
3. Preserve the working `server/.env` file.
4. Extract this release into a new folder.
5. Copy the preserved `server/.env` and merge the existing uploads into the new folder.
6. Run `npm run install:all`.
7. Import **only** `database/migrations/002_upgrade_v1_2_0.sql` into the existing database.
8. Run `database/migrations/verify_002_upgrade_v1_2_0.sql`.
9. Run `npm run verify:source`, `npm test`, and `npm run build`.
10. Start with `npm run dev`, then run `npm run smoke` in another terminal.
11. Complete `COMPLETION_CHECKLIST_v1.2.0.md` before rollout.

Do not import `schema.sql` or `seed.sql` over an existing installation.

## Upgrade an older 1.0.0 installation

Apply the migrations in order:

```text
1. database/migrations/001_upgrade_v1_1_0.sql
2. database/migrations/002_upgrade_v1_2_0.sql
```

## Fresh development installation

1. Start MySQL/MariaDB in XAMPP.
2. Import `database/schema.sql`.
3. Import `database/seed.sql`.
4. Import `database/migrations/001_upgrade_v1_1_0.sql`.
5. Import `database/migrations/002_upgrade_v1_2_0.sql`.
6. Copy `server/.env.example` to `server/.env` and configure database, JWT, cookie, and SMTP values.
7. Optionally copy `client/.env.example` to `client/.env`.
8. Run `npm run install:all`.
9. Run `npm run dev`.
10. Open `http://localhost:5173`.

XAMPP supplies MySQL/MariaDB only. Node.js runs the API and Vite runs React. The project does not need to be placed under `htdocs`.
