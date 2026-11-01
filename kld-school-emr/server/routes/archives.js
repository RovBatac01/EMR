import express from 'express';
import { z } from 'zod';
import { pool, withTransaction } from '../config/db.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { requireCsrf } from '../middleware/csrf.js';
import { validate } from '../middleware/validate.js';
import { AppError, asyncHandler, ok } from '../utils/http.js';
import { paginationFromQuery, paginationMeta } from '../utils/pagination.js';
import { uuid } from '../utils/ids.js';
import { writeAudit } from '../utils/audit.js';
import {
  patientIdentityColumns,
  patientIdentityFrom,
  patientDisplayName
} from '../services/patients/patientService.js';

const router = express.Router();
router.use(authenticate);

const patientActiveAppointmentStatuses = [
  'PENDING', 'CONFIRMED', 'PROPOSED', 'CHECKED_IN', 'IN_QUEUE', 'IN_CONSULTATION'
];

async function patientArchiveChecks(connection, patientId, { lock = false } = {}) {
  const lockClause = lock ? ' FOR UPDATE' : '';
  const [patientRows] = await connection.execute(
    `${patientIdentityFrom()}
     WHERE p.id = ?${lockClause}`.replace(/^FROM/, `SELECT ${patientIdentityColumns} FROM`),
    [patientId]
  );
  if (!patientRows.length) throw new AppError(404, 'Patient record not found.');
  const patient = patientRows[0];

  const appointmentPlaceholders = patientActiveAppointmentStatuses.map(() => '?').join(',');
  const [[appointments]] = await connection.execute(
    `SELECT COUNT(*) AS total
     FROM appointments
     WHERE patient_id = ? AND status IN (${appointmentPlaceholders})`,
    [patientId, ...patientActiveAppointmentStatuses]
  );
  const [[visits]] = await connection.execute(
    `SELECT COUNT(*) AS total
     FROM visits
     WHERE patient_id = ? AND status IN ('REGISTERED','IN_PROGRESS')`,
    [patientId]
  );
  const [[followUps]] = await connection.execute(
    `SELECT COUNT(*) AS total
     FROM follow_ups
     WHERE patient_id = ? AND status IN ('PENDING','SCHEDULED')`,
    [patientId]
  );

  const blockers = {
    activeAppointments: Number(appointments.total),
    openVisits: Number(visits.total),
    activeFollowUps: Number(followUps.total)
  };
  return {
    patient,
    blockers,
    canArchive: Object.values(blockers).every((value) => value === 0)
  };
}

async function medicineArchiveChecks(connection, medicineId, { lock = false } = {}) {
  const [medicineRows] = await connection.execute(
    `SELECT m.*, mc.name AS category_name
     FROM medicines m
     LEFT JOIN medicine_categories mc ON mc.id = m.category_id
     WHERE m.id = ?${lock ? ' FOR UPDATE' : ''}`,
    [medicineId]
  );
  if (!medicineRows.length) throw new AppError(404, 'Medicine record not found.');

  const [[stock]] = await connection.execute(
    `SELECT
       COALESCE(SUM(quantity),0) AS total_quantity,
       COALESCE(SUM(CASE WHEN expiration_date < CURDATE() THEN quantity ELSE 0 END),0) AS expired_quantity
     FROM medicine_batches
     WHERE medicine_id = ?`,
    [medicineId]
  );
  const [[adjustments]] = await connection.execute(
    `SELECT COUNT(*) AS total
     FROM inventory_adjustment_requests
     WHERE medicine_id = ? AND status IN ('PENDING','APPROVED')`,
    [medicineId]
  );
  const [[stockCounts]] = await connection.execute(
    `SELECT COUNT(*) AS total
     FROM stock_count_items sci
     JOIN stock_count_sessions scs ON scs.id = sci.session_id
     WHERE sci.medicine_id = ? AND scs.status IN ('OPEN','SUBMITTED')`,
    [medicineId]
  );

  const blockers = {
    pendingAdjustments: Number(adjustments.total),
    openStockCounts: Number(stockCounts.total)
  };
  return {
    medicine: medicineRows[0],
    stock: {
      totalQuantity: Number(stock.total_quantity),
      expiredQuantity: Number(stock.expired_quantity)
    },
    blockers,
    canArchive: Object.values(blockers).every((value) => value === 0)
  };
}

