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
import { writeAudit } from '../utils/audit.js';
import { paginationFromQuery, paginationMeta } from '../utils/pagination.js';
import {
  hasValidFileSignature,
  removeUploadedFile,
  removeUploadedFiles
} from '../utils/fileSignatures.js';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const landingDir = path.resolve(__dirname, '..', env.UPLOAD_DIR, 'landing');
await fs.mkdir(landingDir, { recursive: true });

const mediaExtensions = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'video/mp4': '.mp4',
  'video/webm': '.webm'
};
const imageMimes = new Set(['image/png', 'image/jpeg', 'image/webp']);
const videoMimes = new Set(['video/mp4', 'video/webm']);
const maxImageBytes = 5 * 1024 * 1024;
const maxVideoBytes = 25 * 1024 * 1024;

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, landingDir),
    filename: (_req, file, callback) => callback(
      null,
      `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${mediaExtensions[file.mimetype] || '.bin'}`
    )
  }),
  limits: { fileSize: maxVideoBytes, files: 12 },
  fileFilter: (_req, file, callback) => {
    if (!mediaExtensions[file.mimetype]) {
      return callback(new AppError(400, 'Landing media must be PNG, JPG, WebP, MP4, or WebM.'));
    }
    return callback(null, true);
  }
});

async function validateLandingFile(file, { allowVideo = false, label = 'Uploaded media' } = {}) {
  if (!file) return;
  const allowed = imageMimes.has(file.mimetype) || (allowVideo && videoMimes.has(file.mimetype));
  if (!allowed) throw new AppError(422, `${label} has an unsupported file type.`);
  const limit = videoMimes.has(file.mimetype) ? maxVideoBytes : maxImageBytes;
  if (file.size > limit) throw new AppError(422, `${label} exceeds the ${limit / (1024 * 1024)} MB size limit.`);
  if (!await hasValidFileSignature(file.path, file.mimetype)) {
    throw new AppError(422, `${label} does not match its declared file type.`);
  }
}

function allRequestFiles(req) {
  return [
    req.file,
    ...(req.files?.heroMedia || []),
    ...(req.files?.fallbackImage || []),
    ...(Array.isArray(req.files) ? req.files : []),
    ...(req.files?.images || [])
  ].filter(Boolean);
}

async function removeStoredLandingMedia(publicPath) {
  if (!publicPath?.startsWith('/uploads/landing/')) return;
  await fs.unlink(path.join(landingDir, path.basename(publicPath))).catch(() => {});
}

function normalizeConfig(row) {
  return row || {
    hero_heading: 'KLD School Clinic',
    hero_description: '',
    hero_media_type: 'NONE',
    is_published: 1
  };
}

function parseMetadata(row) {
  const result = { ...row };
  if (typeof result.metadata_json === 'string') {
    try { result.metadata = JSON.parse(result.metadata_json); }
    catch { result.metadata = {}; }
  } else result.metadata = result.metadata_json || {};
  delete result.metadata_json;
  return result;
}

async function attachMedia(items, connection = pool) {
  if (!items.length) return [];
  const placeholders = items.map(() => '?').join(',');
  const [media] = await connection.execute(
    `SELECT * FROM landing_content_media
     WHERE content_item_id IN (${placeholders})
     ORDER BY content_item_id, is_cover DESC, sort_order, created_at`,
    items.map((item) => item.id)
  );
  const byItem = new Map();
  for (const entry of media) {
    if (!byItem.has(entry.content_item_id)) byItem.set(entry.content_item_id, []);
    byItem.get(entry.content_item_id).push(entry);
  }
  return items.map((item) => {
    const gallery = byItem.get(item.id) || [];
    const cover = gallery.find((entry) => Number(entry.is_cover) === 1) || gallery[0];
    return {
      ...parseMetadata(item),
      media: gallery,
      cover_image_path: cover?.file_path || item.image_path || null
    };
  });
}

function visiblePostWhere() {
  return `is_published = 1
    AND (publish_from IS NULL OR publish_from <= NOW())
    AND (publish_until IS NULL OR publish_until >= NOW())`;
}

