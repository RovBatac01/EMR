import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const projectRoot = path.resolve(serverRoot, '..');
const readProject = (relative) => fs.readFileSync(path.join(projectRoot, relative), 'utf8');
const readServer = (relative) => fs.readFileSync(path.join(serverRoot, relative), 'utf8');

test('v1.2 migration is incremental and adds policy, gallery, archive, and idempotency structures', () => {
  const migration = readProject('database/migrations/002_upgrade_v1_2_0.sql');
  assert.doesNotMatch(migration, /DROP\s+DATABASE/i);
  assert.doesNotMatch(migration, /TRUNCATE\s+TABLE/i);
  for (const table of ['landing_content_media', 'policy_documents', 'policy_acceptances', 'archive_events', 'api_idempotency_keys']) {
    assert.match(migration, new RegExp(`CREATE TABLE IF NOT EXISTS ${table}`));
  }
  assert.match(migration, /archived_at/);
  assert.match(migration, /archive_reason/);
  assert.match(migration, /system_version','1\.2\.0/);
});

test('policy acceptance is enforced by the backend and versioned publications are immutable', () => {
  const auth = readServer('routes/auth.js');
  const policies = readServer('routes/policies.js');
  assert.match(auth, /POLICY_ACCEPTANCE_REQUIRED/);
  assert.match(auth, /policy_acceptances/);
  assert.match(auth, /ACCEPT_PRIVACY_POLICY/);
  assert.match(auth, /ACCEPT_TERMS_AND_CONDITIONS/);
  assert.match(policies, /Published policy versions are immutable/);
  assert.match(policies, /Users must accept this version at their next login/);
});

test('login exposes readable pre-authentication policy links and separate acknowledgments', () => {
  const login = readProject('client/src/pages/auth/LoginPage.jsx');
  const app = readProject('client/src/App.jsx');
  assert.match(login, /Privacy Policy/);
  assert.match(login, /Terms and Conditions/);
  assert.match(login, /privacyAccepted/);
  assert.match(login, /termsAccepted/);
  assert.match(app, /path="\/privacy"/);
  assert.match(app, /path="\/terms"/);
});

test('landing page supports responsive sections, image galleries, and safe media replacement', () => {
  const route = readServer('routes/publicLanding.js');
  const landing = readProject('client/src/pages/public/LandingPage.jsx');
  const detail = readProject('client/src/pages/public/AnnouncementDetailPage.jsx');
  assert.match(route, /landing_content_media/);
  assert.match(route, /removeHeroMedia/);
  assert.match(route, /removeFallbackImage/);
  assert.match(route, /Upload a .* when changing the hero media type/);
  assert.match(route, /insertMedia/);
  assert.match(landing, /id="services"/);
  assert.match(landing, /id="about"/);
  assert.match(detail, /Image Gallery/);
  assert.match(detail, /aria-modal="true"/);

  const parentInsert = route.indexOf('INSERT INTO landing_content_items');
  const mediaInsert = route.indexOf('const mediaRows = await insertMedia(connection, id');
  assert.ok(parentInsert >= 0 && mediaInsert > parentInsert, 'The parent post must be inserted before gallery rows to satisfy the foreign key.');
});

test('archive endpoints preserve records and block unresolved operational work', () => {
  const archives = readServer('routes/archives.js');
  assert.match(archives, /activeAppointments/);
  assert.match(archives, /openVisits/);
  assert.match(archives, /activeFollowUps/);
  assert.match(archives, /pendingAdjustments/);
  assert.match(archives, /openStockCounts/);
  assert.match(archives, /stock will remain unchanged/i);
  assert.match(archives, /ARCHIVE_PATIENT/);
  assert.match(archives, /UNARCHIVE_PATIENT/);
  assert.match(archives, /ARCHIVE_MEDICINE/);
  assert.match(archives, /UNARCHIVE_MEDICINE/);
  assert.doesNotMatch(archives, /DELETE\s+FROM\s+(patients|medicines)/i);
});

