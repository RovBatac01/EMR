import express from 'express';
import { z } from 'zod';
import { pool, withTransaction } from '../config/db.js';
import { env } from '../config/env.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';
import { requireCsrf } from '../middleware/csrf.js';
import { validate } from '../middleware/validate.js';
import { AppError, asyncHandler, created, ok } from '../utils/http.js';
import { reference, uuid } from '../utils/ids.js';
import { auditRecordAccess, writeAudit } from '../utils/audit.js';
import { enqueueEmail } from '../services/emailService.js';

const router = express.Router();
router.use(authenticate, authorizeRoles('STUDENT'));

function studentId(req) {
  if (!req.user.student_id) throw new AppError(403, 'This account is not linked to a student record.');
  return req.user.student_id;
}
function patientId(req) {
  if (!req.user.patient_id) throw new AppError(403, 'This account is not linked to a patient record. Apply the v1.1.0 migration.');
  return req.user.patient_id;
}
function parseJson(value, fallback = []) {
  if (typeof value !== 'string') return value ?? fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}

router.get('/dashboard', asyncHandler(async (req, res) => {
  const sid = studentId(req);
  const pid = patientId(req);
  const [students] = await pool.execute(
    `SELECT s.*, pmh.blood_type, pmh.allergies, pmh.important_alerts
     FROM students s
     LEFT JOIN patient_medical_history pmh ON pmh.patient_id = ?
     WHERE s.id = ?`,
    [pid, sid]
  );
  const [[counts]] = await pool.execute(
    `SELECT
      (SELECT COUNT(*) FROM visits WHERE patient_id = ?) AS total_visits,
      (SELECT MAX(CONCAT(visit_date,' ',visit_time)) FROM visits WHERE patient_id = ?) AS last_visit,
      (SELECT COUNT(*) FROM consultations WHERE patient_id = ? AND status = 'RELEASED') AS released_results,
      (SELECT COUNT(*) FROM form_assignments WHERE student_id = ? AND status IN ('ASSIGNED','DRAFT')) AS pending_forms,
      (SELECT COUNT(*) FROM appointments WHERE patient_id = ? AND status IN ('PENDING','PROPOSED','CONFIRMED')) AS active_appointments,
      (SELECT COUNT(*) FROM follow_ups WHERE patient_id = ? AND status IN ('PENDING','SCHEDULED')) AS active_followups,
      (SELECT COUNT(*) FROM patient_correction_requests WHERE patient_id = ? AND status = 'PENDING') AS pending_corrections`,
    [pid, pid, pid, sid, pid, pid, pid]
  );
  const [recentVisits] = await pool.execute(
    `SELECT id, visit_number, visit_date, visit_time, visit_type, complaint, status
     FROM visits WHERE patient_id = ? ORDER BY visit_date DESC, visit_time DESC LIMIT 5`,
    [pid]
  );
  const [appointments] = await pool.execute(
    `SELECT a.id, a.appointment_number, a.status,
       COALESCE(a.confirmed_start, a.proposed_start, a.requested_start) AS scheduled_start,
       aps.name AS service_name
     FROM appointments a JOIN appointment_services aps ON aps.id = a.service_id
     WHERE a.patient_id = ? AND a.status NOT IN ('COMPLETED','CANCELLED','DECLINED','NO_SHOW')
     ORDER BY scheduled_start ASC LIMIT 5`,
    [pid]
  );
  const [notifications] = await pool.execute(
    'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 6',
    [req.user.id]
  );
  return ok(res, { student: students[0], counts, recentVisits, appointments, notifications });
}));

