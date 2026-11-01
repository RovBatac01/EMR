import express from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { pool, withTransaction } from '../config/db.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { requireCsrf } from '../middleware/csrf.js';
import { validate } from '../middleware/validate.js';
import { AppError, asyncHandler, created, ok } from '../utils/http.js';
import { paginationFromQuery, paginationMeta } from '../utils/pagination.js';
import { uuid } from '../utils/ids.js';
import { writeAudit } from '../utils/audit.js';

const router = express.Router();
router.use(authenticate);

const nullableText = (max) => z.preprocess(
  (value) => value === '' || value === undefined ? null : value,
  z.string().trim().max(max).nullable()
);
const nullableDate = z.preprocess(
  (value) => value === '' || value === undefined ? null : value,
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable()
);

const staffFields = z.object({
  staffNumber: z.string().trim().min(2).max(40),
  firstName: z.string().trim().min(1).max(100),
  middleName: nullableText(100).optional(),
  lastName: z.string().trim().min(1).max(100),
  username: z.string().trim().min(4).max(40).regex(/^[A-Za-z0-9._-]+$/),
  email: z.string().email().max(190),
  contactNumber: nullableText(40).optional(),
  position: z.string().trim().min(1).max(120),
  licenseNumber: nullableText(80).optional(),
  roleCode: z.enum(['SUPER_ADMIN', 'CLINIC_ADMIN', 'CLINIC_STAFF', 'DOCTOR', 'VIEWER']),
  status: z.enum(['ACTIVE', 'DISABLED', 'LOCKED']).optional().default('ACTIVE'),
  specialization: nullableText(180).optional(),
  professionalLicenseNumber: nullableText(100).optional(),
  licenseExpirationDate: nullableDate.optional(),
  signatureName: nullableText(200).optional()
});
const createBody = staffFields.extend({
  password: z.string().min(10).max(128).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/)
}).superRefine((data, ctx) => {
  if (data.roleCode === 'DOCTOR' && !data.professionalLicenseNumber) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['professionalLicenseNumber'], message: 'Professional license number is required for doctors.' });
  }
});
const updateBody = staffFields.partial().superRefine((data, ctx) => {
  if (data.roleCode === 'DOCTOR' && data.professionalLicenseNumber === null) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['professionalLicenseNumber'], message: 'Professional license number is required for doctors.' });
  }
});

async function upsertDoctorProfile(connection, staffId, data, roleCode) {
  if (roleCode !== 'DOCTOR') {
    await connection.execute('UPDATE doctor_profiles SET is_active = 0, updated_at = NOW() WHERE staff_id = ?', [staffId]);
    return;
  }
  const [existing] = await connection.execute('SELECT * FROM doctor_profiles WHERE staff_id = ? FOR UPDATE', [staffId]);
  const license = data.professionalLicenseNumber ?? existing[0]?.professional_license_number ?? data.licenseNumber;
  if (!license) throw new AppError(422, 'Professional license number is required for doctors.', { fieldErrors: { professionalLicenseNumber: ['Professional license number is required for doctors.'] } });
  if (existing.length) {
    await connection.execute(
      `UPDATE doctor_profiles SET
       specialization = ?, professional_license_number = ?, license_expiration_date = ?, signature_name = ?, is_active = 1, updated_at = NOW()
       WHERE staff_id = ?`,
      [data.specialization ?? existing[0].specialization, license,
       data.licenseExpirationDate ?? existing[0].license_expiration_date,
       data.signatureName ?? existing[0].signature_name, staffId]
    );
  } else {
    await connection.execute(
      `INSERT INTO doctor_profiles
       (id, staff_id, specialization, professional_license_number, license_expiration_date, signature_name, is_active)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [uuid(), staffId, data.specialization, license, data.licenseExpirationDate, data.signatureName]
    );
  }
}

router.get('/roles', authorize('staff.read'), asyncHandler(async (_req, res) => {
  const [rows] = await pool.query("SELECT id, code, name, `rank` FROM roles WHERE code <> 'STUDENT' ORDER BY `rank` DESC");
  return ok(res, rows);
}));

router.get('/', authorize('staff.read'), asyncHandler(async (req, res) => {
  const { page, limit, offset } = paginationFromQuery(req.query);
  const clauses = ["r.code <> 'STUDENT'"];
  const params = [];
  if (req.query.search) {
    const like = `%${String(req.query.search).trim()}%`;
    clauses.push(`(s.staff_number LIKE ? OR CONCAT_WS(' ', s.first_name, s.middle_name, s.last_name) LIKE ? OR u.username LIKE ? OR u.email LIKE ? OR dp.specialization LIKE ?)`);
    params.push(like, like, like, like, like);
  }
  if (req.query.role) { clauses.push('r.code = ?'); params.push(req.query.role); }
  if (req.query.status) { clauses.push('u.status = ?'); params.push(req.query.status); }
  const where = clauses.join(' AND ');
  const [counts] = await pool.execute(
    `SELECT COUNT(*) AS total FROM staff s JOIN users u ON u.id = s.user_id JOIN roles r ON r.id = u.role_id LEFT JOIN doctor_profiles dp ON dp.staff_id = s.id WHERE ${where}`,
    params
  );
  const [rows] = await pool.execute(
    `SELECT s.*, u.username, u.email, u.status, u.last_login_at, u.created_at AS account_created_at,
       r.code AS role_code, r.name AS role_name,
       dp.id AS doctor_profile_id, dp.specialization, dp.professional_license_number,
       dp.license_expiration_date, dp.signature_name, dp.is_active AS doctor_profile_active
     FROM staff s
     JOIN users u ON u.id = s.user_id
     JOIN roles r ON r.id = u.role_id
     LEFT JOIN doctor_profiles dp ON dp.staff_id = s.id
     WHERE ${where}
     ORDER BY s.last_name, s.first_name LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  return ok(res, rows, 'Staff accounts loaded.', paginationMeta(counts[0].total, page, limit));
}));