test('active selections exclude archived patients and medicines while history routes remain readable', () => {
  const patients = readServer('routes/patients.js');
  const medicines = readServer('routes/medicines.js');
  const issuance = readServer('routes/medicineIssuance.js');
  assert.match(patients, /p\.archived_at IS NULL/);
  assert.match(medicines, /m\.archived_at IS NULL/);
  assert.match(issuance, /patient\.archived_at/);
  assert.match(issuance, /medicine\.archived_at/);
  assert.match(patients, /Archived patient records are read-only/);
  assert.match(medicines, /Archived medicines are read-only/);
});

test('consultation creation, medicine issuance, and stock receipt use stable idempotency keys', () => {
  const consultations = readServer('routes/consultations.js');
  const issuance = readServer('routes/medicineIssuance.js');
  const medicines = readServer('routes/medicines.js');
  const consultationForm = readProject('client/src/pages/clinic/ConsultationFormPage.jsx');
  const issuanceForm = readProject('client/src/pages/clinic/MedicineIssuancePage.jsx');
  const medicineDetail = readProject('client/src/pages/clinic/MedicineDetailPage.jsx');
  assert.match(consultations, /CONSULTATION_CREATE/);
  assert.match(issuance, /MEDICINE_ISSUANCE/);
  assert.match(medicines, /MEDICINE_RECEIPT/);
  assert.match(consultationForm, /idempotencyKey/);
  assert.match(issuanceForm, /idempotencyKey/);
  assert.match(medicineDetail, /idempotencyKey/);
});

test('explicit medicine batches are filtered for positive, unexpired stock at the database level', () => {
  const issuance = readServer('routes/medicineIssuance.js');
  assert.match(issuance, /id = \? AND medicine_id = \? AND quantity > 0 AND expiration_date >= CURDATE\(\)/);
  assert.match(issuance, /status = 'COMPLETED' FOR UPDATE/);
});

test('permission checks exist in both client routing and backend routes', () => {
  const app = readProject('client/src/App.jsx');
  const protectedRoute = readProject('client/src/routes/ProtectedRoute.jsx');
  const archives = readServer('routes/archives.js');
  const policies = readServer('routes/policies.js');
  const landing = readServer('routes/publicLanding.js');
  assert.match(protectedRoute, /permissions\.every/);
  assert.match(app, /permissions=\{\['archives\.read'\]\}/);
  assert.match(app, /permissions=\{\['policies\.manage'\]\}/);
  assert.match(app, /permissions=\{\['landing\.manage'\]\}/);
  assert.match(archives, /authorize\('archives\.read'\)/);
  assert.match(policies, /authorize\('policies\.manage'\)/);
  assert.match(landing, /authorize\('landing\.manage'\)/);
});

test('backup and restore tools cover both MySQL and uploaded files without embedding credentials', () => {
  const backup = readProject('scripts/backup-local.ps1');
  const restore = readProject('scripts/restore-local.ps1');
  assert.match(backup, /mysqldump/);
  assert.match(backup, /server.*uploads|uploadPath/s);
  assert.match(backup, /defaults-extra-file/);
  assert.match(restore, /Expand-Archive/);
  assert.match(restore, /RestoreUploads/);
  assert.match(restore, /ShouldProcess/);
  assert.doesNotMatch(backup + restore, /Demo@12345|JWT_SECRET=/);
});

test('new appointment, visit, and issuance transactions lock patients before archive checks', () => {
  const patientService = readServer('services/patients/patientService.js');
  const appointments = readServer('routes/appointments.js');
  const visits = readServer('routes/visits.js');
  const issuance = readServer('routes/medicineIssuance.js');
  assert.match(patientService, /getPatientForStudentUser\(connection, userId, \{ forUpdate = false \}/);
  assert.match(patientService, /forUpdate \? ' FOR UPDATE' : ''/);
  assert.match(appointments, /getPatientForStudentUser\(connection, req\.user\.id, \{ forUpdate: true \}\)/);
  assert.match(appointments, /getPatientById\(connection, submittedPatientId, \{ forUpdate: true \}\)/);
  assert.match(visits, /resolvePatient\(connection, data, \{ forUpdate: true \}\)/);
  assert.match(issuance, /resolvePatient\(connection, data, \{ forUpdate: true \}\)/);
});

