import express from 'express';
import { z } from 'zod';
import { pool, withTransaction } from '../config/db.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { requireCsrf } from '../middleware/csrf.js';
import { validate } from '../middleware/validate.js';
import { AppError, asyncHandler, created, ok } from '../utils/http.js';
import { uuid } from '../utils/ids.js';
import { writeAudit } from '../utils/audit.js';
import {
  loadPolicyAcceptanceStatus,
  loadPublishedPolicies,
  normalizePolicyType,
  publicPolicy
} from '../services/policies/policyService.js';

const router = express.Router();

router.get('/public', asyncHandler(async (_req, res) => {
  const policies = await loadPublishedPolicies();
  return ok(res, policies.map(publicPolicy), 'Current privacy and terms documents loaded.');
}));

router.get('/public/:type', asyncHandler(async (req, res) => {
  const type = normalizePolicyType(req.params.type);
  if (!type) throw new AppError(404, 'Policy document not found.');
  const policies = await loadPublishedPolicies();
  const policy = policies.find((row) => row.document_type === type);
  if (!policy) throw new AppError(404, 'No published document is available.');
  return ok(res, publicPolicy(policy));
}));

router.get('/acceptance-status', authenticate, asyncHandler(async (req, res) => {
  const result = await loadPolicyAcceptanceStatus(pool, req.user.id);
  return ok(res, {
    accepted: result.missing.length === 0,
    documents: result.policies.map((policy) => ({
      ...publicPolicy(policy),
      accepted: !result.missing.some((missing) => missing.id === policy.id)
    }))
  });
}));

router.use('/admin', authenticate, authorize('policies.manage'));

router.get('/admin', asyncHandler(async (_req, res) => {
  const [rows] = await pool.query(
    `SELECT pd.*, creator.username AS created_by_username, updater.username AS updated_by_username
     FROM policy_documents pd
     LEFT JOIN users creator ON creator.id = pd.created_by
     LEFT JOIN users updater ON updater.id = pd.updated_by
     ORDER BY pd.document_type, pd.created_at DESC`
  );
  return ok(res, rows);
}));

const policyBody = z.object({
  documentType: z.enum(['PRIVACY_POLICY', 'TERMS_AND_CONDITIONS']),
  version: z.string().trim().min(1).max(40),
  title: z.string().trim().min(3).max(220),
  body: z.string().trim().min(100).max(100000)
});

router.post('/admin', requireCsrf, validate(z.object({
  body: policyBody,
  params: z.object({}),
  query: z.object({})
})), asyncHandler(async (req, res) => {
  const id = uuid();
  const data = req.validated.body;
  await pool.execute(
    `INSERT INTO policy_documents
      (id, document_type, version, title, body, status, created_by, updated_by)
     VALUES (?, ?, ?, ?, ?, 'DRAFT', ?, ?)`,
    [id, data.documentType, data.version, data.title, data.body, req.user.id, req.user.id]
  );
  await writeAudit({
    actorUserId: req.user.id,
    action: 'CREATE_POLICY_DOCUMENT',
    entityType: 'policy_documents',
    entityId: id,
    description: `Created draft ${data.documentType} version ${data.version}.`,
    ipAddress: req.ip,
    request: req
  });
  return created(res, { id }, 'Policy draft created.');
}));

router.patch('/admin/:id', requireCsrf, validate(z.object({
  body: policyBody.partial().refine((value) => Object.keys(value).length > 0, 'Submit at least one field.'),
  params: z.object({ id: z.string().uuid() }),
  query: z.object({})
})), asyncHandler(async (req, res) => {
  const [existingRows] = await pool.execute('SELECT * FROM policy_documents WHERE id = ?', [req.params.id]);
  if (!existingRows.length) throw new AppError(404, 'Policy document not found.');
  if (existingRows[0].status === 'PUBLISHED') {
    throw new AppError(409, 'Published policy versions are immutable. Create a new draft version instead.');
  }

  const map = {
    documentType: 'document_type',
    version: 'version',
    title: 'title',
    body: 'body'
  };
  const sets = [];
  const params = [];
  for (const [key, column] of Object.entries(map)) {
    if (Object.hasOwn(req.validated.body, key)) {
      sets.push(`${column} = ?`);
      params.push(req.validated.body[key]);
    }
  }
  sets.push('updated_by = ?', 'updated_at = NOW()');
  params.push(req.user.id, req.params.id);
  await pool.execute(`UPDATE policy_documents SET ${sets.join(', ')} WHERE id = ?`, params);
  await writeAudit({
    actorUserId: req.user.id,
    action: 'UPDATE_POLICY_DOCUMENT',
    entityType: 'policy_documents',
    entityId: req.params.id,
    description: 'Updated a policy draft.',
    ipAddress: req.ip,
    metadata: { fields: Object.keys(req.validated.body) },
    request: req
  });
  return ok(res, { id: req.params.id }, 'Policy draft updated.');
}));

router.post('/admin/:id/publish', requireCsrf, validate(z.object({
  body: z.object({ confirmation: z.literal(true) }),
  params: z.object({ id: z.string().uuid() }),
  query: z.object({})
})), asyncHandler(async (req, res) => {
  let published;
  await withTransaction(async (connection) => {
    const [rows] = await connection.execute(
      'SELECT * FROM policy_documents WHERE id = ? FOR UPDATE',
      [req.params.id]
    );
    if (!rows.length) throw new AppError(404, 'Policy document not found.');
    const policy = rows[0];
    if (policy.status === 'PUBLISHED') {
      published = policy;
      return;
    }
    await connection.execute(
      `UPDATE policy_documents
       SET status = 'ARCHIVED', updated_at = NOW()
       WHERE document_type = ? AND status = 'PUBLISHED' AND id <> ?`,
      [policy.document_type, policy.id]
    );
    await connection.execute(
      `UPDATE policy_documents
       SET status = 'PUBLISHED', published_at = NOW(), updated_by = ?, updated_at = NOW()
       WHERE id = ?`,
      [req.user.id, policy.id]
    );
    await writeAudit({
      actorUserId: req.user.id,
      action: 'PUBLISH_POLICY_DOCUMENT',
      entityType: 'policy_documents',
      entityId: policy.id,
      description: `Published ${policy.document_type} version ${policy.version}. Users must accept this version at their next login.`,
      ipAddress: req.ip,
      metadata: { documentType: policy.document_type, version: policy.version },
      request: req,
      connection
    });
    published = { ...policy, status: 'PUBLISHED' };
  });
  return ok(res, { id: published.id }, 'Policy version published.');
}));

router.delete('/admin/:id', requireCsrf, asyncHandler(async (req, res) => {
  const [rows] = await pool.execute('SELECT status FROM policy_documents WHERE id = ?', [req.params.id]);
  if (!rows.length) throw new AppError(404, 'Policy document not found.');
  if (rows[0].status !== 'DRAFT') throw new AppError(409, 'Only unpublished drafts can be deleted.');
  await pool.execute('DELETE FROM policy_documents WHERE id = ?', [req.params.id]);
  await writeAudit({
    actorUserId: req.user.id,
    action: 'DELETE_POLICY_DRAFT',
    entityType: 'policy_documents',
    entityId: req.params.id,
    description: 'Deleted an unpublished policy draft.',
    ipAddress: req.ip,
    request: req
  });
  return ok(res, null, 'Policy draft deleted.');
}));

export default router;
