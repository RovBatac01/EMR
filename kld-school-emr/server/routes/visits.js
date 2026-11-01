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
import {
  getPatientById,
  patientIdentityColumns,
  patientIdentityFrom
} from '../services/patients/patientService.js';

const router = express.Router();

router.use(authenticate);

const nullableText = (max) =>
  z.preprocess(
    (value) => (value === '' || value === undefined ? null : value),
    z.string().trim().max(max).nullable()
  );

const visitBaseBody = z.object({
  patientId: z.string().uuid().optional(),
  studentId: z.string().uuid().optional(),
  visitDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  visitTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  visitType: z.enum([
    'WALK_IN',
    'FOLLOW_UP',
    'EMERGENCY',
    'REFERRAL',
    'MEDICAL_CLEARANCE',
    'OTHER'
  ]),
  reason: z.string().trim().min(2).max(500),
  complaint: z.string().trim().min(2).max(1000),
  accompaniedBy: nullableText(200),
  priority: z
    .enum(['NORMAL', 'MODERATE', 'URGENT', 'EMERGENCY'])
    .default('NORMAL'),
  notes: nullableText(5000),
  status: z
    .enum(['REGISTERED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
    .optional()
    .default('REGISTERED')
});

// Creating a visit requires a patient or student.
const visitBody = visitBaseBody.refine(
  (value) => Boolean(value.patientId || value.studentId),
  {
    message: 'Select a patient.',
    path: ['patientId']
  }
);

// Apply partial() to the base object, before any refinement.
const visitUpdateBody = visitBaseBody.partial();

async function resolvePatient(connection, data, { forUpdate = false } = {}) {
  if (data.patientId) {
    return getPatientById(connection, data.patientId, { forUpdate });
  }

  const [rows] = await connection.execute(
    'SELECT id FROM patients WHERE student_id = ?',
    [data.studentId]
  );

  if (!rows.length) {
    throw new AppError(
      404,
      'Patient record not found. Apply the v1.1.0 migration first.'
    );
  }

  return getPatientById(connection, rows[0].id, { forUpdate });
}

router.get(
  '/',
  authorize('visits.read'),
  asyncHandler(async (req, res) => {
    const { page, limit, offset } = paginationFromQuery(req.query);
    const clauses = ['1=1'];
    const params = [];

    if (req.query.search) {
      const like = `%${String(req.query.search).trim()}%`;

      clauses.push(`(
        v.visit_number LIKE ? OR p.record_number LIKE ? OR
        CONCAT_WS(' ', s.first_name, s.middle_name, s.last_name) LIKE ? OR
        CONCAT_WS(' ', e.first_name, e.middle_name, e.last_name) LIKE ? OR
        v.complaint LIKE ?
      )`);

      params.push(like, like, like, like, like);
    }

    if (req.query.patientType) {
      clauses.push('p.patient_type = ?');
      params.push(req.query.patientType);
    }

    if (req.query.status) {
      clauses.push('v.status = ?');
      params.push(req.query.status);
    }

    if (req.query.visitType) {
      clauses.push('v.visit_type = ?');
      params.push(req.query.visitType);
    }

    if (req.query.priority) {
      clauses.push('v.priority = ?');
      params.push(req.query.priority);
    }

    if (req.query.dateFrom) {
      clauses.push('v.visit_date >= ?');
      params.push(req.query.dateFrom);
    }

    if (req.query.dateTo) {
      clauses.push('v.visit_date <= ?');
      params.push(req.query.dateTo);
    }

    const where = clauses.join(' AND ');
    const joins = patientIdentityFrom('v.patient_id');

    const [counts] = await pool.execute(
      `SELECT COUNT(*) AS total
       FROM visits v
       ${joins}
       WHERE ${where}`,
      params
    );

    const [rows] = await pool.execute(
      `SELECT v.*, ${patientIdentityColumns},
         c.id AS consultation_id,
         c.consultation_number,
         c.diagnosis,
         c.status AS consultation_status,
         CONCAT_WS(' ', st.first_name, st.last_name) AS registered_by_name
       FROM visits v
       ${joins}
       LEFT JOIN consultations c ON c.visit_id = v.id
       LEFT JOIN staff st ON st.id = v.registered_by
       WHERE ${where}
       ORDER BY v.visit_date DESC, v.visit_time DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return ok(
      res,
      rows,
      'Visits loaded.',
      paginationMeta(counts[0].total, page, limit)
    );
  })
);

router.post(
  '/',
  authorize('visits.write'),
  requireCsrf,
  validate(
    z.object({
      body: visitBody,
      params: z.object({}),
      query: z.object({})
    })
  ),
  asyncHandler(async (req, res) => {
    if (!req.user.staff_id) {
      throw new AppError(
        403,
        'A clinic staff profile is required to register visits.'
      );
    }

    const data = req.validated.body;

    const result = await withTransaction(async (connection) => {
      const patient = await resolvePatient(connection, data, { forUpdate: true });

      if (patient.archived_at) {
        throw new AppError(409, 'This patient record is archived and cannot receive new visits.');
      }
      if (patient.patient_status !== 'ACTIVE') {
        throw new AppError(409, 'This patient record is inactive.');
      }

      const id = uuid();
      const visitNumber = reference('VIS');

      await connection.execute(
        `INSERT INTO visits
         (id, visit_number, patient_id, student_id, visit_date,
          visit_time, visit_type, reason, complaint, accompanied_by,
          priority, notes, status, registered_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          visitNumber,
          patient.patient_id,
          patient.student_id || null,
          data.visitDate,
          data.visitTime,
          data.visitType,
          data.reason,
          data.complaint,
          data.accompaniedBy,
          data.priority,
          data.notes,
          data.status,
          req.user.staff_id
        ]
      );

      await writeAudit({
        actorUserId: req.user.id,
        action: 'CREATE_VISIT',
        entityType: 'visits',
        entityId: id,
        description:
          `Registered visit ${visitNumber} for patient ${patient.record_number}.`,
        ipAddress: req.ip,
        request: req,
        metadata: {
          patientId: patient.patient_id,
          patientType: patient.patient_type
        },
        connection
      });

      return {
        id,
        visitNumber,
        patientId: patient.patient_id
      };
    });

    return created(res, result, 'Clinic visit registered successfully.');
  })
);

