import express from 'express';
import { z } from 'zod';
import { pool, withTransaction } from '../config/db.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { requireCsrf } from '../middleware/csrf.js';
import { validate } from '../middleware/validate.js';
import { AppError, asyncHandler, created, ok } from '../utils/http.js';
import { paginationFromQuery, paginationMeta } from '../utils/pagination.js';
import { reference, uuid } from '../utils/ids.js';
import { auditRecordAccess, writeAudit } from '../utils/audit.js';
import { getPatientById, patientIdentityColumns, patientIdentityFrom } from '../services/patients/patientService.js';

const router = express.Router();
router.use(authenticate);

const emptyToNull = (schema) => z.preprocess((value) => value === '' || value === undefined ? null : value, schema.nullable());
const issuanceSchema = z.object({
  body: z.object({
    patientId: z.string().uuid().optional(),
    studentId: z.string().uuid().optional(),
    visitId: emptyToNull(z.string().uuid()).optional(),
    consultationId: emptyToNull(z.string().uuid()).optional(),
    notes: emptyToNull(z.string().trim().max(3000)).optional(),
    idempotencyKey: z.string().trim().min(8).max(120).optional(),
    items: z.array(z.object({
      medicineId: z.string().uuid(),
      batchId: emptyToNull(z.string().uuid()).optional(),
      quantity: z.coerce.number().int().positive().max(10000),
      dosage: z.string().trim().min(1).max(300),
      frequency: z.string().trim().min(1).max(300),
      duration: z.string().trim().min(1).max(300),
      instructions: emptyToNull(z.string().trim().max(1000)).optional()
    })).min(1).max(20)
  }).refine((value) => value.patientId || value.studentId, { message: 'Select a patient.', path: ['patientId'] }),
  params: z.object({}),
  query: z.object({})
});

async function resolvePatient(connection, data, { forUpdate = false } = {}) {
  if (data.patientId) return getPatientById(connection, data.patientId, { forUpdate });
  const [rows] = await connection.execute('SELECT id FROM patients WHERE student_id = ?', [data.studentId]);
  if (!rows.length) throw new AppError(404, 'Patient record not found.');
  return getPatientById(connection, rows[0].id, { forUpdate });
}