router.get('/landing', asyncHandler(async (_req, res) => {
  const [configRows] = await pool.query(
    'SELECT * FROM landing_page_config WHERE is_published=1 ORDER BY updated_at DESC LIMIT 1'
  );
  const [items] = await pool.query(
    `SELECT * FROM landing_content_items
     WHERE ${visiblePostWhere()}
     ORDER BY section_type, sort_order, COALESCE(publication_date, DATE(created_at)) DESC, created_at DESC`
  );
  const [services] = await pool.query(
    `SELECT id,name,description,duration_minutes,slot_capacity,sort_order
     FROM appointment_services WHERE is_active=1 AND is_public=1 ORDER BY sort_order,name`
  );
  return ok(res, {
    config: normalizeConfig(configRows[0]),
    items: await attachMedia(items),
    services
  }, 'Public clinic content loaded.');
}));

router.get('/landing/posts', asyncHandler(async (req, res) => {
  const { page, limit, offset } = paginationFromQuery(req.query);
  const type = String(req.query.type || '').toUpperCase();
  const clauses = [visiblePostWhere(), "section_type IN ('ANNOUNCEMENT','PROMOTION')"];
  const params = [];
  if (['ANNOUNCEMENT', 'PROMOTION'].includes(type)) {
    clauses.push('section_type = ?');
    params.push(type);
  }
  if (req.query.search) {
    const like = `%${String(req.query.search).trim()}%`;
    clauses.push('(title LIKE ? OR summary LIKE ? OR body LIKE ?)');
    params.push(like, like, like);
  }
  const where = clauses.join(' AND ');
  const [[count]] = await pool.execute(`SELECT COUNT(*) AS total FROM landing_content_items WHERE ${where}`, params);
  const [items] = await pool.execute(
    `SELECT * FROM landing_content_items WHERE ${where}
     ORDER BY COALESCE(publication_date, DATE(created_at)) DESC, sort_order, created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  return ok(res, await attachMedia(items), 'Published posts loaded.', paginationMeta(count.total, page, limit));
}));

router.get('/landing/posts/:id', asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT * FROM landing_content_items
     WHERE id = ? AND ${visiblePostWhere()} AND section_type IN ('ANNOUNCEMENT','PROMOTION')`,
    [req.params.id]
  );
  if (!rows.length) throw new AppError(404, 'Announcement or promotion not found.');
  const [item] = await attachMedia(rows);
  return ok(res, item);
}));

router.use('/landing/admin', authenticate, authorize('landing.manage'));

router.get('/landing/admin', asyncHandler(async (_req, res) => {
  const [configRows] = await pool.query('SELECT * FROM landing_page_config ORDER BY updated_at DESC LIMIT 1');
  const [items] = await pool.query(
    `SELECT * FROM landing_content_items
     ORDER BY section_type, sort_order, COALESCE(publication_date, DATE(created_at)) DESC, created_at DESC`
  );
  return ok(res, { config: normalizeConfig(configRows[0]), items: await attachMedia(items) });
}));

const boolField = z.preprocess(
  (value) => value === true || value === 'true' || value === '1',
  z.boolean()
);

const configFields = z.object({
  heroHeading: z.string().trim().min(2).max(220),
  heroDescription: z.string().max(2000).optional().nullable(),
  heroMediaType: z.enum(['IMAGE', 'VIDEO', 'NONE']).default('NONE'),
  removeHeroMedia: boolField.optional().default(false),
  removeFallbackImage: boolField.optional().default(false),
  primaryCtaLabel: z.string().max(100).optional().nullable(),
  primaryCtaUrl: z.string().max(500).optional().nullable(),
  secondaryCtaLabel: z.string().max(100).optional().nullable(),
  secondaryCtaUrl: z.string().max(500).optional().nullable(),
  aboutHeading: z.string().max(180).optional().nullable(),
  aboutContent: z.string().max(20000).optional().nullable(),
  contactHeading: z.string().max(180).optional().nullable(),
  contactContent: z.string().max(20000).optional().nullable(),
  operatingHours: z.string().max(5000).optional().nullable(),
  locationText: z.string().max(1000).optional().nullable(),
  locationUrl: z.string().max(500).optional().nullable(),
  isPublished: boolField
});

