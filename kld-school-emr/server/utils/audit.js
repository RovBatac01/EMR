import { pool } from '../config/db.js';

function safeRequestMetadata(request) {
  return {
    method: request?.method ?? null,
    path: request?.originalUrl ?? request?.path ?? null,
    requestId: request?.id ?? request?.headers?.['x-request-id'] ?? null
  };
}

export async function writeAudit({
  actorUserId = null,
  action,
  entityType = null,
  entityId = null,
  description,
  ipAddress = null,
  metadata = null,
  request = null,
  connection = pool
}) {
  const requestData = safeRequestMetadata(request);
  await connection.execute(
    `INSERT INTO activity_logs
      (actor_user_id, action, entity_type, entity_id, description, ip_address, request_method, request_path, request_id, metadata)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      actorUserId,
      action,
      entityType,
      entityId,
      description,
      ipAddress,
      requestData.method,
      requestData.path,
      requestData.requestId,
      metadata ? JSON.stringify(metadata) : null
    ]
  );
}

export async function auditRecordAccess({ req, entityType, entityId, action = 'VIEW_MEDICAL_RECORD', description, metadata = null, connection = pool }) {
  return writeAudit({
    actorUserId: req.user?.id || null,
    action,
    entityType,
    entityId,
    description,
    ipAddress: req.ip,
    metadata,
    request: req,
    connection
  });
}
