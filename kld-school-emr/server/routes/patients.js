import express from 'express';
import { z } from 'zod';
import { pool, withTransaction } from '../config/db.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { requireCsrf } from '../middleware/csrf.js';
import { validate } from '../middleware/validate.js';
import { AppError, asyncHandler, created, ok } from '../utils/http.js';
import { paginationFromQuery, paginationMeta } from '../utils/pagination.js';
import { uuid } from '../utils/ids.js';
import { writeAudit, auditRecordAccess } from '../utils/audit.js';
import { patientIdentitySelect, patientIdentityColumns, patientIdentityFrom, patientDisplayName } from '../services/patients/patientService.js';

const router = express.Router();
router.use(authenticate);

const optionalText = (max) => z.string().trim().max(max).optional().nullable();
const contactSchema = z.object({
  fullName: z.string().trim().min(2).max(200),
  relationship: optionalText(80),
  contactNumber: z.string().trim().min(7).max(40),
  email: z.string().email().optional().nullable().or(z.literal(''))
});
const medicalSchema = z.object({
  bloodType: optionalText(10),
  allergies: optionalText(10000),
  existingConditions: optionalText(10000),
  currentMedications: optionalText(10000),
  medicalHistory: optionalText(20000),
  immunizations: optionalText(20000),
  importantAlerts: optionalText(10000)
}).optional();

const studentIdentity = z.object({
  studentNumber: z.string().trim().min(3).max(40),
  firstName: z.string().trim().min(1).max(100),
  middleName: optionalText(100),
  lastName: z.string().trim().min(1).max(100),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sex: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']),
  program: z.string().trim().min(1).max(150),
  yearLevel: z.string().trim().min(1).max(30),
  section: optionalText(80),
  registeredEmail: z.string().email(),
  contactNumber: optionalText(40),
  address: optionalText(1000),
  enrollmentStatus: z.enum(['ACTIVE', 'INACTIVE', 'GRADUATED', 'TRANSFERRED', 'SUSPENDED']).default('ACTIVE'),
  academicYear: z.string().trim().min(1).max(20),
  semester: z.string().trim().min(1).max(30),
  portalEligible: z.boolean().default(true)
});

const employeeIdentity = z.object({
  employeeNumber: z.string().trim().min(2).max(40),
  categoryId: z.string().uuid(),
  firstName: z.string().trim().min(1).max(100),
  middleName: optionalText(100),
  lastName: z.string().trim().min(1).max(100),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sex: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']),
  department: z.string().trim().min(1).max(180),
  positionTitle: optionalText(180),
  employmentStatus: z.enum(['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'SEPARATED']).default('ACTIVE'),
  email: z.string().email().optional().nullable().or(z.literal('')),
  contactNumber: optionalText(40),
  address: optionalText(1000)
});

const createPatientSchema = z.object({
  body: z.discriminatedUnion('patientType', [
    z.object({ patientType: z.literal('STUDENT'), identity: studentIdentity, medical: medicalSchema, guardian: contactSchema.optional().nullable(), emergencyContact: contactSchema.optional().nullable() }),
    z.object({ patientType: z.literal('EMPLOYEE'), identity: employeeIdentity, medical: medicalSchema, guardian: contactSchema.optional().nullable(), emergencyContact: contactSchema.optional().nullable() })
  ]),
  params: z.object({}),
  query: z.object({})
});

router.get('/employee-categories', authorize('patients.read'), asyncHandler(async (_req, res) => {
  const [rows] = await pool.query('SELECT * FROM employee_categories ORDER BY is_active DESC,name');
  return ok(res, rows);
}));


const employeeCategoryBody = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.preprocess((value) => value === '' ? null : value, z.string().trim().max(500).nullable().optional()),
  isActive: z.boolean().optional().default(true)
});

router.post('/employee-categories', authorize('employees.manage'), requireCsrf, validate(z.object({
  body: employeeCategoryBody, params: z.object({}), query: z.object({})
})), asyncHandler(async (req, res) => {
  const id = uuid();
  const data = req.validated.body;
  await pool.execute(
    'INSERT INTO employee_categories (id, name, description, is_active) VALUES (?, ?, ?, ?)',
    [id, data.name, data.description ?? null, data.isActive ? 1 : 0]
  );
  await writeAudit({
    actorUserId: req.user.id, action: 'CREATE_EMPLOYEE_CATEGORY', entityType: 'employee_categories',
    entityId: id, description: `Created employee category ${data.name}.`, ipAddress: req.ip, request: req
  });
  return created(res, { id }, 'Employee category created.');
}));

