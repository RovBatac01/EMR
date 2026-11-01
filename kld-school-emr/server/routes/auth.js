import express from 'express';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { pool, withTransaction } from '../config/db.js';
import { env, isProduction } from '../config/env.js';
import { authenticate } from '../middleware/auth.js';
import { issueCsrfToken, requireCsrf } from '../middleware/csrf.js';
import { validate } from '../middleware/validate.js';
import { AppError, asyncHandler, created, ok } from '../utils/http.js';
import { randomToken, sha256 } from '../utils/security.js';
import { uuid } from '../utils/ids.js';
import { writeAudit } from '../utils/audit.js';
import { enqueueEmail } from '../services/emailService.js';
import { loadPolicyAcceptanceStatus, publicPolicy } from '../services/policies/policyService.js';

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many sign-in attempts. Try again in 15 minutes.' }
});

const activationLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many verification attempts. Try again later.' }
});

const loginSchema = z.object({
  body: z.object({
    identifier: z.string().trim().min(2).max(190),
    password: z.string().min(8).max(128),
    remember: z.boolean().optional().default(false),
    privacyDocumentId: z.string().uuid().optional(),
    privacyAccepted: z.boolean().optional().default(false),
    termsDocumentId: z.string().uuid().optional(),
    termsAccepted: z.boolean().optional().default(false)
  }),
  params: z.object({}),
  query: z.object({})
});

function cookieOptions(remember = false) {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: remember ? 30 * 24 * 60 * 60 * 1000 : 8 * 60 * 60 * 1000
  };
}

function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role_code,
    roleName: user.role_name,
    name: user.display_name,
    staffId: user.staff_id || null,
    studentId: user.student_id || null,
    mustChangePassword: Boolean(user.must_change_password)
  };
}

async function loadLoginUser(identifier) {
  const [rows] = await pool.execute(
    `SELECT
       u.id, u.username, u.email, u.password_hash, u.status, u.must_change_password,
       r.code AS role_code, r.name AS role_name,
       s.id AS staff_id,
       sa.student_id,
       COALESCE(CONCAT_WS(' ', s.first_name, NULLIF(s.middle_name, ''), s.last_name),
                CONCAT_WS(' ', st.first_name, NULLIF(st.middle_name, ''), st.last_name),
                u.username) AS display_name
     FROM users u
     JOIN roles r ON r.id = u.role_id
     LEFT JOIN staff s ON s.user_id = u.id
     LEFT JOIN student_accounts sa ON sa.user_id = u.id
     LEFT JOIN students st ON st.id = sa.student_id
     WHERE LOWER(u.username) = LOWER(?) OR LOWER(u.email) = LOWER(?)
     LIMIT 1`,
    [identifier, identifier]
  );
  return rows[0];
}

router.get('/csrf', issueCsrfToken);

