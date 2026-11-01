import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';
import { env } from '../config/env.js';
import { AppError, asyncHandler } from '../utils/http.js';
import { sha256 } from '../utils/security.js';

export const authenticate = asyncHandler(async (req, _res, next) => {
  const token = req.cookies?.[env.COOKIE_NAME];
  if (!token) throw new AppError(401, 'Authentication is required.');

  let payload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET);
  } catch {
    throw new AppError(401, 'Your session has expired. Please sign in again.');
  }

  const [rows] = await pool.execute(
    `SELECT
       u.id, u.username, u.email, u.status, u.must_change_password,
       r.code AS role_code, r.name AS role_name, r.rank,
       s.id AS staff_id, CONCAT_WS(' ', s.first_name, s.middle_name, s.last_name) AS staff_name,
       sa.student_id, pat.id AS patient_id,
       dp.id AS doctor_profile_id, dp.professional_license_number, dp.license_expiration_date, dp.is_active AS doctor_profile_active,
       GROUP_CONCAT(DISTINCT p.code ORDER BY p.code SEPARATOR ',') AS permissions
     FROM users u
     JOIN roles r ON r.id = u.role_id
     LEFT JOIN staff s ON s.user_id = u.id
     LEFT JOIN student_accounts sa ON sa.user_id = u.id
     LEFT JOIN patients pat ON pat.student_id = sa.student_id
     LEFT JOIN doctor_profiles dp ON dp.staff_id = s.id
     LEFT JOIN role_permissions rp ON rp.role_id = r.id
     LEFT JOIN permissions p ON p.id = rp.permission_id
     WHERE u.id = ?
     GROUP BY u.id, r.id, s.id, sa.student_id, pat.id, dp.id`,
    [payload.sub]
  );

  const user = rows[0];
  if (!user || user.status !== 'ACTIVE') throw new AppError(401, 'This account is unavailable.');

  if (payload.jti) {
    const [sessions] = await pool.execute(
      `SELECT id FROM user_sessions
       WHERE user_id = ? AND token_hash = ? AND revoked_at IS NULL AND expires_at > NOW()`,
      [user.id, sha256(payload.jti)]
    );
    if (!sessions.length) throw new AppError(401, 'This session is no longer active.');
  }

  req.user = {
    ...user,
    permissions: user.permissions ? user.permissions.split(',') : []
  };
  req.auth = payload;
  next();
});

export const authorize = (...permissions) => (req, _res, next) => {
  if (req.user?.role_code === 'SUPER_ADMIN') return next();
  if (!permissions.length || permissions.some((permission) => req.user?.permissions.includes(permission))) return next();
  return next(new AppError(403, 'You do not have permission to perform this action.'));
};

export const authorizeRoles = (...roles) => (req, _res, next) => {
  if (roles.includes(req.user?.role_code)) return next();
  return next(new AppError(403, 'You do not have permission to access this page.'));
};