router.patch('/employee-categories/:id', authorize('employees.manage'), requireCsrf, validate(z.object({
  body: employeeCategoryBody.partial(), params: z.object({ id: z.string().uuid() }), query: z.object({})
})), asyncHandler(async (req, res) => {
  const data = req.validated.body;
  const sets = [];
  const params = [];
  if (Object.hasOwn(data, 'name')) { sets.push('name = ?'); params.push(data.name); }
  if (Object.hasOwn(data, 'description')) { sets.push('description = ?'); params.push(data.description ?? null); }
  if (Object.hasOwn(data, 'isActive')) { sets.push('is_active = ?'); params.push(data.isActive ? 1 : 0); }
  if (!sets.length) return ok(res, { id: req.params.id }, 'No changes were submitted.');
  params.push(req.params.id);
  const [result] = await pool.execute(`UPDATE employee_categories SET ${sets.join(', ')}, updated_at = NOW() WHERE id = ?`, params);
  if (!result.affectedRows) throw new AppError(404, 'Employee category not found.');
  await writeAudit({
    actorUserId: req.user.id, action: 'UPDATE_EMPLOYEE_CATEGORY', entityType: 'employee_categories',
    entityId: req.params.id, description: 'Updated an employee category.', ipAddress: req.ip, request: req,
    metadata: { fields: Object.keys(data) }
  });
  return ok(res, { id: req.params.id }, 'Employee category updated.');
}));

router.delete('/employee-categories/:id', authorize('employees.manage'), requireCsrf, asyncHandler(async (req, res) => {
  const [[usage]] = await pool.execute('SELECT COUNT(*) AS total FROM employees WHERE category_id = ?', [req.params.id]);
  if (Number(usage.total) > 0) {
    await pool.execute('UPDATE employee_categories SET is_active = 0, updated_at = NOW() WHERE id = ?', [req.params.id]);
    return ok(res, { id: req.params.id, deactivated: true }, 'Category is in use and was safely deactivated.');
  }
  const [result] = await pool.execute('DELETE FROM employee_categories WHERE id = ?', [req.params.id]);
  if (!result.affectedRows) throw new AppError(404, 'Employee category not found.');
  return ok(res, null, 'Unused employee category deleted.');
}));

router.get('/search', authorize('patients.read'), asyncHandler(async (req, res) => {
  const search = String(req.query.search || '').trim();
  if (search.length < 2) return ok(res, []);
  const like = `%${search}%`;
  const [rows] = await pool.execute(
    `${patientIdentitySelect()}
     WHERE p.archived_at IS NULL AND p.status='ACTIVE' AND (
       p.record_number LIKE ? OR s.student_number LIKE ? OR e.employee_number LIKE ? OR
       CONCAT_WS(' ',COALESCE(s.first_name,e.first_name),COALESCE(s.middle_name,e.middle_name),COALESCE(s.last_name,e.last_name)) LIKE ? OR
       COALESCE(s.registered_email,e.email,'') LIKE ? OR COALESCE(s.contact_number,e.contact_number,'') LIKE ?
     ) ORDER BY last_name,first_name LIMIT 20`,
    [like, like, like, like, like, like]
  );
  return ok(res, rows.map((row) => ({ ...row, name: patientDisplayName(row) })));
}));

