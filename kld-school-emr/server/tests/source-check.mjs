import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const required = [
  'server.js',
  'config/db.js',
  'middleware/requestId.js',
  'utils/audit.js',
  'utils/fileSignatures.js',
  'services/patients/patientService.js',
  'routes/auth.js',
  'routes/students.js',
  'routes/patients.js',
  'routes/visits.js',
  'routes/consultations.js',
  'routes/appointments.js',
  'routes/queue.js',
  'routes/followUps.js',
  'routes/medicines.js',
  'routes/medicineIssuance.js',
  'routes/inventoryControl.js',
  'routes/patientCorrections.js',
  'routes/attachments.js',
  'routes/publicLanding.js',
  'routes/policies.js',
  'routes/archives.js',
  'services/policies/policyService.js',
  'routes/staff.js',
  'routes/reports.js',
  'routes/settings.js'
];
for (const file of required) await fs.access(path.join(root, file));
console.log(`Source check passed for ${required.length} required backend files.`);