router.post('/', authorize('staff.manage'), requireCsrf, validate(z.object({ body: createBody, params: z.object({}), query: z.object({}) })), asyncHandler(async (req, res) => {
  const data = req.validated.body;
  if (data.roleCode === 'SUPER_ADMIN' && req.user.role_code !== 'SUPER_ADMIN') {
    throw new AppError(403, 'Only a Super Administrator can create another Super Administrator.');
  }
  const userId = uuid();
  const staffId = uuid();
  const passwordHash = await bcrypt.hash(data.password, 12);
  await withTransaction(async (connection) => {
    const [roles] = await connection.execute('SELECT id FROM roles WHERE code = ?', [data.roleCode]);
    if (!roles.length) throw new AppError(422, 'Selected role is invalid.');
    await connection.execute(
      'INSERT INTO users (id, username, email, password_hash, role_id, status, must_change_password) VALUES (?, ?, ?, ?, ?, ?, 1)',
      [userId, data.username, data.email, passwordHash, roles[0].id, data.status]
    );
    await connection.execute(
      `INSERT INTO staff
       (id, user_id, staff_number, first_name, middle_name, last_name, contact_number, position, license_number)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [staffId, userId, data.staffNumber, data.firstName, data.middleName, data.lastName,
       data.contactNumber, data.position, data.licenseNumber || data.professionalLicenseNumber]
    );
    await upsertDoctorProfile(connection, staffId, data, data.roleCode);
    await writeAudit({
      actorUserId: req.user.id, action: 'CREATE_STAFF', entityType: 'staff', entityId: staffId,
      description: `Created ${data.roleCode === 'DOCTOR' ? 'doctor' : 'staff'} account ${data.username}.`,
      ipAddress: req.ip, request: req, connection
    });
  });
  return created(res, { id: staffId, userId }, 'Staff account created successfully.');
}));

router.get('/:id', authorize('staff.read'), asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT s.*, u.username, u.email, u.status, u.last_login_at, u.created_at AS account_created_at,
       r.code AS role_code, r.name AS role_name,
       dp.id AS doctor_profile_id, dp.specialization, dp.professional_license_number,
       dp.license_expiration_date, dp.signature_name, dp.is_active AS doctor_profile_active
     FROM staff s
     JOIN users u ON u.id = s.user_id
     JOIN roles r ON r.id = u.role_id
     LEFT JOIN doctor_profiles dp ON dp.staff_id = s.id
     WHERE s.id = ?`,
    [req.params.id]
  );
  if (!rows.length) throw new AppError(404, 'Staff member not found.');
  return ok(res, rows[0]);
}));

router.patch('/:id', authorize('staff.manage'), requireCsrf, validate(z.object({
  body: updateBody,
  params: z.object({ id: z.string().uuid() }),
  query: z.object({})
})), asyncHandler(async (req, res) => {
  const data = req.validated.body;
  await withTransaction(async (connection) => {
    const [rows] = await connection.execute(
      `SELECT s.user_id, r.code AS current_role, dp.professional_license_number
       FROM staff s
       JOIN users u ON u.id = s.user_id
       JOIN roles r ON r.id = u.role_id
       LEFT JOIN doctor_profiles dp ON dp.staff_id = s.id
       WHERE s.id = ? FOR UPDATE`,
      [req.params.id]
    );
    if (!rows.length) throw new AppError(404, 'Staff member not found.');
    if ((rows[0].current_role === 'SUPER_ADMIN' || data.roleCode === 'SUPER_ADMIN') && req.user.role_code !== 'SUPER_ADMIN') {
      throw new AppError(403, 'Only a Super Administrator can modify administrator accounts.');
    }

    const staffMap = {
      staffNumber: 'staff_number', firstName: 'first_name', middleName: 'middle_name', lastName: 'last_name',
      contactNumber: 'contact_number', position: 'position', licenseNumber: 'license_number'
    };
    const staffSets = [];
    const staffParams = [];
    for (const [key, column] of Object.entries(staffMap)) {
      if (Object.hasOwn(data, key)) { staffSets.push(`${column} = ?`); staffParams.push(data[key]); }
    }
    if (staffSets.length) {
      staffParams.push(req.params.id);
      await connection.execute(`UPDATE staff SET ${staffSets.join(', ')}, updated_at = NOW() WHERE id = ?`, staffParams);
    }

    const userSets = [];
    const userParams = [];
    for (const [key, column] of [['username', 'username'], ['email', 'email'], ['status', 'status']]) {
      if (Object.hasOwn(data, key)) { userSets.push(`${column} = ?`); userParams.push(data[key]); }
    }
    let resultingRole = data.roleCode || rows[0].current_role;
    if (data.roleCode) {
      const [role] = await connection.execute('SELECT id FROM roles WHERE code = ?', [data.roleCode]);
      if (!role.length) throw new AppError(422, 'Invalid role.');
      userSets.push('role_id = ?');
      userParams.push(role[0].id);
    }
    if (userSets.length) {
      userParams.push(rows[0].user_id);
      await connection.execute(`UPDATE users SET ${userSets.join(', ')}, updated_at = NOW() WHERE id = ?`, userParams);
    }

    await upsertDoctorProfile(connection, req.params.id, { ...data, professionalLicenseNumber: data.professionalLicenseNumber ?? rows[0].professional_license_number }, resultingRole);
    await writeAudit({
      actorUserId: req.user.id, action: 'UPDATE_STAFF', entityType: 'staff', entityId: req.params.id,
      description: 'Updated staff account.', ipAddress: req.ip, request: req,
      metadata: { fields: Object.keys(data), resultingRole }, connection
    });
  });
  return ok(res, { id: req.params.id }, 'Staff account updated successfully.');
}));

router.post('/:id/reset-password', authorize('staff.manage'), requireCsrf, validate(z.object({
  body: z.object({ temporaryPassword: z.string().min(10).max(128).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/) }),
  params: z.object({ id: z.string().uuid() }), query: z.object({})
})), asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(
    'SELECT s.user_id, r.code AS role_code FROM staff s JOIN users u ON u.id = s.user_id JOIN roles r ON r.id = u.role_id WHERE s.id = ?',
    [req.params.id]
  );
  if (!rows.length) throw new AppError(404, 'Staff member not found.');
  if (rows[0].role_code === 'SUPER_ADMIN' && req.user.role_code !== 'SUPER_ADMIN') {
    throw new AppError(403, 'Only a Super Administrator can reset this password.');
  }
  const hash = await bcrypt.hash(req.validated.body.temporaryPassword, 12);
  await withTransaction(async (connection) => {
    await connection.execute('UPDATE users SET password_hash = ?, must_change_password = 1, password_changed_at = NOW() WHERE id = ?', [hash, rows[0].user_id]);
    await connection.execute('UPDATE user_sessions SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL', [rows[0].user_id]);
    await writeAudit({
      actorUserId: req.user.id, action: 'RESET_STAFF_PASSWORD', entityType: 'staff', entityId: req.params.id,
      description: 'Reset a staff account password.', ipAddress: req.ip, request: req, connection
    });
  });
  return ok(res, null, 'Temporary password set. The user must change it after signing in.');
}));

router.get('/:id/activity', authorize('staff.read'), asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(
    'SELECT al.* FROM activity_logs al JOIN staff s ON s.user_id = al.actor_user_id WHERE s.id = ? ORDER BY al.created_at DESC LIMIT 100',
    [req.params.id]
  );
  return ok(res, rows);
}));

export default router;
