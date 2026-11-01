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
router.use(authenticate, authorize('medicines.read'));

router.get('/batches', asyncHandler(async(req,res)=>{
  const clauses=['1=1'];const params=[];
  if(req.query.medicineId){clauses.push('mb.medicine_id=?');params.push(req.query.medicineId);}
  if(req.query.active==='true')clauses.push('m.is_active=1');
  if(req.query.search){const like=`%${String(req.query.search).trim()}%`;clauses.push('(m.generic_name LIKE ? OR m.brand_name LIKE ? OR mb.batch_number LIKE ?)');params.push(like,like,like);}
  const [rows]=await pool.execute(`SELECT mb.*,m.medicine_code,m.generic_name,m.brand_name,m.unit,m.storage_location,mc.name category_name,
    CASE WHEN mb.quantity=0 THEN 'OUT_OF_STOCK' WHEN mb.expiration_date<CURDATE() THEN 'EXPIRED' WHEN mb.expiration_date<=DATE_ADD(CURDATE(),INTERVAL 60 DAY) THEN 'NEAR_EXPIRATION' ELSE 'AVAILABLE' END stock_status
    FROM medicine_batches mb JOIN medicines m ON m.id=mb.medicine_id LEFT JOIN medicine_categories mc ON mc.id=m.category_id
    WHERE ${clauses.join(' AND ')} ORDER BY m.generic_name,mb.expiration_date`,params);
  return ok(res,rows);
}));

router.get('/adjustments', authorize('inventory.adjust.request','inventory.adjust.approve'), asyncHandler(async(req,res)=>{
  const {page,limit,offset}=paginationFromQuery(req.query);const clauses=['1=1'];const params=[];
  if(req.query.status){clauses.push('iar.status=?');params.push(req.query.status);}
  if(req.query.type){clauses.push('iar.adjustment_type=?');params.push(req.query.type);}
  const where=clauses.join(' AND ');
  const [counts]=await pool.execute(`SELECT COUNT(*) total FROM inventory_adjustment_requests iar WHERE ${where}`,params);
  const [rows]=await pool.execute(`SELECT iar.*,m.generic_name,m.brand_name,m.unit,mb.batch_number,mb.expiration_date,
    ru.username requested_by_username,au.username approved_by_username,sci.session_id,scs.count_number
    FROM inventory_adjustment_requests iar JOIN medicines m ON m.id=iar.medicine_id JOIN medicine_batches mb ON mb.id=iar.batch_id
    JOIN users ru ON ru.id=iar.requested_by LEFT JOIN users au ON au.id=iar.approved_by
    LEFT JOIN stock_count_items sci ON sci.id=iar.stock_count_item_id LEFT JOIN stock_count_sessions scs ON scs.id=sci.session_id
    WHERE ${where} ORDER BY iar.requested_at DESC LIMIT ? OFFSET ?`,[...params,limit,offset]);
  return ok(res,rows,'Inventory adjustments loaded.',paginationMeta(counts[0].total,page,limit));
}));

const adjustmentSchema=z.object({body:z.object({batchId:z.string().uuid(),adjustmentType:z.enum(['DAMAGED','LOST','EXPIRED','CORRECTION','RECONCILIATION']),quantityChange:z.coerce.number().int().refine(v=>v!==0,'Quantity change cannot be zero.'),reason:z.string().trim().min(5).max(1000),supportingNotes:z.string().max(3000).optional().nullable()}),params:z.object({}),query:z.object({})});

router.post('/adjustments', authorize('inventory.adjust.request'), requireCsrf, validate(adjustmentSchema), asyncHandler(async(req,res)=>{
  const d=req.validated.body;const id=uuid(),number=reference('ADJ');
  await withTransaction(async(connection)=>{
    const [batches]=await connection.execute('SELECT mb.*,m.generic_name FROM medicine_batches mb JOIN medicines m ON m.id=mb.medicine_id WHERE mb.id=? FOR UPDATE',[d.batchId]);
    if(!batches.length)throw new AppError(404,'Medicine batch not found.');
    let change=d.quantityChange;
    if(['DAMAGED','LOST','EXPIRED'].includes(d.adjustmentType))change=-Math.abs(change);
    if(Number(batches[0].quantity)+change<0)throw new AppError(409,'The adjustment would produce negative stock.');
    await connection.execute(`INSERT INTO inventory_adjustment_requests (id,adjustment_number,medicine_id,batch_id,adjustment_type,quantity_change,reason,supporting_notes,status,before_quantity,requested_by) VALUES (?,?,?,?,?,?,?,?, 'PENDING',?,?)`,[id,number,batches[0].medicine_id,d.batchId,d.adjustmentType,change,d.reason,d.supportingNotes||null,batches[0].quantity,req.user.id]);
    await writeAudit({actorUserId:req.user.id,action:'REQUEST_STOCK_ADJUSTMENT',entityType:'inventory_adjustment_requests',entityId:id,description:`Requested ${number} for ${batches[0].generic_name}, batch ${batches[0].batch_number}.`,ipAddress:req.ip,metadata:{quantityChange:change,type:d.adjustmentType},request:req,connection});
  });
  return created(res,{id,adjustmentNumber:number},'Stock adjustment submitted for approval.');
}));

