import express from 'express';
import { z } from 'zod';
import { pool, withTransaction } from '../config/db.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { requireCsrf } from '../middleware/csrf.js';
import { validate } from '../middleware/validate.js';
import { AppError, asyncHandler, created, ok } from '../utils/http.js';
import { uuid } from '../utils/ids.js';
import { paginationFromQuery, paginationMeta } from '../utils/pagination.js';
import { writeAudit } from '../utils/audit.js';

const router = express.Router();
router.use(authenticate);

const studentBody = z.object({
  studentNumber: z.string().trim().min(3).max(40),
  firstName: z.string().trim().min(1).max(100),
  middleName: z.string().trim().max(100).optional().nullable(),
  lastName: z.string().trim().min(1).max(100),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sex: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']),
  program: z.string().trim().min(1).max(150),
  yearLevel: z.string().trim().min(1).max(30),
  section: z.string().trim().max(80).optional().nullable(),
  registeredEmail: z.string().email().max(190),
  contactNumber: z.string().trim().max(40).optional().nullable(),
  address: z.string().trim().max(1000).optional().nullable(),
  enrollmentStatus: z.enum(['ACTIVE', 'INACTIVE', 'GRADUATED', 'TRANSFERRED', 'SUSPENDED']).default('ACTIVE'),
  academicYear: z.string().trim().max(20),
  semester: z.string().trim().max(30),
  portalEligible: z.boolean().default(true),
  guardian: z.object({
    fullName: z.string().trim().max(200).optional().nullable(),
    relationship: z.string().trim().max(80).optional().nullable(),
    contactNumber: z.string().trim().max(40).optional().nullable(),
    email: z.string().email().max(190).optional().nullable().or(z.literal(''))
  }).optional(),
  emergencyContact: z.object({
    fullName: z.string().trim().max(200).optional().nullable(),
    relationship: z.string().trim().max(80).optional().nullable(),
    contactNumber: z.string().trim().max(40).optional().nullable()
  }).optional(),
  medical: z.object({
    bloodType: z.string().trim().max(10).optional().nullable(),
    allergies: z.string().max(3000).optional().nullable(),
    existingConditions: z.string().max(3000).optional().nullable(),
    currentMedications: z.string().max(3000).optional().nullable(),
    medicalHistory: z.string().max(5000).optional().nullable(),
    immunizations: z.string().max(5000).optional().nullable(),
    importantAlerts: z.string().max(3000).optional().nullable()
  }).optional()
});

router.get('/search', authorize('patients.read'), asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (q.length < 2) return ok(res, []);
  const like = `%${q}%`;
  const [rows] = await pool.execute(
    `SELECT id, student_number, first_name, middle_name, last_name, program, year_level, section, enrollment_status
     FROM students
     WHERE student_number LIKE ? OR CONCAT_WS(' ', first_name, middle_name, last_name) LIKE ?
        OR registered_email LIKE ? OR contact_number LIKE ?
     ORDER BY last_name, first_name LIMIT 12`,
    [like, like, like, like]
  );
  return ok(res, rows);
}));