router.get('/profile', asyncHandler(async (req, res) => {
  const sid = studentId(req);
  const pid = patientId(req);
  const [rows] = await pool.execute(
    `SELECT s.student_number, s.first_name, s.middle_name, s.last_name, s.birth_date, s.sex,
       s.program, s.year_level, s.section, s.registered_email, s.contact_number, s.address,
       s.enrollment_status, s.academic_year, s.semester, s.updated_at AS profile_updated_at,
       pmh.blood_type, pmh.allergies, pmh.existing_conditions, pmh.current_medications,
       pmh.medical_history, pmh.immunizations, pmh.important_alerts, pmh.updated_at AS health_updated_at
     FROM students s
     LEFT JOIN patient_medical_history pmh ON pmh.patient_id = ?
     WHERE s.id = ?`,
    [pid, sid]
  );
  if (!rows.length) throw new AppError(404, 'Student profile not found.');
  const [guardians] = await pool.execute(
    `SELECT id, full_name, relationship, contact_number, email, address, is_primary, updated_at
     FROM guardians WHERE patient_id = ? ORDER BY is_primary DESC, created_at`,
    [pid]
  );
  const [contacts] = await pool.execute(
    `SELECT id, full_name, relationship, contact_number, is_primary, updated_at
     FROM emergency_contacts WHERE patient_id = ? ORDER BY is_primary DESC, created_at`,
    [pid]
  );
  const [measurements] = await pool.execute(
    `SELECT id, height_cm, weight_kg, measured_on, source, notes, created_at
     FROM patient_measurements WHERE patient_id = ? ORDER BY measured_on DESC, created_at DESC LIMIT 50`,
    [pid]
  );
  const [followUps] = await pool.execute(
    `SELECT f.*, c.consultation_number, a.appointment_number,
       CONCAT_WS(' ', st.first_name, st.last_name) AS assigned_provider
     FROM follow_ups f
     JOIN consultations c ON c.id = f.consultation_id
     LEFT JOIN appointments a ON a.id = f.appointment_id
     LEFT JOIN staff st ON st.id = COALESCE(f.assigned_doctor_staff_id, f.assigned_staff_id)
     WHERE f.patient_id = ? ORDER BY f.target_date DESC`,
    [pid]
  );
  const [corrections] = await pool.execute(
    `SELECT id, request_number, request_type, status, reviewer_comments, submitted_at, reviewed_at
     FROM patient_correction_requests WHERE patient_id = ? ORDER BY submitted_at DESC LIMIT 30`,
    [pid]
  );
  await auditRecordAccess({
    req, entityType: 'patients', entityId: pid, action: 'VIEW_OWN_MEDICAL_PROFILE',
    description: 'Viewed own student medical profile.'
  });
  return ok(res, { student: rows[0], guardians, emergencyContacts: contacts, measurements, followUps, corrections });
}));

router.post('/measurements', requireCsrf, validate(z.object({
  body: z.object({
    heightCm: z.coerce.number().min(50).max(260).optional().nullable(),
    weightKg: z.coerce.number().min(2).max(500).optional().nullable(),
    measuredOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    notes: z.preprocess((value) => value === '' ? null : value, z.string().trim().max(1000).nullable().optional())
  }).refine((data) => data.heightCm != null || data.weightKg != null, {
    message: 'Enter at least height or weight.', path: ['heightCm']
  }),
  params: z.object({}), query: z.object({})
})), asyncHandler(async (req, res) => {
  const id = uuid();
  const data = req.validated.body;
  const [[dateCheck]] = await pool.execute('SELECT ? <= CURDATE() AS is_valid_date', [data.measuredOn]);
  if (!Number(dateCheck.is_valid_date)) throw new AppError(422, 'Measurement date cannot be in the future.');
  await pool.execute(
    `INSERT INTO patient_measurements
     (id, patient_id, height_cm, weight_kg, measured_on, source, submitted_by_user_id, notes)
     VALUES (?, ?, ?, ?, ?, 'PATIENT_SELF_REPORTED', ?, ?)`,
    [id, patientId(req), data.heightCm ?? null, data.weightKg ?? null, data.measuredOn, req.user.id, data.notes ?? null]
  );
  await writeAudit({
    actorUserId: req.user.id, action: 'ADD_SELF_REPORTED_MEASUREMENT', entityType: 'patient_measurements',
    entityId: id, description: 'Added a self-reported patient measurement.', ipAddress: req.ip, request: req,
    metadata: { measuredOn: data.measuredOn }
  });
  return created(res, { id }, 'Measurement saved without overwriting clinical vital-sign history.');
}));

