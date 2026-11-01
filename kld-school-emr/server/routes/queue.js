import express from 'express';
import { z } from 'zod';
import { pool, withTransaction } from '../config/db.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { requireCsrf } from '../middleware/csrf.js';
import { validate } from '../middleware/validate.js';
import { AppError, asyncHandler, created, ok } from '../utils/http.js';
import { reference, uuid } from '../utils/ids.js';
import { writeAudit } from '../utils/audit.js';
import { getPatientById } from '../services/patients/patientService.js';

const router = express.Router();

async function databaseToday(connection = pool) {
  const [[row]] = await connection.query("SELECT DATE_FORMAT(CURDATE(), '%Y-%m-%d') AS today");
  return row.today;
}

async function databaseNow(connection = pool) {
  const [[row]] = await connection.query("SELECT DATE_FORMAT(CURDATE(), '%Y-%m-%d') AS today, DATE_FORMAT(CURTIME(), '%H:%i:%s') AS current_time");
  return row;
}

router.get('/public', asyncHandler(async (req, res) => {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(String(req.query.date || '')) ? String(req.query.date) : await databaseToday();
  const [rows] = await pool.execute(
    `SELECT queue_number,status,priority,called_at,consultation_started_at,completed_at
     FROM clinic_queue_entries WHERE queue_date=? AND status<>'CANCELLED'
     ORDER BY FIELD(priority,'EMERGENCY','URGENT','MODERATE','NORMAL'),checked_in_at`, [date]
  );
  return ok(res, { date, queue: rows });
}));

router.use(authenticate, authorize('queue.manage', 'appointments.read'));

router.get('/', asyncHandler(async (req, res) => {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(String(req.query.date || '')) ? String(req.query.date) : await databaseToday();
  const params = [date]; let statusClause = '';
  if (req.query.status) { statusClause = ' AND q.status=?'; params.push(req.query.status); }
  const [rows] = await pool.execute(
    `SELECT q.*,v.visit_number,v.complaint,a.appointment_number,aps.name service_name,p.patient_type,p.record_number,
      COALESCE(s.student_number,e.employee_number) patient_number,
      CONCAT_WS(' ',COALESCE(s.first_name,e.first_name),COALESCE(s.middle_name,e.middle_name),COALESCE(s.last_name,e.last_name)) patient_name
     FROM clinic_queue_entries q JOIN visits v ON v.id=q.visit_id JOIN patients p ON p.id=q.patient_id
     LEFT JOIN appointments a ON a.id=q.appointment_id LEFT JOIN appointment_services aps ON aps.id=a.service_id
     LEFT JOIN students s ON s.id=p.student_id LEFT JOIN employees e ON e.id=p.employee_id
     WHERE q.queue_date=?${statusClause}
     ORDER BY CASE q.status WHEN 'IN_CONSULTATION' THEN 0 WHEN 'CALLED' THEN 1 WHEN 'WAITING' THEN 2 ELSE 3 END,
       FIELD(q.priority,'EMERGENCY','URGENT','MODERATE','NORMAL'),q.checked_in_at`, params
  );
  return ok(res, { date, queue: rows });
}));

const walkInSchema = z.object({ body: z.object({
  patientId: z.string().uuid(),
  visitType: z.enum(['WALK_IN','FOLLOW_UP','EMERGENCY','REFERRAL','MEDICAL_CLEARANCE','OTHER']).default('WALK_IN'),
  reason: z.string().trim().min(2).max(500),
  complaint: z.string().trim().min(2).max(1000),
  priority: z.enum(['NORMAL','MODERATE','URGENT','EMERGENCY']).default('NORMAL'),
  accompaniedBy: z.string().max(200).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
  idempotencyKey: z.string().max(100).optional().nullable()
}), params:z.object({}), query:z.object({}) });

router.post('/walk-in', authorize('queue.manage'), requireCsrf, validate(walkInSchema), asyncHandler(async (req, res) => {
  if (!req.user.staff_id) throw new AppError(403, 'A clinic staff profile is required.');
  const d = req.validated.body; let result;
  await withTransaction(async (connection) => {
    const patient = await getPatientById(connection, d.patientId, { forUpdate: true });
    if (patient.archived_at) throw new AppError(409, 'This patient record is archived and cannot be added to the queue.');
    if (patient.patient_status !== 'ACTIVE') throw new AppError(409, 'This patient record is inactive.');
    const { today, current_time: time } = await databaseNow(connection);
    if (d.idempotencyKey) {
      const [existing] = await connection.execute(
        `SELECT q.id queue_id,q.queue_number,q.status queue_status,v.id visit_id,v.visit_number
         FROM clinic_queue_entries q JOIN visits v ON v.id=q.visit_id
         WHERE q.idempotency_key=? FOR UPDATE`, [d.idempotencyKey]
      );
      if (existing.length) { result = existing[0]; return; }
    }
    const visitId=uuid(),visitNumber=reference('VIS');
    await connection.execute(
      `INSERT INTO visits (id,visit_number,patient_id,student_id,visit_date,visit_time,visit_type,reason,complaint,accompanied_by,priority,notes,status,registered_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?, 'REGISTERED',?)`,
      [visitId,visitNumber,patient.patient_id,patient.student_id,today,time,d.visitType,d.reason,d.complaint,d.accompaniedBy||null,d.priority,d.notes||null,req.user.staff_id]
    );
    await connection.execute('INSERT INTO queue_daily_counters (queue_date,last_number) VALUES (?,1) ON DUPLICATE KEY UPDATE last_number=last_number+1',[today]);
    const [[counter]]=await connection.execute('SELECT last_number FROM queue_daily_counters WHERE queue_date=? FOR UPDATE',[today]);
    const queueId=uuid();
    await connection.execute(
      `INSERT INTO clinic_queue_entries (id,queue_date,queue_number,patient_id,visit_id,priority,status,checked_in_by,checked_in_at,idempotency_key,notes)
       VALUES (?,?,?,?,?,?,'WAITING',?,NOW(),?,?)`,
      [queueId,today,counter.last_number,patient.patient_id,visitId,d.priority,req.user.id,d.idempotencyKey||null,d.notes||null]
    );
    await writeAudit({actorUserId:req.user.id,action:'QUEUE_WALK_IN',entityType:'clinic_queue_entries',entityId:queueId,description:`Registered walk-in ${visitNumber} as queue ${counter.last_number}.`,ipAddress:req.ip,metadata:{idempotencyKey:d.idempotencyKey||null,patientRecord:patient.record_number},request:req,connection});
    result={queueId,queueNumber:counter.last_number,queueStatus:'WAITING',visitId,visitNumber};
  });
  return created(res,result,'Walk-in patient registered and added to the queue.');
}));

