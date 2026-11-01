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
import { enqueueEmail } from '../services/emailService.js';
import { env } from '../config/env.js';

const router = express.Router();
router.use(authenticate, authorize('followups.manage', 'consultations.read'));

async function notifyFollowUp(followUpId, title, message) {
  const [rows] = await pool.execute(
    `SELECT f.*,p.student_id,sa.user_id,COALESCE(s.registered_email,e.email) email,COALESCE(s.first_name,e.first_name) first_name
     FROM follow_ups f JOIN patients p ON p.id=f.patient_id LEFT JOIN students s ON s.id=p.student_id LEFT JOIN employees e ON e.id=p.employee_id
     LEFT JOIN student_accounts sa ON sa.student_id=p.student_id WHERE f.id=?`, [followUpId]
  );
  if (!rows.length) return;
  const row=rows[0];
  if(row.user_id) await pool.execute(`INSERT INTO notifications (id,user_id,patient_id,notification_type,severity,title,message,link) VALUES (?,?,?,'FOLLOW_UP','INFO',?,?,?)`,[uuid(),row.user_id,row.patient_id,title,message,'/student/appointments']);
  if(row.email) await enqueueEmail({recipient:row.email,subject:title,template:'FOLLOW_UP',payload:{title,message:`<p>${message}</p>`,actionUrl:`${env.APP_URL}/student/appointments`,actionLabel:'View clinic schedule'},relatedType:'follow_ups',relatedId:followUpId});
}

router.get('/', asyncHandler(async(req,res)=>{
  const {page,limit,offset}=paginationFromQuery(req.query);const clauses=['1=1'];const params=[];
  if(req.query.status){clauses.push('f.status=?');params.push(req.query.status);}
  if(req.query.patientId){clauses.push('f.patient_id=?');params.push(req.query.patientId);}
  if(req.query.dateFrom){clauses.push('f.target_date>=?');params.push(req.query.dateFrom);}
  if(req.query.dateTo){clauses.push('f.target_date<=?');params.push(req.query.dateTo);}
  const where=clauses.join(' AND ');
  const [counts]=await pool.execute(`SELECT COUNT(*) total FROM follow_ups f WHERE ${where}`,params);
  const [rows]=await pool.execute(
    `SELECT f.*,c.consultation_number,a.appointment_number,a.status appointment_status,
      p.patient_type,p.record_number,CONCAT_WS(' ',COALESCE(s.first_name,e.first_name),COALESCE(s.middle_name,e.middle_name),COALESCE(s.last_name,e.last_name)) patient_name,
      CONCAT_WS(' ',ast.first_name,ast.last_name) assigned_staff_name,CONCAT_WS(' ',dst.first_name,dst.last_name) assigned_doctor_name
     FROM follow_ups f JOIN consultations c ON c.id=f.consultation_id JOIN patients p ON p.id=f.patient_id
     LEFT JOIN students s ON s.id=p.student_id LEFT JOIN employees e ON e.id=p.employee_id LEFT JOIN appointments a ON a.id=f.appointment_id
     LEFT JOIN staff ast ON ast.id=f.assigned_staff_id LEFT JOIN staff dst ON dst.id=f.assigned_doctor_staff_id
     WHERE ${where} ORDER BY f.target_date ASC,f.created_at DESC LIMIT ? OFFSET ?`,[...params,limit,offset]
  );
  return ok(res,rows,'Follow-ups loaded.',paginationMeta(counts[0].total,page,limit));
}));