router.patch(
  '/landing/admin/config',
  requireCsrf,
  upload.fields([{ name: 'heroMedia', maxCount: 1 }, { name: 'fallbackImage', maxCount: 1 }]),
  asyncHandler(async (req, res) => {
    const files = allRequestFiles(req);
    const parsed = configFields.safeParse(req.body);
    if (!parsed.success) {
      await removeUploadedFiles(files);
      throw new AppError(422, 'Please correct the landing-page fields.', parsed.error.flatten());
    }

    const data = parsed.data;
    const heroFile = req.files?.heroMedia?.[0];
    const fallbackFile = req.files?.fallbackImage?.[0];
    try {
      await validateLandingFile(heroFile, { allowVideo: true, label: 'Hero media' });
      await validateLandingFile(fallbackFile, { label: 'Video fallback image' });
      if (data.heroMediaType === 'IMAGE' && heroFile && !imageMimes.has(heroFile.mimetype)) {
        throw new AppError(422, 'The selected hero file is not a supported image.');
      }
      if (data.heroMediaType === 'VIDEO' && heroFile && !videoMimes.has(heroFile.mimetype)) {
        throw new AppError(422, 'The selected hero file is not a supported video.');
      }
      if (data.heroMediaType === 'NONE' && heroFile) {
        throw new AppError(422, 'Choose Image or Video before uploading hero media.');
      }
      if (fallbackFile && data.heroMediaType !== 'VIDEO') {
        throw new AppError(422, 'A fallback image can only be used with a video hero.');
      }

      const [existing] = await pool.query('SELECT * FROM landing_page_config ORDER BY updated_at DESC LIMIT 1');
      const current = existing[0] || null;
      const changingType = current?.hero_media_type && current.hero_media_type !== data.heroMediaType;
      const removingHero = data.removeHeroMedia || data.heroMediaType === 'NONE';

      if (!removingHero && data.heroMediaType !== 'NONE' && !heroFile && (changingType || !current?.hero_media_path)) {
        throw new AppError(422, `Upload a ${data.heroMediaType.toLowerCase()} when changing the hero media type.`);
      }

      const id = current?.id || uuid();
      const heroPath = removingHero
        ? null
        : heroFile
          ? `/uploads/landing/${heroFile.filename}`
          : current?.hero_media_path || null;
      const fallbackPath = data.heroMediaType === 'VIDEO' && !data.removeFallbackImage
        ? fallbackFile
          ? `/uploads/landing/${fallbackFile.filename}`
          : current?.hero_fallback_path || null
        : null;

      await withTransaction(async (connection) => {
        await connection.execute(
          `INSERT INTO landing_page_config
            (id,hero_heading,hero_description,hero_media_type,hero_media_path,hero_fallback_path,
             primary_cta_label,primary_cta_url,secondary_cta_label,secondary_cta_url,
             about_heading,about_content,contact_heading,contact_content,operating_hours,location_text,location_url,is_published,updated_by)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
           ON DUPLICATE KEY UPDATE
             hero_heading=VALUES(hero_heading),hero_description=VALUES(hero_description),hero_media_type=VALUES(hero_media_type),
             hero_media_path=VALUES(hero_media_path),hero_fallback_path=VALUES(hero_fallback_path),
             primary_cta_label=VALUES(primary_cta_label),primary_cta_url=VALUES(primary_cta_url),
             secondary_cta_label=VALUES(secondary_cta_label),secondary_cta_url=VALUES(secondary_cta_url),
             about_heading=VALUES(about_heading),about_content=VALUES(about_content),
             contact_heading=VALUES(contact_heading),contact_content=VALUES(contact_content),
             operating_hours=VALUES(operating_hours),location_text=VALUES(location_text),location_url=VALUES(location_url),
             is_published=VALUES(is_published),updated_by=VALUES(updated_by),updated_at=NOW()`,
          [id, data.heroHeading, data.heroDescription || null, data.heroMediaType, heroPath,
            fallbackPath, data.primaryCtaLabel || null, data.primaryCtaUrl || null, data.secondaryCtaLabel || null,
            data.secondaryCtaUrl || null, data.aboutHeading || null, data.aboutContent || null, data.contactHeading || null,
            data.contactContent || null, data.operatingHours || null, data.locationText || null, data.locationUrl || null,
            data.isPublished ? 1 : 0, req.user.id]
        );
        await writeAudit({
          actorUserId: req.user.id,
          action: 'UPDATE_PUBLIC_LANDING',
          entityType: 'landing_page_config',
          entityId: id,
          description: 'Updated the public clinic landing page.',
          ipAddress: req.ip,
          metadata: { heroMediaType: data.heroMediaType, heroReplaced: Boolean(heroFile), heroRemoved: removingHero },
          request: req,
          connection
        });
      });

      if (current?.hero_media_path && current.hero_media_path !== heroPath) {
        await removeStoredLandingMedia(current.hero_media_path);
      }
      if (current?.hero_fallback_path && current.hero_fallback_path !== fallbackPath) {
        await removeStoredLandingMedia(current.hero_fallback_path);
      }
      return ok(res, { id, heroMediaPath: heroPath, fallbackImagePath: fallbackPath }, 'Public landing page updated.');
    } catch (error) {
      await removeUploadedFiles(files);
      throw error;
    }
  })
);