router.get('/', authorize('medicines.read'), asyncHandler(async (req, res) => {
  const { page, limit, offset } = paginationFromQuery(req.query);
  const clauses = ['1=1'];
  const params = [];
  if (req.query.search) {
    const like = `%${String(req.query.search).trim()}%`;
    clauses.push(`(
      mi.issuance_number LIKE ? OR p.record_number LIKE ? OR
      CONCAT_WS(' ', s.first_name, s.middle_name, s.last_name) LIKE ? OR
      CONCAT_WS(' ', e.first_name, e.middle_name, e.last_name) LIKE ? OR
      m.generic_name LIKE ?
    )`);
    params.push(like, like, like, like, like);
  }
  if (req.query.patientType) { clauses.push('p.patient_type = ?'); params.push(req.query.patientType); }
  if (req.query.dateFrom) { clauses.push('DATE(mi.issued_at) >= ?'); params.push(req.query.dateFrom); }
  if (req.query.dateTo) { clauses.push('DATE(mi.issued_at) <= ?'); params.push(req.query.dateTo); }
  if (req.query.status) { clauses.push('mi.status = ?'); params.push(req.query.status); }
  const where = clauses.join(' AND ');
  const joins = patientIdentityFrom('mi.patient_id');
  const [counts] = await pool.execute(
    `SELECT COUNT(DISTINCT mi.id) AS total
     FROM medicine_issuances mi ${joins}
     JOIN medicine_issuance_items mii ON mii.issuance_id = mi.id
     JOIN medicines m ON m.id = mii.medicine_id
     WHERE ${where}`,
    params
  );
  const [rows] = await pool.execute(
    `SELECT mi.*, ${patientIdentityColumns},
       CONCAT_WS(' ', st.first_name, st.last_name) AS issued_by_name,
       GROUP_CONCAT(CONCAT(m.generic_name, ' × ', mii.quantity, ' ', m.unit) ORDER BY m.generic_name SEPARATOR ', ') AS items
     FROM medicine_issuances mi ${joins}
     JOIN staff st ON st.id = mi.issued_by
     JOIN medicine_issuance_items mii ON mii.issuance_id = mi.id
     JOIN medicines m ON m.id = mii.medicine_id
     WHERE ${where}
     GROUP BY mi.id
     ORDER BY mi.issued_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  return ok(res, rows, 'Medicine issuance history loaded.', paginationMeta(counts[0].total, page, limit));
}));

router.post('/', authorize('medicines.issue'), requireCsrf, validate(issuanceSchema), asyncHandler(async (req, res) => {
  if (!req.user.staff_id) throw new AppError(403, 'A clinic staff profile is required to issue medicines.');
  const data = req.validated.body;
  const issuanceId = uuid();
  const issuanceNumber = reference('ISS');

  const result = await withTransaction(async (connection) => {
    if (data.idempotencyKey) {
      await connection.execute(
        `INSERT IGNORE INTO api_idempotency_keys
          (id, user_id, scope, idempotency_key, expires_at)
         VALUES (?, ?, 'MEDICINE_ISSUANCE', ?, DATE_ADD(NOW(), INTERVAL 1 DAY))`,
        [uuid(), req.user.id, data.idempotencyKey]
      );
      const [existingKeys] = await connection.execute(
        `SELECT resource_id, response_json FROM api_idempotency_keys
         WHERE user_id = ? AND scope = 'MEDICINE_ISSUANCE' AND idempotency_key = ?
         FOR UPDATE`,
        [req.user.id, data.idempotencyKey]
      );
      if (existingKeys[0]?.resource_id) {
        try { return JSON.parse(existingKeys[0].response_json); }
        catch { return { id: existingKeys[0].resource_id }; }
      }
    }

    const patient = await resolvePatient(connection, data, { forUpdate: true });
    if (patient.archived_at) throw new AppError(409, 'This patient record is archived and cannot receive new medicine issuances.');
    if (patient.patient_status !== 'ACTIVE') throw new AppError(409, 'This patient record is inactive.');

    if (data.visitId) {
      const [visits] = await connection.execute('SELECT id FROM visits WHERE id = ? AND patient_id = ?', [data.visitId, patient.patient_id]);
      if (!visits.length) throw new AppError(422, 'The selected visit does not belong to this patient.');
    }
    if (data.consultationId) {
      const [consultations] = await connection.execute('SELECT id FROM consultations WHERE id = ? AND patient_id = ?', [data.consultationId, patient.patient_id]);
      if (!consultations.length) throw new AppError(422, 'The selected consultation does not belong to this patient.');
    }

    await connection.execute(
      `INSERT INTO medicine_issuances
       (id, issuance_number, patient_id, student_id, visit_id, consultation_id, issued_by, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [issuanceId, issuanceNumber, patient.patient_id, patient.student_id || null,
       data.visitId, data.consultationId, req.user.staff_id, data.notes]
    );

    for (const item of data.items) {
      const [medicineRows] = await connection.execute(
        'SELECT id, generic_name, unit, is_active, archived_at FROM medicines WHERE id = ? FOR UPDATE',
        [item.medicineId]
      );
      const medicine = medicineRows[0];
      if (!medicine || !medicine.is_active || medicine.archived_at) throw new AppError(409, 'The selected medicine is unavailable or archived.');

      let batches;
      if (item.batchId) {
        const [rows] = await connection.execute(
          `SELECT id, medicine_id, batch_number, expiration_date, quantity
           FROM medicine_batches
           WHERE id = ? AND medicine_id = ? AND quantity > 0 AND expiration_date >= CURDATE()
           FOR UPDATE`,
          [item.batchId, item.medicineId]
        );
        batches = rows;
      } else {
        const [rows] = await connection.execute(
          `SELECT id, medicine_id, batch_number, expiration_date, quantity
           FROM medicine_batches
           WHERE medicine_id = ? AND quantity > 0 AND expiration_date >= CURDATE()
           ORDER BY expiration_date ASC, created_at ASC
           FOR UPDATE`,
          [item.medicineId]
        );
        batches = rows;
      }

      if (!batches.length) throw new AppError(409, `No eligible batch is available for ${medicine.generic_name}.`);
      const eligible = batches;
      const available = eligible.reduce((sum, batch) => sum + Number(batch.quantity), 0);
      if (available < item.quantity) {
        throw new AppError(409, `Insufficient stock for ${medicine.generic_name}. Available: ${available} ${medicine.unit}.`);
      }

      let remaining = item.quantity;
      for (const batch of eligible) {
        if (remaining <= 0) break;
        const issuedQuantity = Math.min(remaining, Number(batch.quantity));
        if (issuedQuantity <= 0) continue;
        const balance = Number(batch.quantity) - issuedQuantity;
        await connection.execute('UPDATE medicine_batches SET quantity = ?, updated_at = NOW() WHERE id = ?', [balance, batch.id]);
        await connection.execute(
          `INSERT INTO medicine_issuance_items
           (id, issuance_id, medicine_id, batch_id, quantity, dosage, frequency, duration, instructions)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [uuid(), issuanceId, item.medicineId, batch.id, issuedQuantity, item.dosage,
           item.frequency, item.duration, item.instructions]
        );
        await connection.execute(
          `INSERT INTO inventory_transactions
           (id, medicine_id, batch_id, transaction_type, quantity_change, balance_after,
            reference_type, reference_id, created_by)
           VALUES (?, ?, ?, 'ISSUANCE', ?, ?, 'MEDICINE_ISSUANCE', ?, ?)`,
          [uuid(), item.medicineId, batch.id, -issuedQuantity, balance, issuanceId, req.user.id]
        );
        remaining -= issuedQuantity;
      }
    }

    const responseData = { id: issuanceId, issuanceNumber, patientId: patient.patient_id };
    if (data.idempotencyKey) {
      await connection.execute(
        `UPDATE api_idempotency_keys
         SET resource_type = 'medicine_issuances', resource_id = ?, response_json = ?
         WHERE user_id = ? AND scope = 'MEDICINE_ISSUANCE' AND idempotency_key = ?`,
        [issuanceId, JSON.stringify(responseData), req.user.id, data.idempotencyKey]
      );
    }

    await writeAudit({
      actorUserId: req.user.id,
      action: 'ISSUE_MEDICINE',
      entityType: 'medicine_issuances',
      entityId: issuanceId,
      description: `Issued medicine under ${issuanceNumber} to patient ${patient.record_number}.`,
      ipAddress: req.ip,
      request: req,
      metadata: { itemCount: data.items.length, patientId: patient.patient_id },
      connection
    });
    return responseData;
  });

  return created(res, result, 'Medicine issued and inventory deducted successfully.');
}));

router.get('/:id', authorize('medicines.read'), asyncHandler(async (req, res) => {
  const [heads] = await pool.execute(
    `SELECT mi.*, ${patientIdentityColumns}, CONCAT_WS(' ', st.first_name, st.last_name) AS issued_by_name
     FROM medicine_issuances mi ${patientIdentityFrom('mi.patient_id')}
     JOIN staff st ON st.id = mi.issued_by
     WHERE mi.id = ?`,
    [req.params.id]
  );
  if (!heads.length) throw new AppError(404, 'Issuance record not found.');
  const [items] = await pool.execute(
    `SELECT mii.*, m.generic_name, m.brand_name, m.unit, mb.batch_number, mb.expiration_date
     FROM medicine_issuance_items mii
     JOIN medicines m ON m.id = mii.medicine_id
     JOIN medicine_batches mb ON mb.id = mii.batch_id
     WHERE mii.issuance_id = ?
     ORDER BY m.generic_name, mb.expiration_date`,
    [req.params.id]
  );
  await auditRecordAccess({
    req,
    entityType: 'medicine_issuances',
    entityId: req.params.id,
    action: 'VIEW_MEDICINE_ISSUANCE',
    description: `Viewed medicine issuance ${heads[0].issuance_number}.`,
    metadata: { patientId: heads[0].patient_id }
  });
  return ok(res, { issuance: heads[0], items });
}));

router.post('/:id/void', authorize('medicines.issue'), requireCsrf, validate(z.object({
  body: z.object({ reason: z.string().trim().min(5).max(1000) }),
  params: z.object({ id: z.string().uuid() }),
  query: z.object({})
})), asyncHandler(async (req, res) => {
  await withTransaction(async (connection) => {
    const [heads] = await connection.execute("SELECT * FROM medicine_issuances WHERE id = ? AND status = 'COMPLETED' FOR UPDATE", [req.params.id]);
    if (!heads.length) throw new AppError(404, 'Active issuance record not found.');
    const [items] = await connection.execute('SELECT * FROM medicine_issuance_items WHERE issuance_id = ? FOR UPDATE', [req.params.id]);
    for (const item of items) {
      const [batches] = await connection.execute('SELECT quantity FROM medicine_batches WHERE id = ? FOR UPDATE', [item.batch_id]);
      if (!batches.length) throw new AppError(409, 'A medicine batch linked to this issuance no longer exists.');
      const balance = Number(batches[0].quantity) + Number(item.quantity);
      await connection.execute('UPDATE medicine_batches SET quantity = ?, updated_at = NOW() WHERE id = ?', [balance, item.batch_id]);
      await connection.execute(
        `INSERT INTO inventory_transactions
         (id, medicine_id, batch_id, transaction_type, quantity_change, balance_after,
          reference_type, reference_id, created_by, notes)
         VALUES (?, ?, ?, 'RETURN', ?, ?, 'VOID_ISSUANCE', ?, ?, ?)`,
        [uuid(), item.medicine_id, item.batch_id, item.quantity, balance, req.params.id, req.user.id, req.validated.body.reason]
      );
    }
    await connection.execute(
      "UPDATE medicine_issuances SET status = 'VOIDED', voided_at = NOW(), voided_by = ?, void_reason = ? WHERE id = ?",
      [req.user.id, req.validated.body.reason, req.params.id]
    );
    await writeAudit({
      actorUserId: req.user.id,
      action: 'VOID_MEDICINE_ISSUANCE',
      entityType: 'medicine_issuances',
      entityId: req.params.id,
      description: 'Voided a medicine issuance and restored stock.',
      ipAddress: req.ip,
      request: req,
      metadata: { reason: req.validated.body.reason },
      connection
    });
  });
  return ok(res, null, 'Issuance voided and inventory restored.');
}));

export default router;
