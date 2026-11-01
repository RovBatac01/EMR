import express from 'express';
import { z } from 'zod';
import { pool, withTransaction } from '../config/db.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { requireCsrf } from '../middleware/csrf.js';
import { validate } from '../middleware/validate.js';
import { AppError, asyncHandler, created, ok } from '../utils/http.js';
import { paginationFromQuery, paginationMeta } from '../utils/pagination.js';
import { reference, uuid } from '../utils/ids.js';
import { writeAudit } from '../utils/audit.js';

const router = express.Router();
router.use(authenticate);

const medicineBody = z.object({
  medicineCode: z.string().trim().max(40).optional(),
  genericName: z.string().trim().min(2).max(180),
  brandName: z.string().trim().max(180).optional().nullable(),
  categoryId: z.preprocess((value) => value === '' || value === undefined ? null : value, z.string().uuid().nullable().optional()),
  categoryName: z.preprocess((value) => value === '' || value === undefined ? null : value, z.string().trim().max(120).nullable().optional()),
  dosageForm: z.string().trim().min(1).max(120),
  unit: z.string().trim().min(1).max(40),
  minimumStock: z.coerce.number().int().min(0),
  supplier: z.string().trim().max(180).optional().nullable(),
  storageLocation: z.string().trim().max(180).optional().nullable(),
  initialBatch: z.object({
    batchNumber: z.string().trim().min(1).max(100),
    quantity: z.coerce.number().int().min(0),
    expirationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    receivedDate: z.preprocess((value) => value === '' || value === undefined ? undefined : value, z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional())
  }).optional()
});

const inventoryGroupBy = 'm.id, m.medicine_code, m.generic_name, m.brand_name, m.category_id, m.dosage_form, m.unit, m.minimum_stock, m.supplier, m.storage_location, m.is_active, m.pre_archive_is_active, m.archived_at, m.archived_by, m.archive_reason, m.unarchived_at, m.unarchived_by, m.created_at, m.updated_at, mc.name';

const inventorySelect = `
  SELECT m.*, mc.name AS category_name,
    COALESCE(SUM(CASE WHEN mb.expiration_date >= CURDATE() THEN mb.quantity ELSE 0 END), 0) AS available_quantity,
    COALESCE(SUM(mb.quantity), 0) AS total_quantity,
    MIN(CASE WHEN mb.quantity > 0 AND mb.expiration_date >= CURDATE() THEN mb.expiration_date END) AS nearest_expiration,
    SUM(CASE WHEN mb.quantity > 0 AND mb.expiration_date < CURDATE() THEN mb.quantity ELSE 0 END) AS expired_quantity,
    CASE
      WHEN m.archived_at IS NOT NULL THEN 'ARCHIVED'
      WHEN m.is_active = 0 THEN 'INACTIVE'
      WHEN COALESCE(SUM(CASE WHEN mb.expiration_date >= CURDATE() THEN mb.quantity ELSE 0 END), 0) = 0 THEN 'OUT_OF_STOCK'
      WHEN COALESCE(SUM(CASE WHEN mb.expiration_date >= CURDATE() THEN mb.quantity ELSE 0 END), 0) <= m.minimum_stock THEN 'LOW_STOCK'
      WHEN MIN(CASE WHEN mb.quantity > 0 AND mb.expiration_date >= CURDATE() THEN mb.expiration_date END) <= DATE_ADD(CURDATE(), INTERVAL 60 DAY) THEN 'NEAR_EXPIRATION'
      ELSE 'AVAILABLE'
    END AS stock_status
  FROM medicines m
  LEFT JOIN medicine_categories mc ON mc.id = m.category_id
  LEFT JOIN medicine_batches mb ON mb.medicine_id = m.id`;

router.get('/categories', authorize('medicines.read'), asyncHandler(async (_req, res) => {
  const [rows] = await pool.query(`SELECT mc.*, COUNT(m.id) AS medicine_count
    FROM medicine_categories mc LEFT JOIN medicines m ON m.category_id = mc.id
    GROUP BY mc.id ORDER BY mc.is_active DESC, mc.name`);
  return ok(res, rows);
}));