router.get('/', authorize('patients.read'), asyncHandler(async (req, res) => {
  const { page, limit, offset } = paginationFromQuery(req.query);
  const clauses = ['p.archived_at IS NULL'];
  const params = [];
  if (req.query.patientType) { clauses.push('p.patient_type=?'); params.push(req.query.patientType); }
  if (req.query.status) { clauses.push('p.status=?'); params.push(req.query.status); }
  if (req.query.search) {
    const like = `%${String(req.query.search).trim()}%`;
    clauses.push(`(p.record_number LIKE ? OR s.student_number LIKE ? OR e.employee_number LIKE ? OR
      CONCAT_WS(' ',COALESCE(s.first_name,e.first_name),COALESCE(s.middle_name,e.middle_name),COALESCE(s.last_name,e.last_name)) LIKE ? OR
      COALESCE(s.registered_email,e.email,'') LIKE ? OR COALESCE(s.contact_number,e.contact_number,'') LIKE ?)`);
    params.push(like, like, like, like, like, like);
  }
  if (req.query.program) { clauses.push('s.program=?'); params.push(req.query.program); }
  if (req.query.yearLevel) { clauses.push('s.year_level=?'); params.push(req.query.yearLevel); }
  if (req.query.section) { clauses.push('s.section=?'); params.push(req.query.section); }
  if (req.query.enrollmentStatus) { clauses.push('s.enrollment_status=?'); params.push(req.query.enrollmentStatus); }
  if (req.query.employeeCategoryId) { clauses.push('e.category_id=?'); params.push(req.query.employeeCategoryId); }
  if (req.query.department) { clauses.push('e.department=?'); params.push(req.query.department); }
  if (req.query.employmentStatus) { clauses.push('e.employment_status=?'); params.push(req.query.employmentStatus); }
  const where = clauses.join(' AND ');
  const [counts] = await pool.execute(
    `SELECT COUNT(*) AS total FROM patients p LEFT JOIN students s ON s.id=p.student_id LEFT JOIN employees e ON e.id=p.employee_id LEFT JOIN employee_categories ec ON ec.id=e.category_id WHERE ${where}`,
    params
  );
  const [rows] = await pool.execute(
    `SELECT ${patientIdentityColumns},
      TIMESTAMPDIFF(YEAR,COALESCE(s.birth_date,e.birth_date),CURDATE()) AS age,
      (SELECT MAX(v.visit_date) FROM visits v WHERE v.patient_id=p.id) AS last_visit,
      (SELECT COUNT(*) FROM visits v WHERE v.patient_id=p.id) AS total_visits
     ${patientIdentityFrom()}
     WHERE ${where}
     ORDER BY last_name,first_name LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  const [filterRows] = await pool.query(
    `SELECT DISTINCT s.program,s.year_level,s.section,e.department,e.category_id,ec.name employee_category
     FROM patients p LEFT JOIN students s ON s.id=p.student_id LEFT JOIN employees e ON e.id=p.employee_id LEFT JOIN employee_categories ec ON ec.id=e.category_id
     WHERE p.archived_at IS NULL`
  );
  return ok(res, { items: rows.map((row) => ({ ...row, name: patientDisplayName(row) })), filters: filterRows }, 'Patients loaded.', paginationMeta(counts[0].total, page, limit));
}));

router.get('/duplicate-check', authorize('patients.read'), asyncHandler(async (req, res) => {
  const patientType = String(req.query.patientType || '').toUpperCase();
  const recordNumber = String(req.query.recordNumber || '').trim();
  const firstName = String(req.query.firstName || '').trim();
  const lastName = String(req.query.lastName || '').trim();
  const birthDate = String(req.query.birthDate || '').trim();
  if (!['STUDENT', 'EMPLOYEE'].includes(patientType)) throw new AppError(422, 'Select a valid patient type.');
  if (!recordNumber && !(firstName && lastName && /^\d{4}-\d{2}-\d{2}$/.test(birthDate))) {
    return ok(res, []);
  }
  const table = patientType === 'STUDENT' ? 'students' : 'employees';
  const identityId = patientType === 'STUDENT' ? 'student_id' : 'employee_id';
  const numberColumn = patientType === 'STUDENT' ? 'student_number' : 'employee_number';
  const clauses = [];
  const params = [];
  if (recordNumber) { clauses.push(`i.${numberColumn} = ?`); params.push(recordNumber); }
  if (firstName && lastName && /^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
    clauses.push('(LOWER(i.first_name)=LOWER(?) AND LOWER(i.last_name)=LOWER(?) AND i.birth_date=?)');
    params.push(firstName, lastName, birthDate);
  }
  const [rows] = await pool.execute(
    `SELECT p.id AS patient_id,p.record_number,p.patient_type,p.status,p.archived_at,p.archive_reason,
       i.${numberColumn} AS official_number,i.first_name,i.middle_name,i.last_name,i.birth_date
     FROM ${table} i JOIN patients p ON p.${identityId}=i.id
     WHERE ${clauses.join(' OR ')}
     ORDER BY p.archived_at IS NULL DESC,p.updated_at DESC LIMIT 10`, params
  );
  return ok(res, rows, rows.length ? 'Potential matching records found.' : 'No matching records found.');
}));

router.post('/', authorize('patients.write'), requireCsrf, validate(createPatientSchema), asyncHandler(async (req, res) => {
  const data = req.validated.body;
  const patientId = uuid();
  await withTransaction(async (connection) => {
    let studentId = null;
    let employeeId = null;
    let recordNumber;
    if (data.patientType === 'STUDENT') {
      studentId = patientId;
      recordNumber = data.identity.studentNumber;
      const i = data.identity;
      await connection.execute(
        `INSERT INTO students
         (id,student_number,first_name,middle_name,last_name,birth_date,sex,program,year_level,section,registered_email,contact_number,address,enrollment_status,academic_year,semester,portal_eligible,account_activation_status,account_linked)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'NOT_ACTIVATED',0)`,
        [studentId, i.studentNumber, i.firstName, i.middleName || null, i.lastName, i.birthDate, i.sex, i.program, i.yearLevel,
          i.section || null, i.registeredEmail, i.contactNumber || null, i.address || null, i.enrollmentStatus, i.academicYear, i.semester, i.portalEligible ? 1 : 0]
      );
      await connection.execute(
        `INSERT INTO student_enrollments (id,student_id,academic_year,semester,program,year_level,section,enrollment_status,is_current)
         VALUES (?,?,?,?,?,?,?,?,1)`,
        [uuid(), studentId, i.academicYear, i.semester, i.program, i.yearLevel, i.section || null, i.enrollmentStatus]
      );
    } else {
      employeeId = patientId;
      recordNumber = data.identity.employeeNumber;
      const i = data.identity;
      await connection.execute(
        `INSERT INTO employees
         (id,employee_number,category_id,first_name,middle_name,last_name,birth_date,sex,department,position_title,employment_status,email,contact_number,address)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [employeeId, i.employeeNumber, i.categoryId, i.firstName, i.middleName || null, i.lastName, i.birthDate, i.sex,
          i.department, i.positionTitle || null, i.employmentStatus, i.email || null, i.contactNumber || null, i.address || null]
      );
    }
    await connection.execute(
      'INSERT INTO patients (id,patient_type,student_id,employee_id,record_number,status) VALUES (?,?,?,?,?,?)',
      [patientId, data.patientType, studentId, employeeId, recordNumber,
        (data.patientType === 'STUDENT' ? data.identity.enrollmentStatus === 'ACTIVE' : data.identity.employmentStatus === 'ACTIVE') ? 'ACTIVE' : 'INACTIVE']
    );
    const m = data.medical || {};
    await connection.execute(
      `INSERT INTO patient_medical_history
       (id,patient_id,student_id,blood_type,allergies,existing_conditions,current_medications,medical_history,immunizations,important_alerts)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [uuid(), patientId, studentId, m.bloodType || null, m.allergies || null, m.existingConditions || null,
        m.currentMedications || null, m.medicalHistory || null, m.immunizations || null, m.importantAlerts || null]
    );
    if (data.guardian) {
      await connection.execute(
        `INSERT INTO guardians (id,patient_id,student_id,full_name,relationship,contact_number,email,is_primary)
         VALUES (?,?,?,?,?,?,?,1)`,
        [uuid(), patientId, studentId, data.guardian.fullName, data.guardian.relationship || null, data.guardian.contactNumber, data.guardian.email || null]
      );
    }
    if (data.emergencyContact) {
      await connection.execute(
        `INSERT INTO emergency_contacts (id,patient_id,student_id,full_name,relationship,contact_number,is_primary)
         VALUES (?,?,?,?,?,?,1)`,
        [uuid(), patientId, studentId, data.emergencyContact.fullName, data.emergencyContact.relationship || null, data.emergencyContact.contactNumber]
      );
    }
    await writeAudit({ actorUserId: req.user.id, action: 'CREATE_PATIENT', entityType: 'patients', entityId: patientId, description: `Registered ${data.patientType.toLowerCase()} patient ${recordNumber}.`, ipAddress: req.ip, request: req, connection });
  });
  return created(res, { id: patientId, patientType: data.patientType }, 'Patient registered successfully.');
}));

router.get('/:id', authorize('patients.read'), asyncHandler(async (req, res) => {
  const [patients] = await pool.execute(
    `SELECT ${patientIdentityColumns},
      TIMESTAMPDIFF(YEAR,COALESCE(s.birth_date,e.birth_date),CURDATE()) AS age,
      pmh.blood_type,pmh.allergies,pmh.existing_conditions,pmh.current_medications,pmh.medical_history,pmh.immunizations,pmh.important_alerts
     ${patientIdentityFrom()}
     LEFT JOIN patient_medical_history pmh ON pmh.patient_id=p.id
     WHERE p.id=?`,
    [req.params.id]
  );
  if (!patients.length) throw new AppError(404, 'Patient record not found.');
  const patient = { ...patients[0], name: patientDisplayName(patients[0]) };
  const [guardians] = await pool.execute('SELECT * FROM guardians WHERE patient_id=? ORDER BY is_primary DESC,created_at', [req.params.id]);
  const [emergencyContacts] = await pool.execute('SELECT * FROM emergency_contacts WHERE patient_id=? ORDER BY is_primary DESC,created_at', [req.params.id]);
  const [[summary]] = await pool.execute(
    `SELECT
      COUNT(DISTINCT v.id) total_visits,
      MAX(v.visit_date) last_visit,
      (SELECT complaint FROM visits WHERE patient_id=? GROUP BY complaint ORDER BY COUNT(*) DESC LIMIT 1) common_complaint,
      MAX(c.updated_at) latest_consultation
     FROM visits v LEFT JOIN consultations c ON c.visit_id=v.id WHERE v.patient_id=?`,
    [req.params.id, req.params.id]
  );
  const [visits] = await pool.execute(
    `SELECT v.*,c.id consultation_id,c.consultation_number,c.status consultation_status,c.diagnosis
     FROM visits v LEFT JOIN consultations c ON c.visit_id=v.id WHERE v.patient_id=? ORDER BY v.visit_date DESC,v.visit_time DESC LIMIT 50`,
    [req.params.id]
  );
  const [issuances] = await pool.execute(
    `SELECT mi.id,mi.issuance_number,mi.issued_at,mi.status,GROUP_CONCAT(CONCAT(m.generic_name,' × ',mii.quantity,' ',m.unit) SEPARATOR ', ') medicines
     FROM medicine_issuances mi JOIN medicine_issuance_items mii ON mii.issuance_id=mi.id JOIN medicines m ON m.id=mii.medicine_id
     WHERE mi.patient_id=? GROUP BY mi.id ORDER BY mi.issued_at DESC LIMIT 20`, [req.params.id]
  );
  const [measurements] = await pool.execute('SELECT * FROM patient_measurements WHERE patient_id=? ORDER BY measured_on DESC,created_at DESC LIMIT 30', [req.params.id]);
  const [followUps] = await pool.execute(
    `SELECT f.*,c.consultation_number,a.appointment_number FROM follow_ups f JOIN consultations c ON c.id=f.consultation_id LEFT JOIN appointments a ON a.id=f.appointment_id WHERE f.patient_id=? ORDER BY f.target_date DESC`,
    [req.params.id]
  );
  const [attachments] = await pool.execute('SELECT id,original_name,mime_type,file_size,description,created_at FROM medical_attachments WHERE patient_id=? ORDER BY created_at DESC', [req.params.id]);
  await auditRecordAccess({ req, entityType: 'patients', entityId: req.params.id, description: `Viewed medical profile for ${patient.record_number}.`, metadata: { patientType: patient.patient_type } });
  return ok(res, { patient, guardians, emergencyContacts, summary, visits, issuances, measurements, followUps, attachments });
}));

const updateSchema = z.object({
  body: z.object({
    identity: z.record(z.any()).optional(),
    medical: medicalSchema,
    guardian: contactSchema.partial().optional().nullable(),
    emergencyContact: contactSchema.partial().optional().nullable()
  }),
  params: z.object({ id: z.string().uuid() }),
  query: z.object({})
});

router.patch('/:id', authorize('patients.write'), requireCsrf, validate(updateSchema), asyncHandler(async (req, res) => {
  await withTransaction(async (connection) => {
    const [patientRows] = await connection.execute('SELECT * FROM patients WHERE id=? FOR UPDATE', [req.params.id]);
    if (!patientRows.length) throw new AppError(404, 'Patient record not found.');
    const p = patientRows[0];
    if (p.archived_at) throw new AppError(409, 'Archived patient records are read-only. Restore the patient before editing.');
    const i = req.validated.body.identity || {};
    if (p.patient_type === 'STUDENT') {
      const map = { studentNumber:'student_number', firstName:'first_name', middleName:'middle_name', lastName:'last_name', birthDate:'birth_date', sex:'sex', program:'program', yearLevel:'year_level', section:'section', registeredEmail:'registered_email', contactNumber:'contact_number', address:'address', enrollmentStatus:'enrollment_status', academicYear:'academic_year', semester:'semester', portalEligible:'portal_eligible' };
      const sets=[]; const params=[];
      for (const [key,column] of Object.entries(map)) if (Object.hasOwn(i,key)) { sets.push(`${column}=?`); params.push(key==='portalEligible'?(i[key]?1:0):(i[key] || null)); }
      if (sets.length) { params.push(p.student_id); await connection.execute(`UPDATE students SET ${sets.join(',')},updated_at=NOW() WHERE id=?`, params); }
      if (i.studentNumber) await connection.execute('UPDATE patients SET record_number=?,updated_at=NOW() WHERE id=?', [i.studentNumber, req.params.id]);
      if (i.enrollmentStatus) await connection.execute('UPDATE patients SET status=? WHERE id=?', [i.enrollmentStatus==='ACTIVE'?'ACTIVE':'INACTIVE', req.params.id]);
    } else {
      const map = { employeeNumber:'employee_number', categoryId:'category_id', firstName:'first_name', middleName:'middle_name', lastName:'last_name', birthDate:'birth_date', sex:'sex', department:'department', positionTitle:'position_title', employmentStatus:'employment_status', email:'email', contactNumber:'contact_number', address:'address' };
      const sets=[]; const params=[];
      for (const [key,column] of Object.entries(map)) if (Object.hasOwn(i,key)) { sets.push(`${column}=?`); params.push(i[key] || null); }
      if (sets.length) { params.push(p.employee_id); await connection.execute(`UPDATE employees SET ${sets.join(',')},updated_at=NOW() WHERE id=?`, params); }
      if (i.employeeNumber) await connection.execute('UPDATE patients SET record_number=?,updated_at=NOW() WHERE id=?', [i.employeeNumber, req.params.id]);
      if (i.employmentStatus) await connection.execute('UPDATE patients SET status=? WHERE id=?', [i.employmentStatus==='ACTIVE'?'ACTIVE':'INACTIVE', req.params.id]);
    }
    const m = req.validated.body.medical;
    if (m) {
      const map = { bloodType:'blood_type', allergies:'allergies', existingConditions:'existing_conditions', currentMedications:'current_medications', medicalHistory:'medical_history', immunizations:'immunizations', importantAlerts:'important_alerts' };
      const sets=[]; const params=[];
      for (const [key,column] of Object.entries(map)) if (Object.hasOwn(m,key)) { sets.push(`${column}=?`); params.push(m[key] || null); }
      if (sets.length) { params.push(req.params.id); await connection.execute(`UPDATE patient_medical_history SET ${sets.join(',')},updated_at=NOW() WHERE patient_id=?`, params); }
    }
    for (const [type, table] of [['guardian','guardians'],['emergencyContact','emergency_contacts']]) {
      const value = req.validated.body[type];
      if (!value) continue;
      const [existing] = await connection.execute(`SELECT id FROM ${table} WHERE patient_id=? ORDER BY is_primary DESC,created_at LIMIT 1`, [req.params.id]);
      const fields = ['full_name=?','relationship=?','contact_number=?'];
      const values = [value.fullName || null, value.relationship || null, value.contactNumber || null];
      if (table === 'guardians') { fields.push('email=?'); values.push(value.email || null); }
      if (existing.length) { values.push(existing[0].id); await connection.execute(`UPDATE ${table} SET ${fields.join(',')},updated_at=NOW() WHERE id=?`, values); }
    }
    await writeAudit({ actorUserId: req.user.id, action: 'UPDATE_PATIENT', entityType: 'patients', entityId: req.params.id, description: 'Updated patient information.', ipAddress: req.ip, metadata: { fields: Object.keys(req.validated.body) }, request: req, connection });
  });
  return ok(res, { id: req.params.id }, 'Patient record updated.');
}));

router.delete('/:id', authorize('patients.archive'), requireCsrf, asyncHandler(async (_req, _res) => {
  throw new AppError(409, 'Patient deactivation has been replaced by the audited Archive action. Use POST /api/archives/patients/:id/archive.');
}));

export default router;