router.get('/patients', authorize('archives.read'), asyncHandler(async (req, res) => {
  const { page, limit, offset } = paginationFromQuery(req.query);
  const clauses = ['p.archived_at IS NOT NULL'];
  const params = [];
  if (req.query.patientType) {
    clauses.push('p.patient_type = ?');
    params.push(req.query.patientType);
  }
  if (req.query.search) {
    const like = `%${String(req.query.search).trim()}%`;
    clauses.push(`(
      p.record_number LIKE ? OR s.student_number LIKE ? OR e.employee_number LIKE ? OR
      CONCAT_WS(' ', COALESCE(s.first_name,e.first_name), COALESCE(s.middle_name,e.middle_name), COALESCE(s.last_name,e.last_name)) LIKE ? OR
      COALESCE(s.registered_email,e.email,'') LIKE ?
    )`);
    params.push(like, like, like, like, like);
  }
  if (req.query.dateFrom) { clauses.push('DATE(p.archived_at) >= ?'); params.push(req.query.dateFrom); }
  if (req.query.dateTo) { clauses.push('DATE(p.archived_at) <= ?'); params.push(req.query.dateTo); }
  const where = clauses.join(' AND ');

  const [[countRow]] = await pool.execute(
    `SELECT COUNT(*) AS total ${patientIdentityFrom()} WHERE ${where}`,
    params
  );
  const [rows] = await pool.execute(
    `SELECT ${patientIdentityColumns}, p.archived_at, p.archive_reason,
       au.username AS archived_by_username,
       COALESCE(CONCAT_WS(' ', ast.first_name, ast.middle_name, ast.last_name), au.username) AS archived_by_name,
       (SELECT COUNT(*) FROM visits v WHERE v.patient_id = p.id) AS total_visits,
       (SELECT MAX(v.visit_date) FROM visits v WHERE v.patient_id = p.id) AS last_visit
     ${patientIdentityFrom()}
     LEFT JOIN users au ON au.id = p.archived_by
     LEFT JOIN staff ast ON ast.user_id = au.id
     WHERE ${where}
     ORDER BY p.archived_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  return ok(
    res,
    rows.map((row) => ({ ...row, name: patientDisplayName(row) })),
    'Archived patients loaded.',
    paginationMeta(countRow.total, page, limit)
  );
}));

router.get('/medicines', authorize('archives.read'), asyncHandler(async (req, res) => {
  const { page, limit, offset } = paginationFromQuery(req.query);
  const clauses = ['m.archived_at IS NOT NULL'];
  const params = [];
  if (req.query.search) {
    const like = `%${String(req.query.search).trim()}%`;
    clauses.push('(m.medicine_code LIKE ? OR m.generic_name LIKE ? OR COALESCE(m.brand_name,\'\') LIKE ?)');
    params.push(like, like, like);
  }
  if (req.query.categoryId) { clauses.push('m.category_id = ?'); params.push(req.query.categoryId); }
  if (req.query.dateFrom) { clauses.push('DATE(m.archived_at) >= ?'); params.push(req.query.dateFrom); }
  if (req.query.dateTo) { clauses.push('DATE(m.archived_at) <= ?'); params.push(req.query.dateTo); }
  const where = clauses.join(' AND ');

  const [[countRow]] = await pool.execute(`SELECT COUNT(*) AS total FROM medicines m WHERE ${where}`, params);
  const [rows] = await pool.execute(
    `SELECT m.*, mc.name AS category_name,
       COALESCE(SUM(mb.quantity),0) AS total_quantity,
       COALESCE(SUM(CASE WHEN mb.expiration_date >= CURDATE() THEN mb.quantity ELSE 0 END),0) AS available_quantity,
       au.username AS archived_by_username,
       COALESCE(CONCAT_WS(' ', ast.first_name, ast.middle_name, ast.last_name), au.username) AS archived_by_name
     FROM medicines m
     LEFT JOIN medicine_categories mc ON mc.id = m.category_id
     LEFT JOIN medicine_batches mb ON mb.medicine_id = m.id
     LEFT JOIN users au ON au.id = m.archived_by
     LEFT JOIN staff ast ON ast.user_id = au.id
     WHERE ${where}
     GROUP BY m.id, mc.name, au.username, ast.first_name, ast.middle_name, ast.last_name
     ORDER BY m.archived_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  return ok(res, rows, 'Archived medicines loaded.', paginationMeta(countRow.total, page, limit));
}));

router.get('/patients/:id/eligibility', authorize('patients.archive'), asyncHandler(async (req, res) => {
  const result = await patientArchiveChecks(pool, req.params.id);
  return ok(res, {
    canArchive: result.canArchive,
    alreadyArchived: Boolean(result.patient.archived_at),
    blockers: result.blockers,
    recordNumber: result.patient.record_number,
    patientName: patientDisplayName(result.patient)
  });
}));

router.post('/patients/:id/archive', authorize('patients.archive'), requireCsrf, validate(z.object({
  body: z.object({ reason: z.string().trim().max(1000).optional().nullable() }),
  params: z.object({ id: z.string().uuid() }),
  query: z.object({})
})), asyncHandler(async (req, res) => {
  let result;
  await withTransaction(async (connection) => {
    const check = await patientArchiveChecks(connection, req.params.id, { lock: true });
    if (check.patient.archived_at) {
      result = { id: req.params.id, alreadyArchived: true };
      return;
    }
    if (!check.canArchive) {
      throw new AppError(409, 'Resolve the patient’s active appointments, open visits, and scheduled follow-ups before archiving.', {
        code: 'PATIENT_ARCHIVE_BLOCKED',
        blockers: check.blockers
      });
    }
    await connection.execute(
      `UPDATE patients
       SET pre_archive_status = status, status = 'INACTIVE', archived_at = NOW(), archived_by = ?,
           archive_reason = ?, unarchived_at = NULL, unarchived_by = NULL, updated_at = NOW()
       WHERE id = ?`,
      [req.user.id, req.validated.body.reason || null, req.params.id]
    );
    await connection.execute(
      `INSERT INTO archive_events (id, entity_type, entity_id, action, reason, actor_user_id, metadata_json)
       VALUES (?, 'PATIENT', ?, 'ARCHIVE', ?, ?, ?)`,
      [uuid(), req.params.id, req.validated.body.reason || null, req.user.id, JSON.stringify({ blockers: check.blockers })]
    );
    await writeAudit({
      actorUserId: req.user.id,
      action: 'ARCHIVE_PATIENT',
      entityType: 'patients',
      entityId: req.params.id,
      description: `Archived patient ${check.patient.record_number}.`,
      ipAddress: req.ip,
      metadata: { reason: req.validated.body.reason || null },
      request: req,
      connection
    });
    result = { id: req.params.id, archived: true };
  });
  return ok(res, result, result.alreadyArchived ? 'Patient was already archived.' : 'Patient archived without deleting medical history.');
}));

router.post('/patients/:id/unarchive', authorize('patients.unarchive'), requireCsrf, validate(z.object({
  body: z.object({ confirmation: z.literal(true) }),
  params: z.object({ id: z.string().uuid() }),
  query: z.object({})
})), asyncHandler(async (req, res) => {
  let result;
  await withTransaction(async (connection) => {
    const [rows] = await connection.execute('SELECT * FROM patients WHERE id = ? FOR UPDATE', [req.params.id]);
    if (!rows.length) throw new AppError(404, 'Patient record not found.');
    const patient = rows[0];
    if (!patient.archived_at) {
      result = { id: patient.id, alreadyActive: true };
      return;
    }
    const [conflicts] = await connection.execute(
      `SELECT id, record_number FROM patients
       WHERE id <> ? AND archived_at IS NULL AND (
         record_number = ? OR
         (? IS NOT NULL AND student_id = ?) OR
         (? IS NOT NULL AND employee_id = ?)
       ) LIMIT 1 FOR UPDATE`,
      [patient.id, patient.record_number, patient.student_id, patient.student_id, patient.employee_id, patient.employee_id]
    );
    if (conflicts.length) {
      throw new AppError(409, `Patient cannot be restored because active record ${conflicts[0].record_number} conflicts with it.`, {
        code: 'PATIENT_UNARCHIVE_CONFLICT',
        conflictingPatientId: conflicts[0].id
      });
    }
    await connection.execute(
      `UPDATE patients
       SET status = COALESCE(pre_archive_status, 'ACTIVE'), pre_archive_status = NULL,
           archived_at = NULL, archived_by = NULL, archive_reason = NULL,
           unarchived_at = NOW(), unarchived_by = ?, updated_at = NOW()
       WHERE id = ?`,
      [req.user.id, patient.id]
    );
    await connection.execute(
      `INSERT INTO archive_events (id, entity_type, entity_id, action, actor_user_id)
       VALUES (?, 'PATIENT', ?, 'UNARCHIVE', ?)`,
      [uuid(), patient.id, req.user.id]
    );
    await writeAudit({
      actorUserId: req.user.id,
      action: 'UNARCHIVE_PATIENT',
      entityType: 'patients',
      entityId: patient.id,
      description: `Restored patient ${patient.record_number} to the active registry.`,
      ipAddress: req.ip,
      request: req,
      connection
    });
    result = { id: patient.id, restored: true };
  });
  return ok(res, result, result.alreadyActive ? 'Patient is already active.' : 'Patient restored with the original record and medical history.');
}));

router.get('/medicines/:id/eligibility', authorize('medicines.archive'), asyncHandler(async (req, res) => {
  const result = await medicineArchiveChecks(pool, req.params.id);
  return ok(res, {
    canArchive: result.canArchive,
    alreadyArchived: Boolean(result.medicine.archived_at),
    blockers: result.blockers,
    stock: result.stock,
    medicineCode: result.medicine.medicine_code,
    medicineName: result.medicine.generic_name
  });
}));

router.post('/medicines/:id/archive', authorize('medicines.archive'), requireCsrf, validate(z.object({
  body: z.object({
    reason: z.string().trim().max(1000).optional().nullable(),
    acknowledgeRemainingStock: z.boolean().optional().default(false)
  }),
  params: z.object({ id: z.string().uuid() }),
  query: z.object({})
})), asyncHandler(async (req, res) => {
  let result;
  await withTransaction(async (connection) => {
    const check = await medicineArchiveChecks(connection, req.params.id, { lock: true });
    if (check.medicine.archived_at) {
      result = { id: req.params.id, alreadyArchived: true };
      return;
    }
    if (!check.canArchive) {
      throw new AppError(409, 'Resolve pending inventory adjustments and open stock counts before archiving this medicine.', {
        code: 'MEDICINE_ARCHIVE_BLOCKED',
        blockers: check.blockers,
        stock: check.stock
      });
    }
    if (check.stock.totalQuantity > 0 && !req.validated.body.acknowledgeRemainingStock) {
      throw new AppError(409, 'This medicine still has stock. Confirm that the stock will remain unchanged but unavailable for new issuance.', {
        code: 'REMAINING_STOCK_CONFIRMATION_REQUIRED',
        stock: check.stock
      });
    }
    await connection.execute(
      `UPDATE medicines
       SET pre_archive_is_active = is_active, is_active = 0, archived_at = NOW(), archived_by = ?,
           archive_reason = ?, unarchived_at = NULL, unarchived_by = NULL, updated_at = NOW()
       WHERE id = ?`,
      [req.user.id, req.validated.body.reason || null, req.params.id]
    );
    await connection.execute(
      `INSERT INTO archive_events (id, entity_type, entity_id, action, reason, actor_user_id, metadata_json)
       VALUES (?, 'MEDICINE', ?, 'ARCHIVE', ?, ?, ?)`,
      [uuid(), req.params.id, req.validated.body.reason || null, req.user.id, JSON.stringify({ stock: check.stock })]
    );
    await writeAudit({
      actorUserId: req.user.id,
      action: 'ARCHIVE_MEDICINE',
      entityType: 'medicines',
      entityId: req.params.id,
      description: `Archived medicine ${check.medicine.medicine_code} without changing stock balances.`,
      ipAddress: req.ip,
      metadata: { reason: req.validated.body.reason || null, stock: check.stock },
      request: req,
      connection
    });
    result = { id: req.params.id, archived: true, stock: check.stock };
  });
  return ok(res, result, result.alreadyArchived ? 'Medicine was already archived.' : 'Medicine archived. Existing stock and transactions were preserved.');
}));

router.post('/medicines/:id/unarchive', authorize('medicines.unarchive'), requireCsrf, validate(z.object({
  body: z.object({ confirmation: z.literal(true) }),
  params: z.object({ id: z.string().uuid() }),
  query: z.object({})
})), asyncHandler(async (req, res) => {
  let result;
  await withTransaction(async (connection) => {
    const [rows] = await connection.execute(
      `SELECT m.*, mc.is_active AS category_active
       FROM medicines m LEFT JOIN medicine_categories mc ON mc.id = m.category_id
       WHERE m.id = ? FOR UPDATE`,
      [req.params.id]
    );
    if (!rows.length) throw new AppError(404, 'Medicine record not found.');
    const medicine = rows[0];
    if (!medicine.archived_at) {
      result = { id: medicine.id, alreadyActive: true };
      return;
    }
    if (medicine.category_id && Number(medicine.category_active) !== 1) {
      throw new AppError(409, 'Reactivate or change the medicine category before restoring this medicine.', {
        code: 'MEDICINE_CATEGORY_INACTIVE'
      });
    }
    const [conflicts] = await connection.execute(
      `SELECT id, medicine_code FROM medicines
       WHERE id <> ? AND archived_at IS NULL AND (
         medicine_code = ? OR (
           LOWER(generic_name) = LOWER(?) AND
           LOWER(COALESCE(brand_name,'')) = LOWER(COALESCE(?,'')) AND
           LOWER(dosage_form) = LOWER(?)
         )
       ) LIMIT 1 FOR UPDATE`,
      [medicine.id, medicine.medicine_code, medicine.generic_name, medicine.brand_name, medicine.dosage_form]
    );
    if (conflicts.length) {
      throw new AppError(409, `Medicine cannot be restored because active record ${conflicts[0].medicine_code} conflicts with it.`, {
        code: 'MEDICINE_UNARCHIVE_CONFLICT',
        conflictingMedicineId: conflicts[0].id
      });
    }
    await connection.execute(
      `UPDATE medicines
       SET is_active = COALESCE(pre_archive_is_active, 1), pre_archive_is_active = NULL,
           archived_at = NULL, archived_by = NULL, archive_reason = NULL,
           unarchived_at = NOW(), unarchived_by = ?, updated_at = NOW()
       WHERE id = ?`,
      [req.user.id, medicine.id]
    );
    await connection.execute(
      `INSERT INTO archive_events (id, entity_type, entity_id, action, actor_user_id)
       VALUES (?, 'MEDICINE', ?, 'UNARCHIVE', ?)`,
      [uuid(), medicine.id, req.user.id]
    );
    await writeAudit({
      actorUserId: req.user.id,
      action: 'UNARCHIVE_MEDICINE',
      entityType: 'medicines',
      entityId: medicine.id,
      description: `Restored medicine ${medicine.medicine_code} with its original stock and transaction history.`,
      ipAddress: req.ip,
      request: req,
      connection
    });
    result = { id: medicine.id, restored: true };
  });
  return ok(res, result, result.alreadyActive ? 'Medicine is already active.' : 'Medicine restored with its original stock and history.');
}));

export default router;