router.post('/categories', authorize('medicines.write'), requireCsrf, validate(z.object({
  body: z.object({ name: z.string().trim().min(2).max(120), description: z.string().trim().max(500).optional().nullable() }),
  params: z.object({}), query: z.object({})
})), asyncHandler(async (req, res) => {
  const id = uuid();
  await pool.execute('INSERT INTO medicine_categories (id,name,description,is_active) VALUES (?,?,?,1)', [id, req.validated.body.name, req.validated.body.description || null]);
  await writeAudit({ actorUserId:req.user.id, action:'CREATE_MEDICINE_CATEGORY', entityType:'medicine_categories', entityId:id, description:`Created medicine category ${req.validated.body.name}.`, ipAddress:req.ip, request:req });
  return created(res, { id }, 'Medicine category created.');
}));

router.patch('/categories/:categoryId', authorize('medicines.write'), requireCsrf, validate(z.object({
  body: z.object({ name:z.string().trim().min(2).max(120).optional(), description:z.string().trim().max(500).optional().nullable(), isActive:z.boolean().optional() }),
  params:z.object({categoryId:z.string().uuid()}), query:z.object({})
})), asyncHandler(async(req,res)=>{
  const map={name:'name',description:'description',isActive:'is_active'};const sets=[];const params=[];
  for(const [key,column] of Object.entries(map))if(Object.hasOwn(req.validated.body,key)){sets.push(`${column}=?`);params.push(key==='isActive'?(req.validated.body[key]?1:0):(req.validated.body[key]||null));}
  if(!sets.length)return ok(res,{id:req.params.categoryId},'No changes submitted.');
  params.push(req.params.categoryId);const[result]=await pool.execute(`UPDATE medicine_categories SET ${sets.join(',')},updated_at=NOW() WHERE id=?`,params);if(!result.affectedRows)throw new AppError(404,'Medicine category not found.');
  await writeAudit({actorUserId:req.user.id,action:'UPDATE_MEDICINE_CATEGORY',entityType:'medicine_categories',entityId:req.params.categoryId,description:'Updated a medicine category.',ipAddress:req.ip,metadata:{fields:Object.keys(req.validated.body)},request:req});
  return ok(res,{id:req.params.categoryId},'Medicine category updated.');
}));

router.delete('/categories/:categoryId', authorize('medicines.write'), requireCsrf, asyncHandler(async(req,res)=>{
  const[result]=await pool.execute('UPDATE medicine_categories SET is_active=0,updated_at=NOW() WHERE id=?',[req.params.categoryId]);if(!result.affectedRows)throw new AppError(404,'Medicine category not found.');
  await writeAudit({actorUserId:req.user.id,action:'DEACTIVATE_MEDICINE_CATEGORY',entityType:'medicine_categories',entityId:req.params.categoryId,description:'Deactivated a medicine category without changing existing medicine records.',ipAddress:req.ip,request:req});
  return ok(res,null,'Medicine category deactivated.');
}));

router.get('/low-stock', authorize('medicines.read'), asyncHandler(async (_req, res) => {
  const [rows] = await pool.query(`${inventorySelect} WHERE m.is_active = 1 AND m.archived_at IS NULL GROUP BY ${inventoryGroupBy} HAVING stock_status IN ('LOW_STOCK','OUT_OF_STOCK') ORDER BY available_quantity ASC`);
  return ok(res, rows);
}));

router.get('/expired', authorize('medicines.read'), asyncHandler(async (_req, res) => {
  const [rows] = await pool.query(
    `SELECT mb.*, m.medicine_code, m.generic_name, m.brand_name, m.unit
     FROM medicine_batches mb JOIN medicines m ON m.id=mb.medicine_id
     WHERE mb.quantity > 0 AND mb.expiration_date < CURDATE() AND m.archived_at IS NULL
     ORDER BY mb.expiration_date ASC`
  );
  return ok(res, rows);
}));

router.get('/', authorize('medicines.read'), asyncHandler(async (req, res) => {
  const { page, limit, offset } = paginationFromQuery(req.query);
  const clauses=['m.archived_at IS NULL']; const params=[];
  if (req.query.search) { const like=`%${String(req.query.search).trim()}%`; clauses.push('(m.medicine_code LIKE ? OR m.generic_name LIKE ? OR m.brand_name LIKE ?)'); params.push(like,like,like); }
  if (req.query.categoryId) { clauses.push('m.category_id = ?'); params.push(req.query.categoryId); }
  if (req.query.active !== undefined && req.query.active !== '') { clauses.push('m.is_active = ?'); params.push(req.query.active === 'true' ? 1 : 0); }
  const where=clauses.join(' AND ');
  const [countRows]=await pool.execute(`SELECT COUNT(*) AS total FROM medicines m WHERE ${where}`,params);
  const [rows]=await pool.execute(`${inventorySelect} WHERE ${where} GROUP BY ${inventoryGroupBy} ORDER BY m.generic_name LIMIT ? OFFSET ?`,[...params,limit,offset]);
  return ok(res,rows,'Medicine inventory loaded.',paginationMeta(countRows[0].total,page,limit));
}));