router.get('/visits', asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT v.id, v.visit_number, v.visit_date, v.visit_time, v.visit_type, v.complaint, v.status,
       CONCAT_WS(' ', st.first_name, st.last_name) AS attending_staff,
       c.status AS consultation_status, c.chief_complaint,
       CASE WHEN c.status = 'RELEASED' THEN c.diagnosis ELSE NULL END AS diagnosis
     FROM visits v
     LEFT JOIN staff st ON st.id = v.registered_by
     LEFT JOIN consultations c ON c.visit_id = v.id
     WHERE v.patient_id = ? ORDER BY v.visit_date DESC, v.visit_time DESC`,
    [patientId(req)]
  );
  return ok(res, rows);
}));

router.get('/consultations', asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT c.id, c.consultation_number, c.chief_complaint, c.symptoms, c.diagnosis, c.findings,
       c.severity, c.treatment_provided, c.dosage, c.frequency, c.duration, c.recommendations,
       c.notes, c.released_at, c.signed_off_at, v.visit_date, v.visit_time,
       CONCAT_WS(' ', preparer.first_name, preparer.last_name) AS prepared_by,
       CONCAT_WS(' ', doctor.first_name, doctor.last_name) AS responsible_doctor
     FROM consultations c
     JOIN visits v ON v.id = c.visit_id
     LEFT JOIN staff preparer ON preparer.id = c.prepared_by_staff_id
     LEFT JOIN staff doctor ON doctor.id = c.doctor_staff_id
     WHERE c.patient_id = ? AND c.status = 'RELEASED'
     ORDER BY c.released_at DESC`,
    [patientId(req)]
  );
  for (const row of rows) row.recommendations = parseJson(row.recommendations, []);
  return ok(res, rows);
}));

router.get('/medicines', asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT mi.issuance_number, mi.issued_at, m.generic_name, m.brand_name, m.dosage_form, m.unit,
       mii.quantity, mii.dosage, mii.frequency, mii.duration, mii.instructions,
       CONCAT_WS(' ', st.first_name, st.last_name) AS issued_by
     FROM medicine_issuances mi
     JOIN medicine_issuance_items mii ON mii.issuance_id = mi.id
     JOIN medicines m ON m.id = mii.medicine_id
     JOIN staff st ON st.id = mi.issued_by
     WHERE mi.patient_id = ? AND mi.status = 'COMPLETED' ORDER BY mi.issued_at DESC`,
    [patientId(req)]
  );
  return ok(res, rows);
}));

router.get('/follow-ups', asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT f.*, c.consultation_number, a.appointment_number,
       CONCAT_WS(' ', st.first_name, st.last_name) AS assigned_provider
     FROM follow_ups f
     JOIN consultations c ON c.id = f.consultation_id
     LEFT JOIN appointments a ON a.id = f.appointment_id
     LEFT JOIN staff st ON st.id = COALESCE(f.assigned_doctor_staff_id, f.assigned_staff_id)
     WHERE f.patient_id = ? ORDER BY f.target_date DESC`,
    [patientId(req)]
  );
  return ok(res, rows);
}));

