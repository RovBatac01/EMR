import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const notices = [];
const pass = (message) => notices.push(`PASS  ${message}`);
const fail = (message) => failures.push(`FAIL  ${message}`);

function exists(relative) {
  return fs.existsSync(path.join(root, relative));
}

function read(relative) {
  return fs.readFileSync(path.join(root, relative), 'utf8');
}

function requireFiles(files) {
  for (const file of files) exists(file) ? pass(`Required file: ${file}`) : fail(`Missing required file: ${file}`);
}

function parseJson(relative) {
  try {
    return JSON.parse(read(relative));
  } catch (error) {
    fail(`${relative} is not valid JSON: ${error.message}`);
    return {};
  }
}

function countInsertRows(sql, table) {
  const pattern = new RegExp(`INSERT\\s+INTO\\s+${table}\\s*\\([^;]+?\\)\\s*VALUES\\s*([\\s\\S]*?);`, 'gi');
  let match;
  let total = 0;
  while ((match = pattern.exec(sql))) {
    const body = match[1];
    let depth = 0;
    let quote = null;
    let escaped = false;
    for (let i = 0; i < body.length; i += 1) {
      const ch = body[i];
      if (quote) {
        if (escaped) escaped = false;
        else if (ch === '\\') escaped = true;
        else if (ch === quote) {
          if (body[i + 1] === quote) i += 1;
          else quote = null;
        }
        continue;
      }
      if (ch === "'" || ch === '"') {
        quote = ch;
        continue;
      }
      if (ch === '(') {
        if (depth === 0) total += 1;
        depth += 1;
      } else if (ch === ')') depth = Math.max(0, depth - 1);
    }
  }
  return total;
}

requireFiles([
  'package.json',
  'README.md',
  'RUN_FIRST.md',
  'client/package.json',
  'client/vite.config.js',
  'client/tailwind.config.js',
  'client/src/App.jsx',
  'client/src/pages/auth/ChangePasswordPage.jsx',
  'client/src/pages/clinic/SettingsPage.jsx',
  'client/src/pages/student/StudentDashboardPage.jsx',
  'client/src/pages/student/MyAppointmentsPage.jsx',
  'client/src/pages/public/LandingPage.jsx',
  'client/src/pages/public/PublicQueuePage.jsx',
  'client/src/pages/admin/LandingContentPage.jsx',
  'client/src/pages/admin/PolicyManagementPage.jsx',
  'client/src/pages/clinic/ArchivesPage.jsx',
  'client/src/pages/public/AnnouncementsPage.jsx',
  'client/src/pages/public/AnnouncementDetailPage.jsx',
  'client/src/pages/public/PolicyDocumentPage.jsx',
  'client/src/components/PublicHeader.jsx',
  'client/src/components/PublicFooter.jsx',
  'client/src/pages/clinic/AppointmentsPage.jsx',
  'client/src/pages/clinic/AppointmentSchedulesPage.jsx',
  'client/src/pages/clinic/QueuePage.jsx',
  'client/src/pages/clinic/FollowUpsPage.jsx',
  'client/src/pages/clinic/MedicineCategoriesPage.jsx',
  'client/src/pages/clinic/InventoryControlPage.jsx',
  'client/src/pages/clinic/CorrectionRequestsPage.jsx',
  'client/src/pages/clinic/EmployeeCategoriesPage.jsx',
  'client/src/components/AppErrorBoundary.jsx',
  'server/package.json',
  'server/server.js',
  'server/routes/auth.js',
  'server/routes/students.js',
  'server/routes/visits.js',
  'server/routes/consultations.js',
  'server/routes/medicines.js',
  'server/routes/medicineIssuance.js',
  'server/routes/settings.js',
  'server/routes/publicLanding.js',
  'server/routes/policies.js',
  'server/routes/archives.js',
  'server/services/policies/policyService.js',
  'server/routes/patients.js',
  'server/routes/appointments.js',
  'server/routes/queue.js',
  'server/routes/followUps.js',
  'server/routes/inventoryControl.js',
  'server/routes/patientCorrections.js',
  'server/routes/attachments.js',
  'server/utils/audit.js',
  'server/utils/fileSignatures.js',
  'database/schema.sql',
  'database/seed.sql',
  'database/migrations/001_upgrade_v1_1_0.sql',
  'database/migrations/002_upgrade_v1_2_0.sql',
  'database/migrations/verify_002_upgrade_v1_2_0.sql',
  'CHANGELOG.md',
  'UPGRADE_v1.1.0.md',
  'UPGRADE_v1.2.0.md',
  'COMPLETION_CHECKLIST_v1.2.0.md',
  'docs/backup-and-restore.md',
  'scripts/backup-local.ps1',
  'scripts/restore-local.ps1',
  'TEST_RESULTS.md',
  'TEST_RESULTS_v1.2.0.md',
  'VALIDATION_REPORT.md',
  'VALIDATION_REPORT_v1.2.0.md',
  'VERSION',
  'server/.env.example',
  'client/.env.example'
]);

