import express from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { pool, withTransaction } from '../config/db.js';
import { env } from '../config/env.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { requireCsrf } from '../middleware/csrf.js';
import { AppError, asyncHandler, created, ok } from '../utils/http.js';
import { uuid } from '../utils/ids.js';
import { writeAudit, auditRecordAccess } from '../utils/audit.js';
import { getPatientForStudentUser } from '../services/patients/patientService.js';
import { hasValidFileSignature, removeUploadedFile } from '../utils/fileSignatures.js';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadRoot = path.resolve(__dirname, '..', env.UPLOAD_DIR);
const medicalDir = path.join(uploadRoot, 'medical');
await fs.mkdir(medicalDir, { recursive: true });

const allowed = {
  'application/pdf': '.pdf',
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp'
};

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, medicalDir),
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 12)}${allowed[file.mimetype] || '.bin'}`)
  }),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => allowed[file.mimetype]
    ? cb(null, true)
    : cb(new AppError(400, 'Attachment must be PDF, PNG, JPG, or WebP.'))
});

const uploadBody = z.object({
  patientId: z.string().uuid(),
  visitId: z.preprocess((value) => value === '' ? null : value, z.string().uuid().nullable().optional()),
  consultationId: z.preprocess((value) => value === '' ? null : value, z.string().uuid().nullable().optional()),
  description: z.preprocess((value) => value === '' ? null : value, z.string().trim().max(1000).nullable().optional())
});

router.use(authenticate);

async function canAccess(req, attachment) {
  if (req.user.role_code !== 'STUDENT') {
    return req.user.role_code === 'SUPER_ADMIN' || req.user.permissions.includes('patients.read');
  }
  const patient = await getPatientForStudentUser(pool, req.user.id);
  return patient.patient_id === attachment.patient_id;
}

function resolvePrivateAttachmentPath(relativePath) {
  const resolved = path.resolve(uploadRoot, relativePath);
  const relative = path.relative(medicalDir, resolved);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new AppError(400, 'Invalid attachment path.');
  }
  return resolved;
}

router.post('/', authorize('attachments.manage'), requireCsrf, upload.single('file'), asyncHandler(async (req, res) => {
  try {
    if (!req.file) throw new AppError(400, 'Select an attachment file.');

    const parsed = uploadBody.safeParse(req.body);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      throw new AppError(422, 'Please correct the highlighted attachment fields.', { fieldErrors });
    }

    if (!(await hasValidFileSignature(req.file.path, req.file.mimetype))) {
      throw new AppError(400, 'The uploaded attachment content does not match its declared file type.');
    }

    const data = parsed.data;
    const id = uuid();
    const relativePath = `medical/${req.file.filename}`;

    await withTransaction(async (connection) => {
      const [patients] = await connection.execute('SELECT id, archived_at FROM patients WHERE id=? FOR UPDATE', [data.patientId]);
      if (!patients.length) throw new AppError(404, 'Patient not found.');
      if (patients[0].archived_at) throw new AppError(409, 'Archived patient records are read-only. Restore the patient before uploading a new attachment.');

      if (data.visitId) {
        const [visits] = await connection.execute('SELECT id FROM visits WHERE id=? AND patient_id=?', [data.visitId, data.patientId]);
        if (!visits.length) throw new AppError(422, 'The selected visit does not belong to this patient.');
      }

      if (data.consultationId) {
        const [consultations] = await connection.execute('SELECT id,visit_id FROM consultations WHERE id=? AND patient_id=?', [data.consultationId, data.patientId]);
        if (!consultations.length) throw new AppError(422, 'The selected consultation does not belong to this patient.');
        if (data.visitId && consultations[0].visit_id !== data.visitId) {
          throw new AppError(422, 'The selected consultation is not associated with the selected visit.');
        }
      }

      await connection.execute(
        `INSERT INTO medical_attachments
         (id,patient_id,visit_id,consultation_id,original_name,stored_name,relative_path,mime_type,file_size,description,uploaded_by)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        [id, data.patientId, data.visitId ?? null, data.consultationId ?? null, req.file.originalname, req.file.filename, relativePath, req.file.mimetype, req.file.size, data.description ?? null, req.user.id]
      );

      await writeAudit({
        actorUserId: req.user.id,
        action: 'UPLOAD_MEDICAL_ATTACHMENT',
        entityType: 'medical_attachments',
        entityId: id,
        description: 'Uploaded an authorized medical attachment.',
        ipAddress: req.ip,
        metadata: { patientId: data.patientId, visitId: data.visitId ?? null, consultationId: data.consultationId ?? null, mimeType: req.file.mimetype, fileSize: req.file.size },
        request: req,
        connection
      });
    });

    return created(res, { id }, 'Medical attachment uploaded.');
  } catch (error) {
    await removeUploadedFile(req.file);
    throw error;
  }
}));

router.get('/:id/download', asyncHandler(async (req, res) => {
  if (!z.string().uuid().safeParse(req.params.id).success) throw new AppError(422, 'Invalid attachment identifier.');
  const [rows] = await pool.execute('SELECT * FROM medical_attachments WHERE id=?', [req.params.id]);
  if (!rows.length) throw new AppError(404, 'Attachment not found.');
  const attachment = rows[0];
  if (!(await canAccess(req, attachment))) throw new AppError(403, 'You do not have permission to download this attachment.');

  const filePath = resolvePrivateAttachmentPath(attachment.relative_path);
  try { await fs.access(filePath); } catch { throw new AppError(404, 'The attachment file is missing.'); }

  await auditRecordAccess({
    req,
    entityType: 'medical_attachments',
    entityId: attachment.id,
    action: 'DOWNLOAD_MEDICAL_ATTACHMENT',
    description: 'Downloaded an authorized medical attachment.',
    metadata: { patientId: attachment.patient_id, mimeType: attachment.mime_type }
  });
  res.type(attachment.mime_type);
  return res.download(filePath, attachment.original_name);
}));

router.delete('/:id', authorize('attachments.manage'), requireCsrf, asyncHandler(async (req, res) => {
  if (!z.string().uuid().safeParse(req.params.id).success) throw new AppError(422, 'Invalid attachment identifier.');
  const [rows] = await pool.execute('SELECT * FROM medical_attachments WHERE id=?', [req.params.id]);
  if (!rows.length) throw new AppError(404, 'Attachment not found.');

  await withTransaction(async (connection) => {
    await connection.execute('DELETE FROM medical_attachments WHERE id=?', [req.params.id]);
    await writeAudit({
      actorUserId: req.user.id,
      action: 'DELETE_MEDICAL_ATTACHMENT',
      entityType: 'medical_attachments',
      entityId: req.params.id,
      description: 'Deleted an authorized medical attachment.',
      ipAddress: req.ip,
      metadata: { patientId: rows[0].patient_id },
      request: req,
      connection
    });
  });

  const filePath = resolvePrivateAttachmentPath(rows[0].relative_path);
  await fs.unlink(filePath).catch(() => {});
  return ok(res, null, 'Attachment deleted.');
}));

export default router;