router.post('/adjustments/:id/approve', authorize('inventory.adjust.approve'), requireCsrf, validate(z.object({body:z.object({reviewNotes:z.string().max(2000).optional().nullable()}),params:z.object({id:z.string().uuid()}),query:z.object({})})), asyncHandler(async(req,res)=>{
  let outcome;
  await withTransaction(async(connection)=>{
    const [requests]=await connection.execute('SELECT * FROM inventory_adjustment_requests WHERE id=? FOR UPDATE',[req.params.id]);if(!requests.length)throw new AppError(404,'Adjustment request not found.');const a=requests[0];
    if(a.status!=='PENDING')throw new AppError(409,'This adjustment request has already been processed.');
    if(a.requested_by===req.user.id&&req.user.role_code!=='SUPER_ADMIN')throw new AppError(409,'The requester cannot approve their own stock adjustment.');
    const [batches]=await connection.execute('SELECT * FROM medicine_batches WHERE id=? FOR UPDATE',[a.batch_id]);if(!batches.length)throw new AppError(404,'Medicine batch not found.');
    const before=Number(batches[0].quantity);
    if(a.adjustment_type==='RECONCILIATION'&&before!==Number(a.before_quantity))throw new AppError(409,'Stock changed after the physical count was submitted. Reject this adjustment and perform a new count before reconciliation.');
    const after=before+Number(a.quantity_change);if(after<0)throw new AppError(409,'Current stock is lower than the requested deduction. Review the request before approval.');
    await connection.execute('UPDATE medicine_batches SET quantity=?,updated_at=NOW() WHERE id=?',[after,a.batch_id]);
    const txType={DAMAGED:'DAMAGE',LOST:'LOSS',EXPIRED:'EXPIRY_WRITE_OFF',CORRECTION:'CORRECTION',RECONCILIATION:'RECONCILIATION'}[a.adjustment_type]||'ADJUSTMENT';
    await connection.execute(`INSERT INTO inventory_transactions (id,medicine_id,batch_id,transaction_type,quantity_change,balance_after,reference_type,reference_id,created_by,notes) VALUES (?,?,?,?,? ,?,'ADJUSTMENT_REQUEST',?,?,?)`,[uuid(),a.medicine_id,a.batch_id,txType,a.quantity_change,after,a.id,req.user.id,`${a.reason}${a.supporting_notes?` — ${a.supporting_notes}`:''}`]);
    await connection.execute("UPDATE inventory_adjustment_requests SET status='APPLIED',before_quantity=?,after_quantity=?,approved_by=?,reviewed_at=NOW(),applied_at=NOW(),review_notes=?,updated_at=NOW() WHERE id=?",[before,after,req.user.id,req.validated.body.reviewNotes||null,a.id]);
    if(a.stock_count_item_id){
      const [sessionRows]=await connection.execute('SELECT session_id FROM stock_count_items WHERE id=?',[a.stock_count_item_id]);
      if(sessionRows.length){const sessionId=sessionRows[0].session_id;const [[pending]]=await connection.execute("SELECT COUNT(*) total FROM stock_count_items sci JOIN inventory_adjustment_requests iar ON iar.id=sci.adjustment_request_id WHERE sci.session_id=? AND iar.status='PENDING'",[sessionId]);if(Number(pending.total)===0)await connection.execute("UPDATE stock_count_sessions SET status='RECONCILED',reconciled_by=?,reconciled_at=NOW(),updated_at=NOW() WHERE id=?",[req.user.id,sessionId]);}
    }
    await writeAudit({actorUserId:req.user.id,action:'APPROVE_STOCK_ADJUSTMENT',entityType:'inventory_adjustment_requests',entityId:a.id,description:`Approved stock adjustment ${a.adjustment_number}: ${before} to ${after}.`,ipAddress:req.ip,metadata:{before,after,quantityChange:a.quantity_change},request:req,connection});
    outcome={before,after};
  });
  return ok(res,outcome,'Stock adjustment approved and applied.');
}));