const itemBody = z.object({
  sectionType: z.enum(['ANNOUNCEMENT', 'PROMOTION', 'SERVICE', 'TEAM']),
  title: z.string().trim().min(2).max(220),
  summary: z.string().max(2000).optional().nullable(),
  body: z.string().max(20000).optional().nullable(),
  publicationDate: z.preprocess(
    (value) => value === '' || value == null ? null : value,
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional()
  ),
  linkLabel: z.string().max(100).optional().nullable(),
  linkUrl: z.string().max(500).optional().nullable(),
  metadata: z.union([z.string(), z.record(z.any())]).optional().nullable(),
  sortOrder: z.coerce.number().int().min(-1000).max(1000).default(0),
  isPublished: boolField,
  publishFrom: z.preprocess((value) => value === '' ? null : value, z.string().nullable().optional()),
  publishUntil: z.preprocess((value) => value === '' ? null : value, z.string().nullable().optional()),
  coverIndex: z.coerce.number().int().min(0).max(11).optional().default(0),
  coverMediaId: z.preprocess((value) => value === '' ? null : value, z.string().uuid().nullable().optional()),
  replaceImages: boolField.optional().default(false)
});

function normalizeMetadata(value) {
  if (typeof value !== 'string') return value || {};
  try { return value ? JSON.parse(value) : {}; }
  catch { return {}; }
}

async function insertMedia(connection, itemId, files, coverIndex, userId, title) {
  const rows = [];
  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    const media = {
      id: uuid(),
      path: `/uploads/landing/${file.filename}`,
      isCover: index === Math.min(coverIndex, files.length - 1)
    };
    await connection.execute(
      `INSERT INTO landing_content_media
        (id,content_item_id,file_path,alt_text,sort_order,is_cover,created_by)
       VALUES (?,?,?,?,?,?,?)`,
      [media.id, itemId, media.path, title, index, media.isCover ? 1 : 0, userId]
    );
    rows.push(media);
  }
  return rows;
}