router.post('/', authorize('medicines.write'), requireCsrf, validate(z.object({body:medicineBody,params:z.object({}),query:z.object({})})), asyncHandler(async(req,res)=>{
  const data=req.validated.body; const id=uuid();
  await withTransaction(async(connection)=>{
    let categoryId=data.categoryId||null;
    if(!categoryId && data.categoryName){
      const [existing]=await connection.execute('SELECT id FROM medicine_categories WHERE LOWER(name)=LOWER(?) LIMIT 1',[data.categoryName]);
      if(existing.length) categoryId=existing[0].id;
      else { categoryId=uuid(); await connection.execute('INSERT INTO medicine_categories (id,name,is_active) VALUES (?,?,1)',[categoryId,data.categoryName]); }
    }
    const medicineCode=data.medicineCode||reference('MED');
    await connection.execute(
      `INSERT INTO medicines (id,medicine_code,generic_name,brand_name,category_id,dosage_form,unit,minimum_stock,supplier,storage_location,is_active)
       VALUES (?,?,?,?,?,?,?,?,?,?,1)`,
      [id,medicineCode,data.genericName,data.brandName||null,categoryId,data.dosageForm,data.unit,data.minimumStock,data.supplier||null,data.storageLocation||null]
    );
    if(data.initialBatch){
      const batchId=uuid();
      await connection.execute(
        `INSERT INTO medicine_batches (id,medicine_id,batch_number,quantity,expiration_date,received_date)
         VALUES (?,?,?,?,?,COALESCE(?,CURDATE()))`,
        [batchId,id,data.initialBatch.batchNumber,data.initialBatch.quantity,data.initialBatch.expirationDate,data.initialBatch.receivedDate||null]
      );
      await connection.execute(
        `INSERT INTO inventory_transactions (id,medicine_id,batch_id,transaction_type,quantity_change,balance_after,reference_type,created_by)
         VALUES (?,?,?,'RECEIPT',?,?, 'INITIAL_STOCK',?)`,
        [uuid(),id,batchId,data.initialBatch.quantity,data.initialBatch.quantity,req.user.id]
      );
    }
    await writeAudit({actorUserId:req.user.id,action:'ADD_MEDICINE',entityType:'medicines',entityId:id,description:`Added medicine ${data.genericName}.`,ipAddress:req.ip,request:req,connection});
  });
  return created(res,{id},'Medicine added successfully.');
}));

router.get('/:id', authorize('medicines.read'), asyncHandler(async(req,res)=>{
  const [medicines]=await pool.execute(`${inventorySelect} WHERE m.id=? GROUP BY ${inventoryGroupBy}`,[req.params.id]);
  if(!medicines.length) throw new AppError(404,'Medicine not found.');
  const [batches]=await pool.execute(
    `SELECT *, CASE WHEN quantity=0 THEN 'OUT_OF_STOCK' WHEN expiration_date<CURDATE() THEN 'EXPIRED' WHEN expiration_date<=DATE_ADD(CURDATE(),INTERVAL 60 DAY) THEN 'NEAR_EXPIRATION' ELSE 'AVAILABLE' END AS status
     FROM medicine_batches WHERE medicine_id=? ORDER BY expiration_date ASC`,[req.params.id]
  );
  return ok(res,{medicine:medicines[0],batches});
}));