router.post('/adjustments/:id/reject', authorize('inventory.adjust.approve'), requireCsrf, validate(z.object({body:z.object({reviewNotes:z.string().trim().min(3).max(2000)}),params:z.object({id:z.string().uuid()}),query:z.object({})})), asyncHandler(async(req,res)=>{
  const [result]=await pool.execute("UPDATE inventory_adjustment_requests SET status='REJECTED',approved_by=?,reviewed_at=NOW(),review_notes=?,updated_at=NOW() WHERE id=? AND status='PENDING'",[req.user.id,req.validated.body.reviewNotes,req.params.id]);if(!result.affectedRows)throw new AppError(409,'The adjustment request was not found or has already been processed.');
  await writeAudit({actorUserId:req.user.id,action:'REJECT_STOCK_ADJUSTMENT',entityType:'inventory_adjustment_requests',entityId:req.params.id,description:'Rejected a stock adjustment request.',ipAddress:req.ip,metadata:{reviewNotes:req.validated.body.reviewNotes},request:req});
  return ok(res,null,'Stock adjustment rejected.');
}));

router.get('/stock-counts', authorize('inventory.count'), asyncHandler(async(_req,res)=>{
  const [rows]=await pool.query(`SELECT scs.*,u1.username opened_by_username,u2.username submitted_by_username,u3.username reconciled_by_username,
    COUNT(sci.id) item_count,SUM(CASE WHEN sci.variance<>0 THEN 1 ELSE 0 END) variance_count
    FROM stock_count_sessions scs JOIN users u1 ON u1.id=scs.opened_by LEFT JOIN users u2 ON u2.id=scs.submitted_by LEFT JOIN users u3 ON u3.id=scs.reconciled_by LEFT JOIN stock_count_items sci ON sci.session_id=scs.id
    GROUP BY scs.id ORDER BY scs.opened_at DESC`);return ok(res,rows);
}));

router.post('/stock-counts', authorize('inventory.count'), requireCsrf, validate(z.object({body:z.object({title:z.string().trim().min(3).max(200),storageLocation:z.string().max(180).optional().nullable(),notes:z.string().max(3000).optional().nullable()}),params:z.object({}),query:z.object({})})), asyncHandler(async(req,res)=>{
  const d=req.validated.body;const id=uuid(),number=reference('CNT');let count=0;
  await withTransaction(async(connection)=>{
    await connection.execute("INSERT INTO stock_count_sessions (id,count_number,title,storage_location,status,opened_by,notes) VALUES (?,?,?,?, 'OPEN',?,?)",[id,number,d.title,d.storageLocation||null,req.user.id,d.notes||null]);
    const params=[];let where='m.is_active=1';if(d.storageLocation){where+=' AND m.storage_location=?';params.push(d.storageLocation);}
    const [batches]=await connection.execute(`SELECT mb.id batch_id,mb.medicine_id,mb.quantity FROM medicine_batches mb JOIN medicines m ON m.id=mb.medicine_id WHERE ${where} ORDER BY m.generic_name,mb.expiration_date FOR UPDATE`,params);count=batches.length;
    for(const b of batches)await connection.execute('INSERT INTO stock_count_items (id,session_id,medicine_id,batch_id,expected_quantity) VALUES (?,?,?,?,?)',[uuid(),id,b.medicine_id,b.batch_id,b.quantity]);
    await writeAudit({actorUserId:req.user.id,action:'OPEN_STOCK_COUNT',entityType:'stock_count_sessions',entityId:id,description:`Opened stock count ${number} with ${count} batches.`,ipAddress:req.ip,request:req,connection});
  });return created(res,{id,countNumber:number,itemCount:count},'Physical stock-count session opened.');
}));

router.get('/stock-counts/:id', authorize('inventory.count'), asyncHandler(async(req,res)=>{
  const [sessions]=await pool.execute('SELECT * FROM stock_count_sessions WHERE id=?',[req.params.id]);if(!sessions.length)throw new AppError(404,'Stock-count session not found.');
  const [items]=await pool.execute(`SELECT sci.*,m.generic_name,m.brand_name,m.unit,mb.batch_number,mb.expiration_date,iar.adjustment_number,iar.status adjustment_status
    FROM stock_count_items sci JOIN medicines m ON m.id=sci.medicine_id JOIN medicine_batches mb ON mb.id=sci.batch_id LEFT JOIN inventory_adjustment_requests iar ON iar.id=sci.adjustment_request_id WHERE sci.session_id=? ORDER BY m.generic_name,mb.expiration_date`,[req.params.id]);return ok(res,{session:sessions[0],items});
}));