router.get('/', authorize('patients.read'), asyncHandler(async (req, res) => {
  const { page, limit, offset } = paginationFromQuery(req.query);
  const search = String(req.query.search || '').trim();
  const program = String(req.query.program || '').trim();
  const yearLevel = String(req.query.yearLevel || '').trim();
  const status = String(req.query.status || '').trim();
  const sortMap = {
    name: 's.last_name ASC, s.first_name ASC',
    newest: 's.created_at DESC',
    oldest: 's.created_at ASC',
    studentNumber: 's.student_number ASC'
  };
  const orderBy = sortMap[req.query.sort] || sortMap.name;
  const clauses = ['1=1'];
  const params = [];
  if (search) {
    const like = `%${search}%`;
    clauses.push(`(s.student_number LIKE ? OR CONCAT_WS(' ', s.first_name, s.middle_name, s.last_name) LIKE ? OR s.registered_email LIKE ? OR s.contact_number LIKE ?)`);
    params.push(like, like, like, like);
  }
  if (program) { clauses.push('s.program = ?'); params.push(program); }
  if (yearLevel) { clauses.push('s.year_level = ?'); params.push(yearLevel); }
  if (status) { clauses.push('s.enrollment_status = ?'); params.push(status); }
  const where = clauses.join(' AND ');

  const [countRows] = await pool.execute(`SELECT COUNT(*) AS total FROM students s WHERE ${where}`, params);
  const [rows] = await pool.execute(
    `SELECT s.*,
       TIMESTAMPDIFF(YEAR, s.birth_date, CURDATE()) AS age,
       (SELECT MAX(CONCAT(v.visit_date, ' ', v.visit_time)) FROM visits v WHERE v.student_id = s.id) AS last_visit,
       (SELECT COUNT(*) FROM visits v WHERE v.student_id = s.id) AS total_visits
     FROM students s WHERE ${where}
     ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  const [filters] = await pool.query('SELECT DISTINCT program, year_level FROM students ORDER BY program, year_level');
  return ok(res, { items: rows, filters }, 'Students loaded.', paginationMeta(countRows[0].total, page, limit));
}));

router.post('/', authorize('patients.write'), requireCsrf, validate(z.object({ body: studentBody, params: z.object({}), query: z.object({}) })), asyncHandler(async (req, res) => {
  const data = req.validated.body;
  const studentId = uuid();
  await withTransaction(async (connection) => {
    await connection.execute(
      `INSERT INTO students
       (id, student_number, first_name, middle_name, last_name, birth_date, sex, program, year_level, section,
        registered_email, contact_number, address, enrollment_status, academic_year, semester, portal_eligible,
        account_activation_status, account_linked)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'NOT_ACTIVATED', 0)`,
      [studentId, data.studentNumber, data.firstName, data.middleName || null, data.lastName, data.birthDate, data.sex,
       data.program, data.yearLevel, data.section || null, data.registeredEmail, data.contactNumber || null, data.address || null,
       data.enrollmentStatus, data.academicYear, data.semester, data.portalEligible ? 1 : 0]
    );
    await connection.execute(
      `INSERT INTO student_enrollments
       (id, student_id, academic_year, semester, program, year_level, section, enrollment_status, is_current)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [uuid(), studentId, data.academicYear, data.semester, data.program, data.yearLevel, data.section || null, data.enrollmentStatus]
    );
    await connection.execute(
      `INSERT INTO patient_medical_history
       (id, student_id, blood_type, allergies, existing_conditions, current_medications, medical_history, immunizations, important_alerts)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [uuid(), studentId, data.medical?.bloodType || null, data.medical?.allergies || null,
       data.medical?.existingConditions || null, data.medical?.currentMedications || null,
       data.medical?.medicalHistory || null, data.medical?.immunizations || null, data.medical?.importantAlerts || null]
    );
    if (data.guardian?.fullName) {
      await connection.execute(
        `INSERT INTO guardians (id, student_id, full_name, relationship, contact_number, email, is_primary)
         VALUES (?, ?, ?, ?, ?, ?, 1)`,
        [uuid(), studentId, data.guardian.fullName, data.guardian.relationship || null, data.guardian.contactNumber || null, data.guardian.email || null]
      );
    }
    if (data.emergencyContact?.fullName) {
      await connection.execute(
        `INSERT INTO emergency_contacts (id, student_id, full_name, relationship, contact_number, is_primary)
         VALUES (?, ?, ?, ?, ?, 1)`,
        [uuid(), studentId, data.emergencyContact.fullName, data.emergencyContact.relationship || null, data.emergencyContact.contactNumber || null]
      );
    }
    await writeAudit({ actorUserId: req.user.id, action: 'CREATE_PATIENT', entityType: 'students', entityId: studentId, description: `Registered student ${data.studentNumber}.`, ipAddress: req.ip, connection });
  });
  return created(res, { id: studentId }, 'Student registered successfully.');
}));

router.get('/:id', authorize('patients.read'), asyncHandler(async (req, res) => {
  const [students] = await pool.execute(
    `SELECT s.*, TIMESTAMPDIFF(YEAR, s.birth_date, CURDATE()) AS age,
       pmh.blood_type, pmh.allergies, pmh.existing_conditions, pmh.current_medications,
       pmh.medical_history, pmh.immunizations, pmh.important_alerts,
       sa.user_id AS linked_user_id, u.username AS portal_username, u.status AS portal_status
     FROM students s
     LEFT JOIN patient_medical_history pmh ON pmh.student_id = s.id
     LEFT JOIN student_accounts sa ON sa.student_id = s.id
     LEFT JOIN users u ON u.id = sa.user_id
     WHERE s.id = ?`,
    [req.params.id]
  );
  if (!students.length) throw new AppError(404, 'Student not found.');
  const [guardians] = await pool.execute('SELECT * FROM guardians WHERE student_id = ? ORDER BY is_primary DESC, created_at', [req.params.id]);
  const [contacts] = await pool.execute('SELECT * FROM emergency_contacts WHERE student_id = ? ORDER BY is_primary DESC, created_at', [req.params.id]);
  const [visits] = await pool.execute(
    `SELECT v.*, c.id AS consultation_id, c.diagnosis, c.status AS consultation_status,
       CONCAT_WS(' ', st.first_name, st.last_name) AS registered_by_name
     FROM visits v
     LEFT JOIN consultations c ON c.visit_id = v.id
     LEFT JOIN staff st ON st.id = v.registered_by
     WHERE v.student_id = ? ORDER BY v.visit_date DESC, v.visit_time DESC LIMIT 50`,
    [req.params.id]
  );
  const [issuances] = await pool.execute(
    `SELECT mi.id, mi.issuance_number, mi.issued_at,
       GROUP_CONCAT(CONCAT(m.generic_name, ' × ', mii.quantity, ' ', m.unit) ORDER BY m.generic_name SEPARATOR ', ') AS medicines
     FROM medicine_issuances mi
     JOIN medicine_issuance_items mii ON mii.issuance_id = mi.id
     JOIN medicines m ON m.id = mii.medicine_id
     WHERE mi.student_id = ? GROUP BY mi.id ORDER BY mi.issued_at DESC LIMIT 10`,
    [req.params.id]
  );
  const [summary] = await pool.execute(
    `SELECT
       (SELECT COUNT(*) FROM visits WHERE student_id = ?) AS total_visits,
       (SELECT MAX(CONCAT(visit_date, ' ', visit_time)) FROM visits WHERE student_id = ?) AS last_visit,
       (SELECT complaint FROM visits WHERE student_id = ? GROUP BY complaint ORDER BY COUNT(*) DESC LIMIT 1) AS common_complaint,
       (SELECT MAX(updated_at) FROM consultations WHERE student_id = ?) AS last_consultation`,
    [req.params.id, req.params.id, req.params.id, req.params.id]
  );
  await writeAudit({ actorUserId: req.user.id, action: 'VIEW_PATIENT', entityType: 'students', entityId: req.params.id, description: `Viewed medical profile for ${students[0].student_number}.`, ipAddress: req.ip });
  return ok(res, { student: students[0], guardians, emergencyContacts: contacts, visits, issuances, summary: summary[0] });
}));

router.patch('/:id', authorize('patients.write'), requireCsrf, validate(z.object({ body: studentBody.partial(), params: z.object({ id: z.string().uuid() }), query: z.object({}) })), asyncHandler(async (req, res) => {
  const data = req.validated.body;
  const map = {
    studentNumber: 'student_number', firstName: 'first_name', middleName: 'middle_name', lastName: 'last_name', birthDate: 'birth_date', sex: 'sex',
    program: 'program', yearLevel: 'year_level', section: 'section', registeredEmail: 'registered_email', contactNumber: 'contact_number', address: 'address',
    enrollmentStatus: 'enrollment_status', academicYear: 'academic_year', semester: 'semester', portalEligible: 'portal_eligible'
  };
  await withTransaction(async (connection) => {
    const sets = [];
    const params = [];
    for (const [key, column] of Object.entries(map)) {
      if (Object.hasOwn(data, key)) {
        sets.push(`${column} = ?`);
        params.push(key === 'portalEligible' ? (data[key] ? 1 : 0) : (data[key] || null));
      }
    }
    if (sets.length) {
      params.push(req.params.id);
      const [result] = await connection.execute(`UPDATE students SET ${sets.join(', ')}, updated_at = NOW() WHERE id = ?`, params);
      if (!result.affectedRows) throw new AppError(404, 'Student not found.');
    }
    const enrollmentFields = ['program', 'yearLevel', 'section', 'enrollmentStatus', 'academicYear', 'semester'];
    if (enrollmentFields.some((key) => Object.hasOwn(data, key))) {
      const [currentRows] = await connection.execute(
        `SELECT program, year_level, section, enrollment_status, academic_year, semester
         FROM students WHERE id = ?`,
        [req.params.id]
      );
      if (!currentRows.length) throw new AppError(404, 'Student not found.');
      const current = currentRows[0];
      await connection.execute('UPDATE student_enrollments SET is_current = 0 WHERE student_id = ?', [req.params.id]);
      await connection.execute(
        `INSERT INTO student_enrollments
         (id, student_id, academic_year, semester, program, year_level, section, enrollment_status, is_current)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE program = VALUES(program), year_level = VALUES(year_level), section = VALUES(section),
           enrollment_status = VALUES(enrollment_status), is_current = 1`,
        [uuid(), req.params.id, current.academic_year, current.semester, current.program, current.year_level,
         current.section || null, current.enrollment_status]
      );
    }
    if (data.medical) {
      await connection.execute(
        `INSERT INTO patient_medical_history
         (id, student_id, blood_type, allergies, existing_conditions, current_medications, medical_history, immunizations, important_alerts)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           blood_type = VALUES(blood_type), allergies = VALUES(allergies), existing_conditions = VALUES(existing_conditions),
           current_medications = VALUES(current_medications), medical_history = VALUES(medical_history),
           immunizations = VALUES(immunizations), important_alerts = VALUES(important_alerts), updated_at = NOW()`,
        [uuid(), req.params.id, data.medical.bloodType || null, data.medical.allergies || null, data.medical.existingConditions || null,
         data.medical.currentMedications || null, data.medical.medicalHistory || null, data.medical.immunizations || null, data.medical.importantAlerts || null]
      );
    }
    await writeAudit({ actorUserId: req.user.id, action: 'UPDATE_PATIENT', entityType: 'students', entityId: req.params.id, description: 'Updated a student medical profile.', ipAddress: req.ip, metadata: { fields: Object.keys(data) }, connection });
  });
  return ok(res, { id: req.params.id }, 'Student profile updated successfully.');
}));

router.delete('/:id', authorize('patients.write'), requireCsrf, asyncHandler(async (req, res) => {
  const [rows] = await pool.execute('SELECT student_number FROM students WHERE id = ?', [req.params.id]);
  if (!rows.length) throw new AppError(404, 'Student not found.');
  const [links] = await pool.execute('SELECT COUNT(*) AS total FROM visits WHERE student_id = ?', [req.params.id]);
  if (links[0].total > 0) throw new AppError(409, 'This student has medical records and cannot be deleted. Set the enrollment status to inactive instead.');
  await pool.execute('DELETE FROM students WHERE id = ?', [req.params.id]);
  await writeAudit({ actorUserId: req.user.id, action: 'DELETE_PATIENT', entityType: 'students', entityId: req.params.id, description: `Deleted unused student ${rows[0].student_number}.`, ipAddress: req.ip });
  return ok(res, null, 'Student deleted successfully.');
}));

export default router;