router.patch('/:id', authorize('medicines.write'), requireCsrf, validate(z.object({body:medicineBody.partial().extend({isActive:z.boolean().optional()}),params:z.object({id:z.string().uuid()}),query:z.object({})})), asyncHandler(async(req,res)=>{
  const [existing] = await pool.execute('SELECT archived_at FROM medicines WHERE id = ?', [req.params.id]);
  if (!existing.length) throw new AppError(404, 'Medicine not found.');
  if (existing[0].archived_at) throw new AppError(409, 'Archived medicines are read-only. Restore the medicine before editing.');
  const map={medicineCode:'medicine_code',genericName:'generic_name',brandName:'brand_name',categoryId:'category_id',dosageForm:'dosage_form',unit:'unit',minimumStock:'minimum_stock',supplier:'supplier',storageLocation:'storage_location',isActive:'is_active'};
  const sets=[];const params=[];
  for(const [key,column] of Object.entries(map)) if(Object.hasOwn(req.validated.body,key)){sets.push(`${column}=?`);params.push(key==='isActive'?(req.validated.body[key]?1:0):(req.validated.body[key]||null));}
  if(!sets.length) return ok(res,{id:req.params.id},'No changes were submitted.');
  params.push(req.params.id);
  const [result]=await pool.execute(`UPDATE medicines SET ${sets.join(',')},updated_at=NOW() WHERE id=?`,params);
  if(!result.affectedRows) throw new AppError(404,'Medicine not found.');
  await writeAudit({actorUserId:req.user.id,action:'UPDATE_MEDICINE',entityType:'medicines',entityId:req.params.id,description:'Updated medicine information.',ipAddress:req.ip,metadata:{fields:Object.keys(req.validated.body)},request:req});
  return ok(res,{id:req.params.id},'Medicine updated successfully.');
}));

router.post('/:id/batches', authorize('medicines.write'), requireCsrf, validate(z.object({body:z.object({batchNumber:z.string().trim().min(1).max(100),quantity:z.coerce.number().int().positive(),expirationDate:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),receivedDate:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),idempotencyKey:z.string().trim().min(8).max(120).optional()}),params:z.object({id:z.string().uuid()}),query:z.object({})})), asyncHandler(async(req,res)=>{
  const data=req.validated.body;
  const result=await withTransaction(async(connection)=>{
    if(data.idempotencyKey){
      await connection.execute(`INSERT IGNORE INTO api_idempotency_keys (id,user_id,scope,idempotency_key,expires_at) VALUES (?,?,'MEDICINE_RECEIPT',?,DATE_ADD(NOW(),INTERVAL 1 DAY))`,[uuid(),req.user.id,data.idempotencyKey]);
      const[keys]=await connection.execute(`SELECT resource_id,response_json FROM api_idempotency_keys WHERE user_id=? AND scope='MEDICINE_RECEIPT' AND idempotency_key=? FOR UPDATE`,[req.user.id,data.idempotencyKey]);
      if(keys[0]?.resource_id){try{return JSON.parse(keys[0].response_json);}catch{return{id:keys[0].resource_id};}}
    }
    const [medicine]=await connection.execute('SELECT id,generic_name FROM medicines WHERE id=? AND is_active=1 AND archived_at IS NULL FOR UPDATE',[req.params.id]);
    if(!medicine.length) throw new AppError(404,'Active medicine not found.');
    const [duplicates]=await connection.execute('SELECT id FROM medicine_batches WHERE medicine_id=? AND batch_number=? FOR UPDATE',[req.params.id,data.batchNumber]);
    if(duplicates.length) throw new AppError(409,'This batch number already exists for the selected medicine. Open the existing batch or use the inventory adjustment workflow.');
    const batchId=uuid();
    await connection.execute('INSERT INTO medicine_batches (id,medicine_id,batch_number,quantity,expiration_date,received_date) VALUES (?,?,?,?,?,COALESCE(?,CURDATE()))',[batchId,req.params.id,data.batchNumber,data.quantity,data.expirationDate,data.receivedDate||null]);
    await connection.execute("INSERT INTO inventory_transactions (id,medicine_id,batch_id,transaction_type,quantity_change,balance_after,reference_type,created_by) VALUES (?,?,?,'RECEIPT',?,?,'STOCK_RECEIPT',?)",[uuid(),req.params.id,batchId,data.quantity,data.quantity,req.user.id]);
    const response={id:batchId};
    if(data.idempotencyKey)await connection.execute(`UPDATE api_idempotency_keys SET resource_type='medicine_batches',resource_id=?,response_json=? WHERE user_id=? AND scope='MEDICINE_RECEIPT' AND idempotency_key=?`,[batchId,JSON.stringify(response),req.user.id,data.idempotencyKey]);
    await writeAudit({actorUserId:req.user.id,action:'RECEIVE_MEDICINE_STOCK',entityType:'medicine_batches',entityId:batchId,description:`Received ${data.quantity} units of ${medicine[0].generic_name}.`,ipAddress:req.ip,request:req,connection});
    return response;
  });
  return created(res,result,'Medicine batch received successfully.');
}));

router.delete('/:id', authorize('medicines.archive'), requireCsrf, asyncHandler(async (_req, _res) => {
  throw new AppError(409, 'Medicine deactivation has been replaced by the audited Archive action. Use POST /api/archives/medicines/:id/archive.');
}));

export default router;