const rootPackage = parseJson('package.json');
const serverPackage = parseJson('server/package.json');
const clientPackage = parseJson('client/package.json');

for (const [name, pkg] of [['root', rootPackage], ['server', serverPackage], ['client', clientPackage]]) {
  pkg.version === '1.2.0' ? pass(`${name} package version is 1.2.0`) : fail(`${name} package version is not 1.2.0`);
}
for (const [name, pkg] of [['server', serverPackage], ['client', clientPackage]]) {
  pkg.dependencies?.['kld-school-emr']
    ? fail(`${name} package contains an accidental circular file dependency on the root project`)
    : pass(`${name} package has no circular root-project dependency`);
}
read('VERSION').trim() === '1.2.0' ? pass('VERSION file is 1.2.0') : fail('VERSION file is not 1.2.0');

const requiredClient = ['react', 'react-dom', 'react-router-dom', 'axios', 'lucide-react', 'recharts', 'framer-motion', 'three', '@react-three/fiber'];
for (const dependency of requiredClient) {
  clientPackage.dependencies?.[dependency]
    ? pass(`Frontend dependency declared: ${dependency}`)
    : fail(`Frontend dependency missing: ${dependency}`);
}

const requiredServer = ['express', 'mysql2', 'bcrypt', 'jsonwebtoken', 'nodemailer', 'multer', 'zod', 'helmet', 'express-rate-limit', 'cors'];
for (const dependency of requiredServer) {
  serverPackage.dependencies?.[dependency]
    ? pass(`Backend dependency declared: ${dependency}`)
    : fail(`Backend dependency missing: ${dependency}`);
}

rootPackage.scripts?.dev ? pass('Root development command is defined') : fail('Root development command is missing');
rootPackage.scripts?.build ? pass('Root build command is defined') : fail('Root build command is missing');

const releaseMode = process.argv.includes('--release');
const forbiddenEnv = ['.env', 'server/.env', 'client/.env'];

for (const file of forbiddenEnv) {
  if (releaseMode) {
    if (exists(file)) {
      fail(`Secret-bearing file must not be distributed: ${file}`);
    } else {
      pass(`No distributed secret file: ${file}`);
    }
  } else {
    pass(
      exists(file)
        ? `Local environment file allowed: ${file}`
        : `Optional local environment file absent: ${file}`
    );
  }
}

