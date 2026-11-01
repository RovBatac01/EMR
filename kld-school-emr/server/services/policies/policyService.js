import { pool } from '../../config/db.js';

export const POLICY_TYPES = ['PRIVACY_POLICY', 'TERMS_AND_CONDITIONS'];

export function normalizePolicyType(value) {
  const raw = String(value || '').trim().toUpperCase().replace(/[-\s]+/g, '_');
  if (raw === 'PRIVACY' || raw === 'PRIVACY_POLICY') return 'PRIVACY_POLICY';
  if (raw === 'TERMS' || raw === 'TERMS_AND_CONDITIONS') return 'TERMS_AND_CONDITIONS';
  return null;
}

export async function loadPublishedPolicies(connection = pool) {
  const [rows] = await connection.query(
    `SELECT id, document_type, version, title, body, published_at, updated_at
     FROM policy_documents
     WHERE status = 'PUBLISHED'
     ORDER BY document_type, published_at DESC, updated_at DESC`
  );

  const byType = new Map();
  for (const row of rows) {
    if (!byType.has(row.document_type)) byType.set(row.document_type, row);
  }
  return POLICY_TYPES.map((type) => byType.get(type)).filter(Boolean);
}

export async function loadPolicyAcceptanceStatus(connection, userId) {
  const policies = await loadPublishedPolicies(connection);
  if (!policies.length) return { policies: [], missing: [] };

  const placeholders = policies.map(() => '?').join(',');
  const [acceptedRows] = await connection.execute(
    `SELECT document_id FROM policy_acceptances
     WHERE user_id = ? AND document_id IN (${placeholders})`,
    [userId, ...policies.map((policy) => policy.id)]
  );
  const accepted = new Set(acceptedRows.map((row) => row.document_id));
  return {
    policies,
    missing: policies.filter((policy) => !accepted.has(policy.id))
  };
}

export function publicPolicy(policy) {
  return {
    id: policy.id,
    documentType: policy.document_type,
    version: policy.version,
    title: policy.title,
    body: policy.body,
    publishedAt: policy.published_at,
    updatedAt: policy.updated_at
  };
}