router.get('/forms', asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT fa.id AS assignment_id, fa.status, fa.due_date, cf.id AS form_id, cf.title, cf.description,
       cfv.id AS form_version_id, cfv.version, cfv.schema_json,
       fs.id AS submission_id, fs.reference_number, fs.submitted_at
     FROM form_assignments fa
     JOIN clinic_form_versions cfv ON cfv.id = fa.form_version_id
     JOIN clinic_forms cf ON cf.id = cfv.form_id
     LEFT JOIN form_submissions fs ON fs.assignment_id = fa.id
     WHERE fa.student_id = ?
     ORDER BY COALESCE(fa.due_date,'2999-12-31'), fa.created_at DESC`,
    [studentId(req)]
  );
  for (const row of rows) row.schema_json = parseJson(row.schema_json, []);
  return ok(res, rows);
}));

router.post('/forms/:assignmentId/submit', requireCsrf, validate(z.object({
  body: z.object({ answers: z.record(z.any()) }),
  params: z.object({ assignmentId: z.string().uuid() }), query: z.object({})
})), asyncHandler(async (req, res) => {
  const sid = studentId(req);
  let receipt;
  await withTransaction(async (connection) => {
    const [assignments] = await connection.execute(
      `SELECT fa.*, cf.title, cfv.schema_json, s.student_number, s.first_name, s.last_name,
         s.registered_email, sa.verified_email_at
       FROM form_assignments fa
       JOIN clinic_form_versions cfv ON cfv.id = fa.form_version_id
       JOIN clinic_forms cf ON cf.id = cfv.form_id
       JOIN students s ON s.id = fa.student_id
       LEFT JOIN student_accounts sa ON sa.student_id = s.id
       WHERE fa.id = ? AND fa.student_id = ? FOR UPDATE`,
      [req.params.assignmentId, sid]
    );
    if (!assignments.length) throw new AppError(404, 'Assigned form not found.');
    if (assignments[0].status === 'SUBMITTED') throw new AppError(409, 'This form has already been submitted.');
    const schema = parseJson(assignments[0].schema_json, []);
    const fieldErrors = {};
    for (const field of schema) {
      const value = req.validated.body.answers[field.key];
      if (field.required && (value === undefined || value === '' || value === null)) fieldErrors[field.key] = [`${field.label} is required.`];
    }
    if (Object.keys(fieldErrors).length) throw new AppError(422, 'Please complete the required fields.', { fieldErrors });
    const submissionId = uuid();
    const ref = reference('FORM');
    await connection.execute(
      "INSERT INTO form_submissions (id, assignment_id, form_version_id, student_id, reference_number, status, submitted_at) VALUES (?, ?, ?, ?, ?, 'SUBMITTED', NOW())",
      [submissionId, req.params.assignmentId, assignments[0].form_version_id, sid, ref]
    );
    for (const field of schema) {
      if (Object.hasOwn(req.validated.body.answers, field.key)) {
        await connection.execute(
          'INSERT INTO form_submission_answers (id, submission_id, field_key, question_snapshot, answer_json) VALUES (?, ?, ?, ?, ?)',
          [uuid(), submissionId, field.key, field.label, JSON.stringify(req.validated.body.answers[field.key])]
        );
      }
    }
    await connection.execute("UPDATE form_assignments SET status = 'SUBMITTED', updated_at = NOW() WHERE id = ?", [req.params.assignmentId]);
    await writeAudit({
      actorUserId: req.user.id, action: 'FORM_SUBMITTED', entityType: 'form_submissions', entityId: submissionId,
      description: `Submitted clinic form ${assignments[0].title}.`, ipAddress: req.ip, request: req,
      metadata: { reference: ref }, connection
    });
    receipt = {
      submissionId, reference: ref, title: assignments[0].title, email: assignments[0].registered_email,
      verified: Boolean(assignments[0].verified_email_at),
      name: `${assignments[0].first_name} ${assignments[0].last_name}`,
      studentNumber: assignments[0].student_number
    };
  });
  if (receipt.email && receipt.verified) {
    await enqueueEmail({
      recipient: receipt.email,
      subject: `KLD Clinic form receipt — ${receipt.reference}`,
      template: 'FORM_RECEIPT',
      payload: {
        title: 'Clinic form submitted',
        message: `<p>${receipt.name}, your form <strong>${receipt.title}</strong> was received.</p><p>Reference: <strong>${receipt.reference}</strong></p>`,
        actionUrl: `${env.APP_URL}/student/forms`, actionLabel: 'View submission'
      },
      relatedType: 'form_submissions', relatedId: receipt.submissionId
    });
  }
  return created(res, { reference: receipt.reference }, 'Form submitted successfully.');
}));

router.get('/forms/submissions/:id', asyncHandler(async (req, res) => {
  const [heads] = await pool.execute(
    `SELECT fs.*, cf.title, s.student_number, CONCAT_WS(' ',s.first_name,s.last_name) AS student_name
     FROM form_submissions fs
     JOIN clinic_form_versions cfv ON cfv.id = fs.form_version_id
     JOIN clinic_forms cf ON cf.id = cfv.form_id
     JOIN students s ON s.id = fs.student_id
     WHERE fs.id = ? AND fs.student_id = ?`,
    [req.params.id, studentId(req)]
  );
  if (!heads.length) throw new AppError(404, 'Submission not found.');
  const [answers] = await pool.execute(
    'SELECT field_key, question_snapshot, answer_json FROM form_submission_answers WHERE submission_id = ? ORDER BY created_at',
    [req.params.id]
  );
  for (const row of answers) row.answer_json = parseJson(row.answer_json, null);
  return ok(res, { submission: heads[0], answers });
}));

router.get('/notifications', asyncHandler(async (req, res) => {
  const [rows] = await pool.execute('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 100', [req.user.id]);
  return ok(res, rows);
}));

export default router;