const schema = read('database/schema.sql');
const seed = read('database/seed.sql');
const migration = read('database/migrations/001_upgrade_v1_1_0.sql');
const migrationV12 = read('database/migrations/002_upgrade_v1_2_0.sql');
const tables = [...schema.matchAll(/CREATE\s+TABLE\s+`?([A-Za-z0-9_]+)`?\s*\(/gi)].map((match) => match[1]);
const uniqueTables = new Set(tables);
uniqueTables.size >= 30 ? pass(`Normalized schema contains ${uniqueTables.size} base tables`) : fail(`Schema contains only ${uniqueTables.size} base tables`);

for (const table of [
  'users', 'roles', 'permissions', 'user_sessions', 'students', 'student_accounts',
  'visits', 'consultations', 'vital_signs', 'medicines', 'medicine_batches',
  'medicine_issuances', 'medicine_issuance_items', 'inventory_transactions', 'staff',
  'clinic_forms', 'form_submissions', 'notifications', 'email_queue', 'activity_logs', 'system_settings'
]) {
  uniqueTables.has(table) ? pass(`Database table: ${table}`) : fail(`Missing database table: ${table}`);
}

if (/DROP\s+DATABASE\s+IF\s+EXISTS\s+kld_school_emr/i.test(schema)) pass('Schema creates a fresh kld_school_emr database');
else fail('Schema does not initialize the fresh kld_school_emr database');
if (/FOREIGN\s+KEY/gi.test(schema)) pass('Schema declares foreign keys');
else fail('Schema has no foreign keys');
if (/CREATE\s+(?:OR\s+REPLACE\s+)?VIEW\s+v_medicine_inventory/i.test(schema)) pass('Medicine inventory view is present');
else fail('Medicine inventory view is missing');

const minimumSeedRows = {
  users: 6,
  staff: 5,
  students: 20,
  medicines: 15,
  visits: 30,
  consultations: 20,
  clinic_forms: 1,
  activity_logs: 5
};
for (const [table, minimum] of Object.entries(minimumSeedRows)) {
  const count = countInsertRows(seed, table);
  count >= minimum ? pass(`Seed ${table}: ${count} rows`) : fail(`Seed ${table}: ${count} rows; expected at least ${minimum}`);
}

for (const account of ['admin', 'clinic.admin', 'nurse.maria', 'clinic.paolo', 'viewer.noel', 'student.ava']) {
  seed.includes(`'${account}'`) ? pass(`Development account seeded: ${account}`) : fail(`Development account missing: ${account}`);
}

const server = read('server/server.js');
for (const route of ['/api/public', '/api/patients', '/api/appointments', '/api/queue', '/api/follow-ups', '/api/inventory-control', '/api/patient-corrections', '/api/attachments', '/api/auth', '/api/students', '/api/visits', '/api/consultations', '/api/medicines', '/api/medicine-issuance', '/api/settings', '/api/student-portal', '/api/policies', '/api/archives']) {
  server.includes(route) ? pass(`REST route mounted: ${route}`) : fail(`REST route not mounted: ${route}`);
}

const settingsRoute = read('server/routes/settings.js');
const settingsPage = read('client/src/pages/clinic/SettingsPage.jsx');
for (const setting of ['school_name', 'clinic_name', 'institutional_logo', 'clinic_contact', 'clinic_address']) {
  settingsRoute.includes(setting) || settingsPage.includes(setting)
    ? pass(`Configurable branding setting: ${setting}`)
    : fail(`Configurable branding setting missing: ${setting}`);
}
if (/multer/i.test(settingsRoute) && /logo/i.test(settingsRoute)) pass('Authorized clinic-logo upload endpoint is present');
else fail('Clinic-logo upload endpoint is missing');

const auth = read('server/routes/auth.js');
if (/bcrypt\.compare/.test(auth) && /bcrypt\.hash/.test(auth)) pass('bcrypt authentication and password hashing are implemented');
else fail('bcrypt authentication implementation is incomplete');
if (/res\.cookie/.test(auth) && /httpOnly:\s*true/.test(auth)) pass('JWT is issued through an HTTP-only cookie');
else fail('HTTP-only authentication cookie is missing');
if (/requireCsrf/.test(auth)) pass('CSRF validation is applied to authentication mutations');
else fail('CSRF validation is missing from authentication mutations');

const issuance = read('server/routes/medicineIssuance.js');
if (/FOR UPDATE/i.test(issuance) && /withTransaction/.test(issuance)) pass('Medicine issuance uses a transaction and row locking');
else fail('Medicine issuance is not transaction-safe');
if (/expiration_date/i.test(issuance)) pass('Expired medicine validation is present');
else fail('Expired medicine validation is missing');

const portal = read('server/routes/studentPortal.js');
if (/req\.user\.student_id/.test(portal) && !/req\.params\.studentId/.test(portal)) pass('Student portal derives ownership from authenticated identity');
else fail('Student portal ownership validation requires review');


const migrationTables = [...migration.matchAll(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+`?([A-Za-z0-9_]+)`?/gi)].map((match) => match[1]);
for (const table of [
  'schema_migrations', 'landing_page_config', 'landing_content_items', 'employee_categories', 'employees',
  'patients', 'patient_measurements', 'medical_attachments', 'doctor_profiles', 'appointment_services',
  'clinic_schedules', 'clinic_unavailable_dates', 'appointments', 'appointment_status_history',
  'appointment_reminders', 'clinic_queue_entries', 'follow_ups', 'inventory_adjustment_requests',
  'stock_count_sessions', 'stock_count_items', 'patient_correction_requests'
]) {
  migrationTables.includes(table) ? pass(`Upgrade migration table: ${table}`) : fail(`Upgrade migration table missing: ${table}`);
}
for (const fragment of [
  "INSERT IGNORE INTO patients", "UPDATE visits SET patient_id = student_id", "UPDATE consultations SET patient_id = student_id",
  "INSERT IGNORE INTO roles (code, name, `rank`) VALUES ('DOCTOR'", "consultations.signoff", "schema_migrations",
  "system_version','1.1.0"
]) {
  migration.includes(fragment) ? pass(`Upgrade migration contract: ${fragment}`) : fail(`Upgrade migration contract missing: ${fragment}`);
}

if (/app\.use\('\/uploads'\s*,/.test(server)) fail('Entire upload directory is still publicly exposed');
else pass('Only allow-listed public upload directories are exposed');
if (server.includes("'/uploads/branding'") && server.includes("'/uploads/landing'") && server.includes('/api/attachments')) pass('Branding/landing media are public while attachments use an authenticated API');
else fail('Upload exposure contract is incomplete');

const consultationRoute = read('server/routes/consultations.js');
if (/role_code\s*!==\s*'DOCTOR'/.test(consultationRoute) && /professional_license_number/.test(consultationRoute) && /license_expiration_date/.test(consultationRoute)) pass('Consultation sign-off is restricted to an active licensed Doctor profile');
else fail('Doctor-only consultation sign-off contract is incomplete');
if (/signed_off_at/.test(consultationRoute) && /released_at/.test(consultationRoute)) pass('Clinical sign-off and patient release remain separate');
else fail('Clinical sign-off and patient release are not clearly separated');

const appointmentRoute = read('server/routes/appointments.js');
if (/withTransaction/.test(appointmentRoute) && /FOR UPDATE/i.test(appointmentRoute) && /slot_capacity/.test(appointmentRoute)) pass('Appointment booking uses transactions and capacity locks');
else fail('Appointment overbooking protection is incomplete');
if (/minimum_notice_hours/.test(appointmentRoute) && /advance_booking_days/.test(appointmentRoute) && /idempotency_key/.test(appointmentRoute)) pass('Appointment limits and duplicate-submission protection are enforced');
else fail('Appointment booking-limit/idempotency contract is incomplete');

const queueRoute = read('server/routes/queue.js');
if (/idempotency_key/.test(queueRoute) && /uq_queue_idempotency/.test(migration)) pass('Queue check-in duplicate protection is present');
else fail('Queue check-in duplicate protection is incomplete');

const inventoryRoute = read('server/routes/inventoryControl.js');
if (/FOR UPDATE/i.test(inventoryRoute) && /before_quantity/.test(inventoryRoute) && /stock changed after the physical count was submitted/i.test(inventoryRoute)) pass('Inventory reconciliation detects stale counts under row locks');
else fail('Inventory reconciliation concurrency contract is incomplete');

const correctionRoute = read('server/routes/patientCorrections.js');
if (/discriminatedUnion/.test(correctionRoute) && /CONFLICT/.test(correctionRoute) && /source_updated_at/.test(correctionRoute)) pass('Patient correction requests validate by type and detect record conflicts');
else fail('Patient correction workflow contract is incomplete');

const medicineRoute = read('server/routes/medicines.js');
const medicinePage = read('client/src/pages/clinic/MedicineFormPage.jsx');
if (/categoryId:\s*z\.preprocess/.test(medicineRoute) && /categoryId:form\.categoryId\s*\|\|\s*null/.test(medicinePage) && /fieldErrors/.test(medicinePage)) pass('Medicine creation handles blank categories and field-level errors consistently');
else fail('Medicine creation validation hotfix is incomplete');

const appEntry = read('client/src/main.jsx');
const consultationDetail = read('client/src/pages/clinic/ConsultationDetailPage.jsx');
const consultationForm = read('client/src/pages/clinic/ConsultationFormPage.jsx');
if (/AppErrorBoundary/.test(appEntry) && /LoadingScreen/.test(consultationDetail + consultationForm) && /Alert/.test(consultationDetail + consultationForm)) pass('Consultation screens have application, loading, empty, and error recovery paths');
else fail('Consultation white-screen protection is incomplete');

const attachmentRoute = read('server/routes/attachments.js');
if (/router\.use\(authenticate\)/.test(attachmentRoute) && /canAccess/.test(attachmentRoute) && /DOWNLOAD_MEDICAL_ATTACHMENT/.test(attachmentRoute) && /res\.download/.test(attachmentRoute)) pass('Medical attachment downloads are authenticated, ownership-checked, and audited');
else fail('Medical attachment download protection is incomplete');

const reportRoute = read('server/routes/reports.js');
if (/EXPORT_REPORT/.test(reportRoute)) pass('Report export access is audited');
else fail('Report export audit logging is missing');



// Version 1.2.0 upgrade contracts.
for (const table of ['landing_content_media', 'policy_documents', 'policy_acceptances', 'archive_events', 'api_idempotency_keys']) {
  migrationV12.includes(`CREATE TABLE IF NOT EXISTS ${table}`)
    ? pass(`v1.2 migration table: ${table}`)
    : fail(`v1.2 migration table missing: ${table}`);
}
for (const fragment of [
  "'policies.manage'", "'archives.read'", "'patients.archive'", "'patients.unarchive'",
  "'medicines.archive'", "'medicines.unarchive'", 'archived_at', 'archive_reason',
  "'002_upgrade_v1_2_0'", "'system_version','1.2.0'"
]) {
  migrationV12.includes(fragment)
    ? pass(`v1.2 migration contract: ${fragment}`)
    : fail(`v1.2 migration contract missing: ${fragment}`);
}
if (/DROP\s+DATABASE/i.test(migrationV12) || /TRUNCATE\s+TABLE/i.test(migrationV12)) fail('v1.2 migration contains a destructive reset operation');
else pass('v1.2 migration contains no database drop or table truncation');

const policiesRoute = read('server/routes/policies.js');
const archivesRoute = read('server/routes/archives.js');
const landingRouteV12 = read('server/routes/publicLanding.js');
const loginPageV12 = read('client/src/pages/auth/LoginPage.jsx');
const landingAdminV12 = read('client/src/pages/admin/LandingContentPage.jsx');
const archivesPageV12 = read('client/src/pages/clinic/ArchivesPage.jsx');
const appV12 = read('client/src/App.jsx');
const reportsV12 = read('server/routes/reports.js');

if (/POLICY_ACCEPTANCE_REQUIRED/.test(auth) && /policy_acceptances/.test(auth) && /ACCEPT_PRIVACY_POLICY/.test(auth) && /ACCEPT_TERMS_AND_CONDITIONS/.test(auth)) pass('Versioned policy acceptance is enforced and audited during login');
else fail('Versioned policy acceptance login contract is incomplete');
if (/Published policy versions are immutable/.test(policiesRoute) && /PUBLISH_POLICY_DOCUMENT/.test(policiesRoute)) pass('Policy publication is versioned, immutable, and audited');
else fail('Policy publication contract is incomplete');
if (/Privacy Policy/.test(loginPageV12) && /Terms and Conditions/.test(loginPageV12) && /privacyAccepted/.test(loginPageV12) && /termsAccepted/.test(loginPageV12)) pass('Pre-login policy links and separate acknowledgments are present');
else fail('Pre-login policy acknowledgment UI is incomplete');

if (/landing_content_media/.test(landingRouteV12) && /removeHeroMedia/.test(landingRouteV12) && /removeFallbackImage/.test(landingRouteV12) && /insertMedia/.test(landingRouteV12)) pass('Landing content supports safe hero replacement and multi-image galleries');
else fail('Landing media/gallery contract is incomplete');
if (/Saved successfully, but refresh failed/.test(landingAdminV12) && /onUploadProgress/.test(landingAdminV12) && /coverIndex/.test(landingAdminV12)) pass('Landing administration distinguishes refresh failures and supports upload progress/cover selection');
else fail('Landing administration reliability contract is incomplete');

for (const action of ['ARCHIVE_PATIENT','UNARCHIVE_PATIENT','ARCHIVE_MEDICINE','UNARCHIVE_MEDICINE']) {
  archivesRoute.includes(action) ? pass(`Archive audit action: ${action}`) : fail(`Archive audit action missing: ${action}`);
}
if (/activeAppointments/.test(archivesRoute) && /openVisits/.test(archivesRoute) && /activeFollowUps/.test(archivesRoute) && /pendingAdjustments/.test(archivesRoute) && /openStockCounts/.test(archivesRoute)) pass('Archive eligibility detects unresolved patient and inventory work');
else fail('Archive eligibility blocker contract is incomplete');
if (!/DELETE\s+FROM\s+(patients|medicines)/i.test(archivesRoute) && /original stock and history/.test(archivesRoute)) pass('Archive/unarchive preserves original records, stock, and history');
else fail('Archive preservation contract is incomplete');
if (/Patients/.test(archivesPageV12) && /Medicines/.test(archivesPageV12) && /Unarchive/.test(archivesPageV12)) pass('Dedicated Archives UI contains patient/medicine views and restoration actions');
else fail('Dedicated Archives UI is incomplete');

if (/api_idempotency_keys/.test(migrationV12) && /CONSULTATION_CREATE/.test(consultationRoute) && /MEDICINE_ISSUANCE/.test(issuance) && /MEDICINE_RECEIPT/.test(medicineRoute)) pass('Consultation, issuance, and stock receipt duplicate protection is implemented');
else fail('High-consequence idempotency contract is incomplete');
const patientServiceV12 = read('server/services/patients/patientService.js');
const visitsV12 = read('server/routes/visits.js');
if (/getPatientForStudentUser\(connection, userId, \{ forUpdate = false \}/.test(patientServiceV12) &&
    /getPatientForStudentUser\(connection, req\.user\.id, \{ forUpdate: true \}\)/.test(appointmentRoute) &&
    /resolvePatient\(connection, data, \{ forUpdate: true \}\)/.test(visitsV12) &&
    /resolvePatient\(connection, data, \{ forUpdate: true \}\)/.test(issuance)) {
  pass('Patient rows are locked before new appointment, visit, and issuance archive checks');
} else fail('Archive/new-transaction patient locking contract is incomplete');
if (/expiration_date >= CURDATE\(\)/.test(issuance) && /status = 'COMPLETED' FOR UPDATE/.test(issuance)) pass('Medicine issuance blocks expired/empty batches and one-time void restoration is locked');
else fail('Medicine issuance stock-safety contract is incomplete');
if (/patientType/.test(reportsV12) && /EXPORT_REPORT/.test(reportsV12) && /m\.archived_at IS NULL/.test(reportsV12)) pass('Reports support patient-type filters, audited exports, and active inventory filtering');
else fail('Reporting v1.2 contract is incomplete');
if (/permissions=\{\['archives\.read'\]\}/.test(appV12) && /permissions=\{\['policies\.manage'\]\}/.test(appV12) && /authorize\('archives\.read'\)/.test(archivesRoute) && /authorize\('policies\.manage'\)/.test(policiesRoute)) pass('New permissions are enforced in both frontend routing and backend APIs');
else fail('New frontend/backend permission contract is incomplete');

const backupScript = read('scripts/backup-local.ps1');
const restoreScript = read('scripts/restore-local.ps1');
if (/mysqldump/.test(backupScript) && /uploads/.test(backupScript) && /defaults-extra-file/.test(backupScript) && /Expand-Archive/.test(restoreScript) && /RestoreUploads/.test(restoreScript)) pass('Backup/restore tools cover database and uploads without command-line passwords');
else fail('Backup/restore tooling contract is incomplete');

if (/SUPABASE_/i.test(server + auth + schema)) fail('Unexpected Supabase dependency remains in the fresh local stack');
else pass('No Supabase dependency remains in the local full-stack implementation');

for (const line of notices) console.log(line);
for (const line of failures) console.error(line);
console.log(`\nStatic validation: ${notices.length} passed, ${failures.length} failed.`);
if (failures.length) process.exit(1);