router.post('/login', loginLimiter, requireCsrf, validate(loginSchema), asyncHandler(async (req, res) => {
  const { identifier, password, remember } = req.validated.body;
  const user = await loadLoginUser(identifier);
  const passwordOk = user ? await bcrypt.compare(password, user.password_hash) : false;

  if (!user || !passwordOk) {
    await writeAudit({
      action: 'LOGIN_FAILED',
      description: 'Unsuccessful login attempt.',
      ipAddress: req.ip,
      metadata: { identifier: identifier.slice(0, 80) }
    });
    throw new AppError(401, 'Invalid username, email, or password.');
  }
  if (user.status !== 'ACTIVE') throw new AppError(403, 'This account is not active. Contact the clinic administrator.');

  const policyStatus = await loadPolicyAcceptanceStatus(pool, user.id);
  if (policyStatus.missing.length) {
    const supplied = {
      PRIVACY_POLICY: {
        id: req.validated.body.privacyDocumentId,
        accepted: req.validated.body.privacyAccepted
      },
      TERMS_AND_CONDITIONS: {
        id: req.validated.body.termsDocumentId,
        accepted: req.validated.body.termsAccepted
      }
    };
    const incomplete = policyStatus.missing.some((policy) => {
      const acceptance = supplied[policy.document_type];
      return !acceptance?.accepted || acceptance.id !== policy.id;
    });
    if (incomplete) {
      throw new AppError(428, 'Review and accept the current Privacy Policy and Terms and Conditions before signing in.', {
        code: 'POLICY_ACCEPTANCE_REQUIRED',
        documents: policyStatus.missing.map(publicPolicy)
      });
    }
  }

  const jti = randomToken(18);
  const expiresIn = remember ? env.REMEMBER_JWT_EXPIRES_IN : env.JWT_EXPIRES_IN;
  const token = jwt.sign(
    { sub: user.id, role: user.role_code, jti },
    env.JWT_SECRET,
    { expiresIn, issuer: 'kld-school-emr', audience: 'kld-emr-web' }
  );
  const decoded = jwt.decode(token);

  await withTransaction(async (connection) => {
    for (const policy of policyStatus.missing) {
      await connection.execute(
        `INSERT IGNORE INTO policy_acceptances
          (id, user_id, document_id, document_type, document_version, ip_address, user_agent)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [uuid(), user.id, policy.id, policy.document_type, policy.version, req.ip,
          req.get('user-agent')?.slice(0, 500) || null]
      );
      await writeAudit({
        actorUserId: user.id,
        action: policy.document_type === 'PRIVACY_POLICY'
          ? 'ACCEPT_PRIVACY_POLICY'
          : 'ACCEPT_TERMS_AND_CONDITIONS',
        entityType: 'policy_documents',
        entityId: policy.id,
        description: `${user.display_name} accepted ${policy.title} version ${policy.version}.`,
        ipAddress: req.ip,
        metadata: { documentType: policy.document_type, version: policy.version },
        request: req,
        connection
      });
    }

    await connection.execute(
      `INSERT INTO user_sessions
        (id, user_id, token_hash, user_agent, ip_address, expires_at)
       VALUES (?, ?, ?, ?, ?, FROM_UNIXTIME(?))`,
      [uuid(), user.id, sha256(jti), req.get('user-agent')?.slice(0, 500) || null, req.ip, decoded.exp]
    );
    await connection.execute('UPDATE users SET last_login_at = NOW() WHERE id = ?', [user.id]);
    await writeAudit({
      actorUserId: user.id,
      action: 'LOGIN',
      entityType: 'users',
      entityId: user.id,
      description: `${user.display_name} signed in.`,
      ipAddress: req.ip,
      connection
    });
  });

  res.cookie(env.COOKIE_NAME, token, cookieOptions(remember));
  return ok(res, { user: publicUser(user) }, 'Signed in successfully.');
}));

router.get('/me', authenticate, asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT
       u.id, u.username, u.email, u.must_change_password,
       r.code AS role_code, r.name AS role_name,
       s.id AS staff_id,
       sa.student_id,
       COALESCE(CONCAT_WS(' ', s.first_name, NULLIF(s.middle_name, ''), s.last_name),
                CONCAT_WS(' ', st.first_name, NULLIF(st.middle_name, ''), st.last_name),
                u.username) AS display_name
     FROM users u
     JOIN roles r ON r.id = u.role_id
     LEFT JOIN staff s ON s.user_id = u.id
     LEFT JOIN student_accounts sa ON sa.user_id = u.id
     LEFT JOIN students st ON st.id = sa.student_id
     WHERE u.id = ?`,
    [req.user.id]
  );
  return ok(res, { user: publicUser(rows[0]), permissions: req.user.permissions });
}));

router.post('/logout', authenticate, requireCsrf, asyncHandler(async (req, res) => {
  if (req.auth?.jti) {
    await pool.execute(
      'UPDATE user_sessions SET revoked_at = NOW() WHERE user_id = ? AND token_hash = ?',
      [req.user.id, sha256(req.auth.jti)]
    );
  }
  await writeAudit({
    actorUserId: req.user.id,
    action: 'LOGOUT',
    entityType: 'users',
    entityId: req.user.id,
    description: `${req.user.username} signed out.`,
    ipAddress: req.ip
  });
  res.clearCookie(env.COOKIE_NAME, { path: '/' });
  return ok(res, null, 'Signed out successfully.');
}));

router.post('/change-password', authenticate, requireCsrf, validate(z.object({
  body: z.object({
    currentPassword: z.string().min(8).max(128),
    newPassword: z.string().min(10).max(128).regex(/[A-Z]/, 'Include an uppercase letter.').regex(/[a-z]/, 'Include a lowercase letter.').regex(/[0-9]/, 'Include a number.')
  }), params: z.object({}), query: z.object({})
})), asyncHandler(async (req, res) => {
  const [rows] = await pool.execute('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
  if (!await bcrypt.compare(req.validated.body.currentPassword, rows[0].password_hash)) {
    throw new AppError(400, 'The current password is incorrect.');
  }
  const hash = await bcrypt.hash(req.validated.body.newPassword, 12);
  await pool.execute('UPDATE users SET password_hash = ?, must_change_password = 0, password_changed_at = NOW() WHERE id = ?', [hash, req.user.id]);
  await writeAudit({ actorUserId: req.user.id, action: 'CHANGE_PASSWORD', entityType: 'users', entityId: req.user.id, description: 'Account password changed.', ipAddress: req.ip });
  return ok(res, null, 'Password changed successfully.');
}));

router.post('/forgot-password', loginLimiter, requireCsrf, validate(z.object({
  body: z.object({ email: z.string().email().max(190) }), params: z.object({}), query: z.object({})
})), asyncHandler(async (req, res) => {
  const [users] = await pool.execute('SELECT id, email FROM users WHERE LOWER(email) = LOWER(?) AND status = \'ACTIVE\' LIMIT 1', [req.validated.body.email]);
  let devToken = null;
  if (users.length) {
    const token = randomToken(32);
    devToken = env.NODE_ENV === 'development' && env.EMAIL_MODE === 'log' ? token : null;
    await pool.execute(
      `INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at)
       VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 30 MINUTE))`,
      [uuid(), users[0].id, sha256(token)]
    );
    await enqueueEmail({
      recipient: users[0].email,
      subject: 'Reset your KLD Clinic password',
      template: 'PASSWORD_RESET',
      payload: {
        title: 'Password reset requested',
        message: '<p>Use the secure link below within 30 minutes to create a new password.</p>',
        actionUrl: `${env.APP_URL}/reset-password?token=${token}`,
        actionLabel: 'Reset password'
      },
      relatedType: 'users',
      relatedId: users[0].id
    });
  }
  return ok(res, devToken ? { developmentToken: devToken } : null, 'If the email belongs to an active account, password-reset instructions have been queued.');
}));

router.post('/reset-password', loginLimiter, requireCsrf, validate(z.object({
  body: z.object({
    token: z.string().min(32),
    password: z.string().min(10).max(128).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/)
  }), params: z.object({}), query: z.object({})
})), asyncHandler(async (req, res) => {
  const [tokens] = await pool.execute(
    `SELECT * FROM password_reset_tokens
     WHERE token_hash = ? AND used_at IS NULL AND expires_at > NOW() LIMIT 1`,
    [sha256(req.validated.body.token)]
  );
  if (!tokens.length) throw new AppError(400, 'This password-reset link is invalid or expired.');
  const hash = await bcrypt.hash(req.validated.body.password, 12);
  await withTransaction(async (connection) => {
    await connection.execute('UPDATE users SET password_hash = ?, must_change_password = 0, password_changed_at = NOW() WHERE id = ?', [hash, tokens[0].user_id]);
    await connection.execute('UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ?', [tokens[0].id]);
    await connection.execute('UPDATE user_sessions SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL', [tokens[0].user_id]);
  });
  return ok(res, null, 'Password reset successfully. You may now sign in.');
}));

const studentVerificationSchema = z.object({
  body: z.object({
    studentNumber: z.string().trim().min(4).max(40),
    email: z.string().email().max(190),
    birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
  }), params: z.object({}), query: z.object({})
});

router.post('/register-student', activationLimiter, requireCsrf, validate(studentVerificationSchema), asyncHandler(async (req, res) => {
  const { studentNumber, email, birthDate } = req.validated.body;
  const [rows] = await pool.execute(
    `SELECT s.* FROM students s
     LEFT JOIN student_accounts sa ON sa.student_id = s.id
     WHERE s.student_number = ? AND LOWER(s.registered_email) = LOWER(?) AND s.birth_date = ?
       AND s.enrollment_status = 'ACTIVE' AND s.portal_eligible = 1 AND sa.id IS NULL
     LIMIT 1`,
    [studentNumber, email, birthDate]
  );
  let developmentToken = null;
  if (rows.length) {
    const student = rows[0];
    const token = randomToken(32);
    developmentToken = env.NODE_ENV === 'development' && env.EMAIL_MODE === 'log' ? token : null;
    await pool.execute('UPDATE email_verification_tokens SET used_at = NOW() WHERE student_id = ? AND used_at IS NULL', [student.id]);
    await pool.execute(
      `INSERT INTO email_verification_tokens
       (id, student_id, email, token_hash, purpose, expires_at)
       VALUES (?, ?, ?, ?, 'STUDENT_ACTIVATION', DATE_ADD(NOW(), INTERVAL 30 MINUTE))`,
      [uuid(), student.id, email, sha256(token)]
    );
    await enqueueEmail({
      recipient: email,
      subject: 'Activate your KLD Student Clinic Portal',
      template: 'STUDENT_ACTIVATION',
      payload: {
        title: 'Verify your student clinic account',
        message: '<p>Your information matched an eligible KLD student record. Continue through the secure link to create your clinic portal account.</p>',
        actionUrl: `${env.APP_URL}/activate-student?token=${token}`,
        actionLabel: 'Continue account activation'
      },
      relatedType: 'students',
      relatedId: student.id
    });
    await writeAudit({ action: 'STUDENT_ACTIVATION_REQUESTED', entityType: 'students', entityId: student.id, description: 'Student portal activation requested.', ipAddress: req.ip });
  }
  return ok(res, developmentToken ? { developmentToken } : null, 'If the information matches an eligible KLD student record, a verification message has been queued.');
}));

router.post('/verify-student', activationLimiter, requireCsrf, validate(z.object({
  body: z.object({ token: z.string().min(32) }), params: z.object({}), query: z.object({})
})), asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT evt.id AS token_id, evt.student_id, evt.email, s.student_number, s.first_name, s.last_name
     FROM email_verification_tokens evt
     JOIN students s ON s.id = evt.student_id
     LEFT JOIN student_accounts sa ON sa.student_id = s.id
     WHERE evt.token_hash = ? AND evt.purpose = 'STUDENT_ACTIVATION'
       AND evt.used_at IS NULL AND evt.expires_at > NOW()
       AND s.enrollment_status = 'ACTIVE' AND s.portal_eligible = 1 AND sa.id IS NULL
     LIMIT 1`,
    [sha256(req.validated.body.token)]
  );
  if (!rows.length) throw new AppError(400, 'This activation link is invalid, expired, or already used.');
  return ok(res, {
    studentNumber: rows[0].student_number,
    name: `${rows[0].first_name} ${rows[0].last_name}`,
    email: rows[0].email.replace(/(^.).*(@.*$)/, '$1••••$2')
  }, 'Student identity verified.');
}));

router.post('/activate-account', activationLimiter, requireCsrf, validate(z.object({
  body: z.object({
    token: z.string().min(32),
    username: z.string().trim().min(4).max(40).regex(/^[A-Za-z0-9._-]+$/),
    password: z.string().min(10).max(128).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/),
    acceptPrivacy: z.literal(true)
  }), params: z.object({}), query: z.object({})
})), asyncHandler(async (req, res) => {
  const { token, username, password } = req.validated.body;
  const hash = sha256(token);
  const result = await withTransaction(async (connection) => {
    const [tokens] = await connection.execute(
      `SELECT evt.*, s.registered_email, s.first_name, s.middle_name, s.last_name
       FROM email_verification_tokens evt
       JOIN students s ON s.id = evt.student_id
       LEFT JOIN student_accounts sa ON sa.student_id = s.id
       WHERE evt.token_hash = ? AND evt.purpose = 'STUDENT_ACTIVATION'
         AND evt.used_at IS NULL AND evt.expires_at > NOW()
         AND s.enrollment_status = 'ACTIVE' AND s.portal_eligible = 1 AND sa.id IS NULL
       FOR UPDATE`,
      [hash]
    );
    if (!tokens.length) throw new AppError(400, 'This activation link is invalid, expired, or already used.');
    const record = tokens[0];
    const [roles] = await connection.execute("SELECT id FROM roles WHERE code = 'STUDENT' LIMIT 1");
    const userId = uuid();
    const accountId = uuid();
    const passwordHash = await bcrypt.hash(password, 12);
    await connection.execute(
      `INSERT INTO users (id, username, email, password_hash, role_id, status, email_verified_at)
       VALUES (?, ?, ?, ?, ?, 'ACTIVE', NOW())`,
      [userId, username, record.registered_email, passwordHash, roles[0].id]
    );
    await connection.execute(
      `INSERT INTO student_accounts (id, user_id, student_id, verified_email_at, activated_at)
       VALUES (?, ?, ?, NOW(), NOW())`,
      [accountId, userId, record.student_id]
    );
    await connection.execute(
      `UPDATE students SET account_activation_status = 'ACTIVE', account_linked = 1 WHERE id = ?`,
      [record.student_id]
    );
    await connection.execute('UPDATE email_verification_tokens SET used_at = NOW() WHERE id = ?', [record.id]);
    await writeAudit({
      actorUserId: userId,
      action: 'STUDENT_ACCOUNT_ACTIVATED',
      entityType: 'students',
      entityId: record.student_id,
      description: 'Student clinic portal account activated.',
      ipAddress: req.ip,
      connection
    });
    return { userId, email: record.registered_email, name: `${record.first_name} ${record.last_name}` };
  });

  await enqueueEmail({
    recipient: result.email,
    subject: 'Your KLD Student Clinic Portal is active',
    template: 'ACCOUNT_CREATED',
    payload: { title: 'Account activated', message: `<p>Hello ${result.name}, your KLD Student Clinic Portal account is ready.</p>`, actionUrl: `${env.APP_URL}/login`, actionLabel: 'Sign in' },
    relatedType: 'users',
    relatedId: result.userId
  });
  return created(res, null, 'Student portal account activated successfully.');
}));

export default router;