router.patch('/:id/status', authorize('queue.manage'), requireCsrf, validate(z.object({body:z.object({status:z.enum(['WAITING','CALLED','IN_CONSULTATION','COMPLETED','CANCELLED']),notes:z.string().max(1000).optional().nullable()}),params:z.object({id:z.string().uuid()}),query:z.object({})})), asyncHandler(async(req,res)=>{
  const d=req.validated.body;
  await withTransaction(async(connection)=>{
    const [rows]=await connection.execute('SELECT * FROM clinic_queue_entries WHERE id=? FOR UPDATE',[req.params.id]);
    if(!rows.length)throw new AppError(404,'Queue entry not found.');
    const q=rows[0];
    const allowed={WAITING:['CALLED','CANCELLED'],CALLED:['WAITING','IN_CONSULTATION','CANCELLED'],IN_CONSULTATION:['COMPLETED','CANCELLED'],COMPLETED:[],CANCELLED:[]};
    if(q.status!==d.status && !allowed[q.status]?.includes(d.status))throw new AppError(409,`Queue entry cannot move from ${q.status} to ${d.status}.`);
    const timestamp={CALLED:'called_at',IN_CONSULTATION:'consultation_started_at',COMPLETED:'completed_at',CANCELLED:'cancelled_at'}[d.status];
    await connection.execute(`UPDATE clinic_queue_entries SET status=?,${timestamp?`${timestamp}=NOW(),`:''}called_by=CASE WHEN ?='CALLED' THEN ? ELSE called_by END,notes=COALESCE(?,notes),updated_at=NOW() WHERE id=?`,[d.status,d.status,req.user.id,d.notes||null,q.id]);
    if(d.status==='IN_CONSULTATION'){
      await connection.execute("UPDATE visits SET status='IN_PROGRESS',updated_at=NOW() WHERE id=?",[q.visit_id]);
      if(q.appointment_id)await connection.execute("UPDATE appointments SET status='IN_CONSULTATION',updated_at=NOW() WHERE id=?",[q.appointment_id]);
    }
    if(d.status==='COMPLETED'){
      const [consultations]=await connection.execute('SELECT status FROM consultations WHERE visit_id=?',[q.visit_id]);
      if(!consultations.length || ['COMPLETED','RELEASED'].includes(consultations[0].status))await connection.execute("UPDATE visits SET status='COMPLETED',updated_at=NOW() WHERE id=?",[q.visit_id]);
      if(q.appointment_id)await connection.execute("UPDATE appointments SET status='COMPLETED',completed_at=NOW(),updated_at=NOW() WHERE id=?",[q.appointment_id]);
    }
    if(d.status==='CANCELLED' && q.appointment_id)await connection.execute("UPDATE appointments SET status='CANCELLED',cancelled_at=NOW(),cancellation_reason=COALESCE(?,cancellation_reason),updated_at=NOW() WHERE id=?",[d.notes||'Queue entry cancelled',q.appointment_id]);
    await writeAudit({actorUserId:req.user.id,action:`QUEUE_${d.status}`,entityType:'clinic_queue_entries',entityId:q.id,description:`Changed queue ${q.queue_number} to ${d.status}.`,ipAddress:req.ip,metadata:{from:q.status,to:d.status},request:req,connection});
  });
  return ok(res,{id:req.params.id,status:d.status},'Queue status updated.');
}));

router.patch('/:id/priority', authorize('queue.manage'), requireCsrf, validate(z.object({body:z.object({priority:z.enum(['NORMAL','MODERATE','URGENT','EMERGENCY']),reason:z.string().trim().min(3).max(1000)}),params:z.object({id:z.string().uuid()}),query:z.object({})})), asyncHandler(async(req,res)=>{
  const [result]=await pool.execute('UPDATE clinic_queue_entries SET priority=?,notes=CONCAT_WS("\n",notes,?),updated_at=NOW() WHERE id=?',[req.validated.body.priority,`Priority changed: ${req.validated.body.reason}`,req.params.id]);
  if(!result.affectedRows)throw new AppError(404,'Queue entry not found.');
  await writeAudit({actorUserId:req.user.id,action:'QUEUE_PRIORITY_CHANGE',entityType:'clinic_queue_entries',entityId:req.params.id,description:`Changed queue priority to ${req.validated.body.priority}.`,ipAddress:req.ip,metadata:{reason:req.validated.body.reason},request:req});
  return ok(res,null,'Queue priority updated.');
}));

export default router;
