# Database and Upload Backup / Restore

These commands are intended for an authorized system administrator on the Windows/XAMPP workstation. Stop the Node.js API before a restore. Never place backup archives in a public web directory.

## Create a complete backup

From the project root in PowerShell:

```powershell
.\scripts\backup-local.ps1
```

The script reads `server/.env`, invokes XAMPP's `mysqldump`, copies `server/uploads`, writes a manifest, and creates a timestamped ZIP under `backups/`. It reports a non-zero exit code and a clear error when any required step fails.

A custom destination may be supplied:

```powershell
.\scripts\backup-local.ps1 -Destination "D:\SecureBackups\KLD-EMR"
```

Restrict the destination folder to authorized administrators and copy backups to an encrypted secondary location according to school policy.

## Restore in a separate verification environment first

1. Copy the application to a separate workstation or isolated XAMPP instance.
2. Configure `server/.env` for the test database service.
3. Stop the API.
4. Run:

```powershell
.\scripts\restore-local.ps1 -BackupZip "D:\SecureBackups\KLD-EMR\kld-school-emr-YYYYMMDD-HHMMSS.zip" -RestoreUploads
```

PowerShell requests confirmation because restoration replaces database contents. To run in a controlled scripted process, add `-Force`.

5. Start the application and run:

```powershell
npm run smoke
```

6. Confirm login, patient history, consultation records, medicine stock, attachments, reports, and audit logs before using the same procedure in the live localhost environment.

The restore script makes a safety copy of the existing uploads directory before copying restored uploads. It does not silently delete that safety copy.