router.get(
  '/:id',
  authorize('visits.read'),
  asyncHandler(async (req, res) => {
    const [rows] = await pool.execute(
      `SELECT v.*, ${patientIdentityColumns},
         s.birth_date AS student_birth_date,
         s.program,
         s.year_level,
         s.section,
         e.birth_date AS employee_birth_date,
         e.department,
         e.position_title,
         CONCAT_WS(' ', st.first_name, st.last_name) AS registered_by_name,
         c.id AS consultation_id,
         c.consultation_number,
         c.status AS consultation_status
       FROM visits v
       ${patientIdentityFrom('v.patient_id')}
       LEFT JOIN staff st ON st.id = v.registered_by
       LEFT JOIN consultations c ON c.visit_id = v.id
       WHERE v.id = ?`,
      [req.params.id]
    );

    if (!rows.length) {
      throw new AppError(404, 'Visit not found.');
    }

    await auditRecordAccess({
      req,
      entityType: 'visits',
      entityId: req.params.id,
      action: 'VIEW_VISIT_RECORD',
      description: `Viewed clinic visit ${rows[0].visit_number}.`,
      metadata: {
        patientId: rows[0].patient_id
      }
    });

    return ok(res, rows[0]);
  })
);

router.patch(
  '/:id',
  authorize('visits.write'),
  requireCsrf,
  validate(
    z.object({
      body: visitUpdateBody,
      params: z.object({
        id: z.string().uuid()
      }),
      query: z.object({})
    })
  ),
  asyncHandler(async (req, res) => {
    const data = req.validated.body;
    const sets = [];
    const params = [];

    if (data.patientId || data.studentId) {
      const patient = await resolvePatient(pool, data);

      sets.push('patient_id = ?', 'student_id = ?');
      params.push(patient.patient_id, patient.student_id || null);
    }

    const map = {
      visitDate: 'visit_date',
      visitTime: 'visit_time',
      visitType: 'visit_type',
      reason: 'reason',
      complaint: 'complaint',
      accompaniedBy: 'accompanied_by',
      priority: 'priority',
      notes: 'notes',
      status: 'status'
    };

    for (const [key, column] of Object.entries(map)) {
      if (Object.hasOwn(data, key)) {
        sets.push(`${column} = ?`);
        params.push(data[key]);
      }
    }

    if (!sets.length) {
      return ok(
        res,
        { id: req.params.id },
        'No changes were submitted.'
      );
    }

    params.push(req.params.id);

    const [result] = await pool.execute(
      `UPDATE visits
       SET ${sets.join(', ')}, updated_at = NOW()
       WHERE id = ?`,
      params
    );

    if (!result.affectedRows) {
      throw new AppError(404, 'Visit not found.');
    }

    await writeAudit({
      actorUserId: req.user.id,
      action: 'UPDATE_VISIT',
      entityType: 'visits',
      entityId: req.params.id,
      description: 'Updated clinic visit.',
      ipAddress: req.ip,
      request: req,
      metadata: {
        fields: Object.keys(data)
      }
    });

    return ok(
      res,
      { id: req.params.id },
      'Visit updated successfully.'
    );
  })
);

export default router;