router.patch('/stock-counts/:sessionId/items/:itemId', authorize('inventory.count'), requireCsrf, validate(z.object({body:z.object({countedQuantity:z.coerce.number().int().min(0),notes:z.string().max(1000).optional().nullable()}),params:z.object({sessionId:z.string().uuid(),itemId:z.string().uuid()}),query:z.object({})})), asyncHandler(async(req,res)=>{
  const [result]=await pool.execute(`UPDATE stock_count_items sci JOIN stock_count_sessions scs ON scs.id=sci.session_id SET sci.counted_quantity=?,sci.variance=?-sci.expected_quantity,sci.notes=?,sci.counted_at=NOW() WHERE sci.id=? AND sci.session_id=? AND scs.status='OPEN'`,[req.validated.body.countedQuantity,req.validated.body.countedQuantity,req.validated.body.notes||null,req.params.itemId,req.params.sessionId]);if(!result.affectedRows)throw new AppError(409,'The count item was not found or the session is no longer open.');return ok(res,null,'Counted quantity saved.');
}));

router.post('/stock-counts/:id/submit', authorize('inventory.count'), requireCsrf, asyncHandler(async(req,res)=>{
  let adjustmentCount=0;
  await withTransaction(async(connection)=>{
    const [sessions]=await connection.execute('SELECT * FROM stock_count_sessions WHERE id=? FOR UPDATE',[req.params.id]);if(!sessions.length)throw new AppError(404,'Stock-count session not found.');if(sessions[0].status!=='OPEN')throw new AppError(409,'This stock-count session is not open.');
    const [items]=await connection.execute(`SELECT sci.*,mb.quantity current_quantity FROM stock_count_items sci JOIN medicine_batches mb ON mb.id=sci.batch_id WHERE sci.session_id=? ORDER BY sci.id FOR UPDATE`,[req.params.id]);
    const missing=items.filter(item=>item.counted_quantity===null||item.counted_quantity===undefined);if(missing.length)throw new AppError(409,`${missing.length} batch(es) still need a counted quantity.`);
    for(const item of items){
      const currentQuantity=Number(item.current_quantity),countedQuantity=Number(item.counted_quantity),variance=countedQuantity-currentQuantity;
      await connection.execute('UPDATE stock_count_items SET expected_quantity=?,variance=? WHERE id=?',[currentQuantity,variance,item.id]);
      if(variance===0)continue;
      const adjustmentId=uuid(),number=reference('ADJ');
      await connection.execute(`INSERT INTO inventory_adjustment_requests (id,adjustment_number,medicine_id,batch_id,adjustment_type,quantity_change,reason,supporting_notes,status,before_quantity,requested_by,stock_count_item_id) VALUES (?,?,?,?, 'RECONCILIATION',?,'Physical stock-count variance',?, 'PENDING',?,?,?)`,[adjustmentId,number,item.medicine_id,item.batch_id,variance,item.notes||null,currentQuantity,req.user.id,item.id]);
      await connection.execute('UPDATE stock_count_items SET adjustment_request_id=? WHERE id=?',[adjustmentId,item.id]);adjustmentCount++;
    }
    await connection.execute("UPDATE stock_count_sessions SET status='SUBMITTED',submitted_by=?,submitted_at=NOW(),updated_at=NOW() WHERE id=?",[req.user.id,req.params.id]);
    if(adjustmentCount===0)await connection.execute("UPDATE stock_count_sessions SET status='RECONCILED',reconciled_by=?,reconciled_at=NOW() WHERE id=?",[req.user.id,req.params.id]);
    await writeAudit({actorUserId:req.user.id,action:'SUBMIT_STOCK_COUNT',entityType:'stock_count_sessions',entityId:req.params.id,description:`Submitted physical stock count with ${adjustmentCount} variance adjustment(s).`,ipAddress:req.ip,request:req,connection});
  });return ok(res,{adjustmentCount},adjustmentCount?'Stock count submitted. Variances require approval.':'Stock count completed with no variance.');
}));

export default router;