router.post('/landing/admin/items', requireCsrf, upload.array('images', 8), asyncHandler(async (req, res) => {
  const files = Array.isArray(req.files) ? req.files : [];
  const parsed = itemBody.safeParse(req.body);
  if (!parsed.success) {
    await removeUploadedFiles(files);
    throw new AppError(422, 'Please correct the content-item fields.', parsed.error.flatten());
  }
  try {
    for (const [index, file] of files.entries()) {
      await validateLandingFile(file, { label: `Content image ${index + 1}` });
    }
    const id = uuid();
    const data = parsed.data;
    await withTransaction(async (connection) => {
      await connection.execute(
        `INSERT INTO landing_content_items
          (id,section_type,title,summary,body,publication_date,image_path,link_label,link_url,metadata_json,
           sort_order,is_published,publish_from,publish_until,created_by,updated_by)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [id, data.sectionType, data.title, data.summary || null, data.body || null, data.publicationDate || null,
          null, data.linkLabel || null, data.linkUrl || null, JSON.stringify(normalizeMetadata(data.metadata)),
          data.sortOrder, data.isPublished ? 1 : 0, data.publishFrom || null, data.publishUntil || null,
          req.user.id, req.user.id]
      );
      const mediaRows = await insertMedia(connection, id, files, data.coverIndex, req.user.id, data.title);
      const coverPath = mediaRows.find((row) => row.isCover)?.path || null;
      if (coverPath) {
        await connection.execute('UPDATE landing_content_items SET image_path = ? WHERE id = ?', [coverPath, id]);
      }
      await writeAudit({
        actorUserId: req.user.id,
        action: 'CREATE_LANDING_CONTENT',
        entityType: 'landing_content_items',
        entityId: id,
        description: `Created landing content: ${data.title}.`,
        ipAddress: req.ip,
        metadata: { imageCount: files.length, published: data.isPublished },
        request: req,
        connection
      });
    });
    return created(res, { id }, 'Landing-page content created.');
  } catch (error) {
    await removeUploadedFiles(files);
    throw error;
  }
}));

router.patch('/landing/admin/items/:id', requireCsrf, upload.array('images', 8), asyncHandler(async (req, res) => {
  const files = Array.isArray(req.files) ? req.files : [];
  const parsed = itemBody.partial().safeParse(req.body);
  if (!parsed.success) {
    await removeUploadedFiles(files);
    throw new AppError(422, 'Please correct the content-item fields.', parsed.error.flatten());
  }
  try {
    for (const [index, file] of files.entries()) {
      await validateLandingFile(file, { label: `Content image ${index + 1}` });
    }
    const [existingRows] = await pool.execute('SELECT * FROM landing_content_items WHERE id = ?', [req.params.id]);
    if (!existingRows.length) throw new AppError(404, 'Landing-page content was not found.');
    const current = existingRows[0];
    const data = {
      sectionType: parsed.data.sectionType ?? current.section_type,
      title: parsed.data.title ?? current.title,
      summary: parsed.data.summary ?? current.summary,
      body: parsed.data.body ?? current.body,
      publicationDate: parsed.data.publicationDate ?? current.publication_date,
      linkLabel: parsed.data.linkLabel ?? current.link_label,
      linkUrl: parsed.data.linkUrl ?? current.link_url,
      metadata: parsed.data.metadata ?? current.metadata_json,
      sortOrder: parsed.data.sortOrder ?? current.sort_order,
      isPublished: parsed.data.isPublished ?? Boolean(current.is_published),
      publishFrom: parsed.data.publishFrom ?? current.publish_from,
      publishUntil: parsed.data.publishUntil ?? current.publish_until,
      coverIndex: parsed.data.coverIndex ?? 0,
      coverMediaId: parsed.data.coverMediaId ?? null,
      replaceImages: parsed.data.replaceImages ?? files.length > 0
    };

    let oldMedia = [];
    await withTransaction(async (connection) => {
      const [mediaRows] = await connection.execute(
        'SELECT * FROM landing_content_media WHERE content_item_id = ? ORDER BY is_cover DESC, sort_order',
        [req.params.id]
      );
      oldMedia = mediaRows;
      let coverPath = current.image_path;

      if (files.length || data.replaceImages) {
        await connection.execute('DELETE FROM landing_content_media WHERE content_item_id = ?', [req.params.id]);
        const inserted = await insertMedia(connection, req.params.id, files, data.coverIndex, req.user.id, data.title);
        coverPath = inserted.find((row) => row.isCover)?.path || null;
      } else if (data.coverMediaId) {
        const chosen = mediaRows.find((row) => row.id === data.coverMediaId);
        if (!chosen) throw new AppError(422, 'The selected cover image does not belong to this post.');
        await connection.execute(
          'UPDATE landing_content_media SET is_cover = (id = ?), updated_at = NOW() WHERE content_item_id = ?',
          [data.coverMediaId, req.params.id]
        );
        coverPath = chosen.file_path;
      }

      await connection.execute(
        `UPDATE landing_content_items SET
          section_type=?,title=?,summary=?,body=?,publication_date=?,image_path=?,link_label=?,link_url=?,metadata_json=?,
          sort_order=?,is_published=?,publish_from=?,publish_until=?,updated_by=?,updated_at=NOW()
         WHERE id=?`,
        [data.sectionType, data.title, data.summary || null, data.body || null, data.publicationDate || null,
          coverPath, data.linkLabel || null, data.linkUrl || null, JSON.stringify(normalizeMetadata(data.metadata)),
          data.sortOrder, data.isPublished ? 1 : 0, data.publishFrom || null, data.publishUntil || null,
          req.user.id, req.params.id]
      );
      await writeAudit({
        actorUserId: req.user.id,
        action: 'UPDATE_LANDING_CONTENT',
        entityType: 'landing_content_items',
        entityId: req.params.id,
        description: `Updated landing content: ${data.title}.`,
        ipAddress: req.ip,
        metadata: { imageCount: files.length, imagesReplaced: Boolean(files.length || data.replaceImages), published: data.isPublished },
        request: req,
        connection
      });
    });

    if (files.length || data.replaceImages) {
      for (const media of oldMedia) await removeStoredLandingMedia(media.file_path);
      if (!oldMedia.length && current.image_path) await removeStoredLandingMedia(current.image_path);
    }
    return ok(res, { id: req.params.id }, 'Landing-page content updated.');
  } catch (error) {
    await removeUploadedFiles(files);
    throw error;
  }
}));

router.delete('/landing/admin/items/:id/media/:mediaId', requireCsrf, asyncHandler(async (req, res) => {
  let removed;
  await withTransaction(async (connection) => {
    const [rows] = await connection.execute(
      'SELECT * FROM landing_content_media WHERE id = ? AND content_item_id = ? FOR UPDATE',
      [req.params.mediaId, req.params.id]
    );
    if (!rows.length) throw new AppError(404, 'Post image not found.');
    removed = rows[0];
    await connection.execute('DELETE FROM landing_content_media WHERE id = ?', [removed.id]);
    const [remaining] = await connection.execute(
      'SELECT * FROM landing_content_media WHERE content_item_id = ? ORDER BY is_cover DESC, sort_order LIMIT 1',
      [req.params.id]
    );
    if (Number(removed.is_cover) === 1 && remaining.length) {
      await connection.execute('UPDATE landing_content_media SET is_cover = 1 WHERE id = ?', [remaining[0].id]);
    }
    await connection.execute(
      'UPDATE landing_content_items SET image_path = ?, updated_by = ?, updated_at = NOW() WHERE id = ?',
      [remaining[0]?.file_path || null, req.user.id, req.params.id]
    );
    await writeAudit({
      actorUserId: req.user.id,
      action: 'DELETE_LANDING_MEDIA',
      entityType: 'landing_content_media',
      entityId: removed.id,
      description: 'Deleted an image from a public post gallery.',
      ipAddress: req.ip,
      request: req,
      connection
    });
  });
  await removeStoredLandingMedia(removed.file_path);
  return ok(res, null, 'Post image removed.');
}));

router.delete('/landing/admin/items/:id', requireCsrf, asyncHandler(async (req, res) => {
  let item;
  let media = [];
  await withTransaction(async (connection) => {
    const [rows] = await connection.execute(
      'SELECT * FROM landing_content_items WHERE id = ? FOR UPDATE',
      [req.params.id]
    );
    if (!rows.length) throw new AppError(404, 'Landing-page content was not found.');
    item = rows[0];
    const [mediaRows] = await connection.execute(
      'SELECT file_path FROM landing_content_media WHERE content_item_id = ? FOR UPDATE',
      [req.params.id]
    );
    media = mediaRows;
    await connection.execute('DELETE FROM landing_content_items WHERE id = ?', [req.params.id]);
    await writeAudit({
      actorUserId: req.user.id,
      action: 'DELETE_LANDING_CONTENT',
      entityType: 'landing_content_items',
      entityId: req.params.id,
      description: `Deleted public landing-page content: ${item.title}.`,
      ipAddress: req.ip,
      metadata: { sectionType: item.section_type, imageCount: media.length },
      request: req,
      connection
    });
  });
  for (const entry of media) await removeStoredLandingMedia(entry.file_path);
  if (!media.length) await removeStoredLandingMedia(item.image_path);
  return ok(res, null, 'Landing-page content deleted.');
}));

export default router;
