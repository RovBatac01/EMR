# Rebuild Notes

The uploaded C-Spot project was inspected as a functional reference. It was a PHP/MySQL application with clinic modules for patients, visits, consultations, medicines, staff, reports, activity logs, and settings.

This delivery is a new implementation rather than a PHP patch:

- New React/Vite frontend
- New Express REST API
- New normalized `kld_school_emr` database
- New JWT cookie session model
- New KLD visual design
- New student portal and activation workflow
- New forms and queued-email subsystems
- New transaction-safe medicine-batch workflow

No old clinical record is imported automatically. This prevents accidental mixing of legacy data with the fresh development schema. A separate, reviewed migration should be written before transferring any authorized real records.
