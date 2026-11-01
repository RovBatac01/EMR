import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const projectRoot = path.resolve(serverRoot, '..');
const readProject = (relative) => fs.readFileSync(path.join(projectRoot, relative), 'utf8');
const readServer = (relative) => fs.readFileSync(path.join(serverRoot, relative), 'utf8');

test('private medical uploads are not exposed through a generic static directory', () => {
  const server = readServer('server.js');
  assert.doesNotMatch(server, /app\.use\('\/uploads'\s*,/);
  assert.match(server, /'\/uploads\/branding'/);
  assert.match(server, /'\/uploads\/landing'/);
  assert.match(server, /'\/api\/attachments'/);
});

test('consultation clinical completion requires an active licensed doctor', () => {
  const source = readServer('routes/consultations.js');
  assert.match(source, /role_code\s*!==\s*'DOCTOR'/);
  assert.match(source, /professional_license_number/);
  assert.match(source, /license_expiration_date/);
  assert.match(source, /signed_off_at/);
  assert.match(source, /released_at/);
});

test('medicine creation accepts a blank optional category and returns field errors', () => {
  const backend = readServer('routes/medicines.js');
  const frontend = readProject('client/src/pages/clinic/MedicineFormPage.jsx');
  assert.match(backend, /categoryId:\s*z\.preprocess/);
  assert.match(frontend, /categoryId:form\.categoryId\s*\|\|\s*null/);
  assert.match(frontend, /fieldErrors\(e\)/);
});

test('appointment booking has capacity locking, booking windows, and idempotency', () => {
  const source = readServer('routes/appointments.js');
  assert.match(source, /withTransaction/);
  assert.match(source, /FOR UPDATE/i);
  assert.match(source, /slot_capacity/);
  assert.match(source, /minimum_notice_hours/);
  assert.match(source, /advance_booking_days/);
  assert.match(source, /idempotency_key/);
});

test('inventory reconciliation rejects a stale physical count', () => {
  const source = readServer('routes/inventoryControl.js');
  assert.match(source, /FOR UPDATE/i);
  assert.match(source, /before_quantity/);
  assert.match(source, /stock changed after the physical count was submitted/i);
});

test('the upgrade migration preserves students while introducing shared patients', () => {
  const migration = readProject('database/migrations/001_upgrade_v1_1_0.sql');
  assert.match(migration, /CREATE TABLE IF NOT EXISTS schema_migrations/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS patients/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS employees/);
  assert.match(migration, /INSERT IGNORE INTO patients/);
  assert.match(migration, /UPDATE visits SET patient_id = student_id/);
  assert.match(migration, /UPDATE consultations SET patient_id = student_id/);
  assert.doesNotMatch(migration, /DROP\s+DATABASE/i);
  assert.doesNotMatch(migration, /TRUNCATE\s+TABLE/i);
});

test('consultation pages include a global error boundary and explicit recovery states', () => {
  const main = readProject('client/src/main.jsx');
  const detail = readProject('client/src/pages/clinic/ConsultationDetailPage.jsx');
  const form = readProject('client/src/pages/clinic/ConsultationFormPage.jsx');
  assert.match(main, /AppErrorBoundary/);
  assert.match(detail + form, /LoadingScreen/);
  assert.match(detail + form, /Alert/);
  assert.match(detail + form, /try\s*\{/);
});

test('record viewing, medical downloads, and report exports are audited', () => {
  const patientRoute = readServer('routes/patients.js');
  const attachmentRoute = readServer('routes/attachments.js');
  const reportRoute = readServer('routes/reports.js');
  assert.match(patientRoute, /auditRecordAccess/);
  assert.match(attachmentRoute, /DOWNLOAD_MEDICAL_ATTACHMENT/);
  assert.match(reportRoute, /EXPORT_REPORT/);
});