router.post('/', authorize('followups.manage'), requireCsrf, validate(z.object({body:z.object({consultationId:z.string().uuid(),reason:z.string().trim().min(3).max(2000),targetDate:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),assignedStaffId:z.string().uuid().optional().nullable(),assignedDoctorStaffId:z.string().uuid().optional().nullable(),notes:z.string().max(3000).optional().nullable()}),params:z.object({}),query:z.object({})})), asyncHandler(async(req,res)=>{
  const d=req.validated.body;const id=uuid(),number=reference('FUP');
  await withTransaction(async(connection)=>{
    const [consultations]=await connection.execute('SELECT id,patient_id,consultation_number FROM consultations WHERE id=? FOR UPDATE',[d.consultationId]);
    if(!consultations.length)throw new AppError(404,'Consultation not found.');
    const [duplicate]=await connection.execute("SELECT id,follow_up_number FROM follow_ups WHERE consultation_id=? AND status IN ('PENDING','SCHEDULED') FOR UPDATE",[d.consultationId]);
    if(duplicate.length)throw new AppError(409,`An active follow-up already exists (${duplicate[0].follow_up_number}).`);
    await connection.execute(`INSERT INTO follow_ups (id,follow_up_number,consultation_id,patient_id,reason,target_date,assigned_staff_id,assigned_doctor_staff_id,notes,status,created_by_user_id) VALUES (?,?,?,?,?,?,?,?,?,'PENDING',?)`,[id,number,d.consultationId,consultations[0].patient_id,d.reason,d.targetDate,d.assignedStaffId||null,d.assignedDoctorStaffId||null,d.notes||null,req.user.id]);
    const reminderAt=`${d.targetDate} 08:00:00`;
    await connection.execute("INSERT IGNORE INTO follow_up_reminders (id,follow_up_id,reminder_type,channel,status,scheduled_for) VALUES (?,?,'ONE_DAY','IN_APP','PENDING',DATE_SUB(?,INTERVAL 1 DAY)),(?,?,'ONE_DAY','EMAIL','PENDING',DATE_SUB(?,INTERVAL 1 DAY))",[uuid(),id,reminderAt,uuid(),id,reminderAt]);
    await writeAudit({actorUserId:req.user.id,action:'CREATE_FOLLOW_UP',entityType:'follow_ups',entityId:id,description:`Scheduled follow-up ${number} from ${consultations[0].consultation_number}.`,ipAddress:req.ip,request:req,connection});
  });
  await notifyFollowUp(id,'KLD Clinic follow-up scheduled',`A clinic follow-up is requested for ${d.targetDate}.`);
  return created(res,{id,followUpNumber:number},'Follow-up created.');
}));

router.patch('/:id', authorize('followups.manage'), requireCsrf, validate(z.object({body:z.object({reason:z.string().min(3).max(2000).optional(),targetDate:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),assignedStaffId:z.string().uuid().optional().nullable(),assignedDoctorStaffId:z.string().uuid().optional().nullable(),notes:z.string().max(3000).optional().nullable(),status:z.enum(['PENDING','SCHEDULED','COMPLETED','MISSED','CANCELLED']).optional()}),params:z.object({id:z.string().uuid()}),query:z.object({})})), asyncHandler(async(req,res)=>{
  const d=req.validated.body;const map={reason:'reason',targetDate:'target_date',assignedStaffId:'assigned_staff_id',assignedDoctorStaffId:'assigned_doctor_staff_id',notes:'notes',status:'status'};const sets=[];const params=[];
  for(const [key,column] of Object.entries(map))if(Object.hasOwn(d,key)){sets.push(`${column}=?`);params.push(d[key]||null);}
  if(d.status==='COMPLETED')sets.push('completed_at=NOW()');if(d.status==='CANCELLED')sets.push('cancelled_at=NOW()');
  if(!sets.length)return ok(res,{id:req.params.id},'No changes submitted.');params.push(req.params.id);
  const [result]=await pool.execute(`UPDATE follow_ups SET ${sets.join(',')},updated_at=NOW() WHERE id=?`,params);if(!result.affectedRows)throw new AppError(404,'Follow-up not found.');
  await writeAudit({actorUserId:req.user.id,action:'UPDATE_FOLLOW_UP',entityType:'follow_ups',entityId:req.params.id,description:'Updated a clinical follow-up.',ipAddress:req.ip,metadata:{fields:Object.keys(d)},request:req});
  return ok(res,{id:req.params.id},'Follow-up updated.');
}));

router.post('/:id/link-appointment', authorize('followups.manage'), requireCsrf, validate(z.object({body:z.object({appointmentId:z.string().uuid()}),params:z.object({id:z.string().uuid()}),query:z.object({})})), asyncHandler(async(req,res)=>{
  await withTransaction(async(connection)=>{
    const [f]=await connection.execute('SELECT * FROM follow_ups WHERE id=? FOR UPDATE',[req.params.id]);if(!f.length)throw new AppError(404,'Follow-up not found.');if(f[0].appointment_id)throw new AppError(409,'This follow-up is already linked to an appointment.');
    const [a]=await connection.execute('SELECT * FROM appointments WHERE id=? AND patient_id=? FOR UPDATE',[req.validated.body.appointmentId,f[0].patient_id]);if(!a.length)throw new AppError(404,'A matching appointment was not found.');
    await connection.execute("UPDATE follow_ups SET appointment_id=?,status='SCHEDULED',updated_at=NOW() WHERE id=?",[a[0].id,f[0].id]);
    await writeAudit({actorUserId:req.user.id,action:'LINK_FOLLOW_UP_APPOINTMENT',entityType:'follow_ups',entityId:f[0].id,description:`Linked follow-up to appointment ${a[0].appointment_number}.`,ipAddress:req.ip,request:req,connection});
  });
  return ok(res,null,'Follow-up linked to the appointment.');
}));

export default router;
