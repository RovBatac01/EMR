import express from 'express';
import { z } from 'zod';
import { pool, withTransaction } from '../config/db.js';
import { env } from '../config/env.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { requireCsrf } from '../middleware/csrf.js';
import { validate } from '../middleware/validate.js';
import { AppError, asyncHandler, created, ok } from '../utils/http.js';
import { paginationFromQuery, paginationMeta } from '../utils/pagination.js';
import { reference, uuid } from '../utils/ids.js';
import { writeAudit, auditRecordAccess } from '../utils/audit.js';
import { enqueueEmail } from '../services/emailService.js';

const router=express.Router();
router.use(authenticate);

const nullableNumber=z.preprocess((value)=>value===''||value===null||value===undefined?null:Number(value),z.number().finite().nullable().optional());
const consultationBody=z.object({
  visitId:z.string().uuid(),
  idempotencyKey:z.string().trim().min(8).max(120).optional(),
  chiefComplaint:z.string().trim().min(2).max(2000),
  symptoms:z.string().max(5000).optional().nullable(),
  diagnosis:z.string().max(2000).optional().nullable(),
  findings:z.string().max(5000).optional().nullable(),
  severity:z.enum(['MILD','MODERATE','SEVERE','CRITICAL']).default('MILD'),
  treatmentProvided:z.string().max(5000).optional().nullable(),
  dosage:z.string().max(500).optional().nullable(),
  frequency:z.string().max(500).optional().nullable(),
  duration:z.string().max(500).optional().nullable(),
  recommendations:z.array(z.string().max(100)).default([]),
  notes:z.string().max(10000).optional().nullable(),
  status:z.enum(['DRAFT','IN_PROGRESS']).default('DRAFT'),
  vitalSigns:z.object({temperature:nullableNumber,systolic:nullableNumber,diastolic:nullableNumber,heartRate:nullableNumber,respiratoryRate:nullableNumber,oxygenSaturation:nullableNumber,weight:nullableNumber,height:nullableNumber}).optional(),
  physicalAssessment:z.object({generalAppearance:z.string().max(2000).optional().nullable(),heent:z.string().max(2000).optional().nullable(),respiratory:z.string().max(2000).optional().nullable(),cardiovascular:z.string().max(2000).optional().nullable(),abdomen:z.string().max(2000).optional().nullable(),musculoskeletal:z.string().max(2000).optional().nullable(),skin:z.string().max(2000).optional().nullable(),neurological:z.string().max(2000).optional().nullable()}).optional()
});

function parseRecommendations(value){if(Array.isArray(value))return value;if(typeof value==='string')try{const parsed=JSON.parse(value);return Array.isArray(parsed)?parsed:[];}catch{return [];}return[];}
function canSign(req){return req.user.role_code==='DOCTOR'&&Boolean(req.user.doctor_profile_id)&&Number(req.user.doctor_profile_active)===1&&(!req.user.license_expiration_date||String(req.user.license_expiration_date).slice(0,10)>=new Date().toISOString().slice(0,10));}

const consultationSelect=`
  SELECT c.*,v.visit_number,v.visit_date,v.visit_time,v.visit_type,v.priority,v.reason visit_reason,v.complaint visit_complaint,
    p.patient_type,p.record_number,p.student_id,p.employee_id,
    COALESCE(s.student_number,e.employee_number) patient_number,
    CONCAT_WS(' ',COALESCE(s.first_name,e.first_name),COALESCE(s.middle_name,e.middle_name),COALESCE(s.last_name,e.last_name)) patient_name,
    CONCAT_WS(' ',pst.first_name,pst.middle_name,pst.last_name) prepared_by_name,
    CONCAT_WS(' ',dst.first_name,dst.middle_name,dst.last_name) doctor_name,
    dp.specialization doctor_specialization,dp.professional_license_number doctor_license,
    vs.temperature,vs.systolic,vs.diastolic,vs.heart_rate,vs.respiratory_rate,vs.oxygen_saturation,vs.weight,vs.height,
    pa.general_appearance,pa.heent,pa.respiratory,pa.cardiovascular,pa.abdomen,pa.musculoskeletal,pa.skin,pa.neurological
  FROM consultations c JOIN visits v ON v.id=c.visit_id JOIN patients p ON p.id=c.patient_id
  LEFT JOIN students s ON s.id=p.student_id LEFT JOIN employees e ON e.id=p.employee_id
  LEFT JOIN staff pst ON pst.id=COALESCE(c.prepared_by_staff_id,c.staff_id)
  LEFT JOIN staff dst ON dst.id=c.doctor_staff_id LEFT JOIN doctor_profiles dp ON dp.staff_id=dst.id
  LEFT JOIN vital_signs vs ON vs.consultation_id=c.id LEFT JOIN physical_assessments pa ON pa.consultation_id=c.id`;

router.get('/',authorize('consultations.read'),asyncHandler(async(req,res)=>{
  const{page,limit,offset}=paginationFromQuery(req.query);const clauses=['1=1'];const params=[];
  if(req.query.search){const like=`%${String(req.query.search).trim()}%`;clauses.push(`(c.consultation_number LIKE ? OR v.visit_number LIKE ? OR p.record_number LIKE ? OR CONCAT_WS(' ',COALESCE(s.first_name,e.first_name),COALESCE(s.middle_name,e.middle_name),COALESCE(s.last_name,e.last_name)) LIKE ? OR c.diagnosis LIKE ?)`);params.push(like,like,like,like,like);}
  if(req.query.status){clauses.push('c.status=?');params.push(req.query.status);}if(req.query.dateFrom){clauses.push('v.visit_date>=?');params.push(req.query.dateFrom);}if(req.query.dateTo){clauses.push('v.visit_date<=?');params.push(req.query.dateTo);}if(req.query.patientType){clauses.push('p.patient_type=?');params.push(req.query.patientType);}if(req.query.doctorStaffId){clauses.push('c.doctor_staff_id=?');params.push(req.query.doctorStaffId);}
  const where=clauses.join(' AND ');const [counts]=await pool.execute(`SELECT COUNT(*) total FROM consultations c JOIN visits v ON v.id=c.visit_id JOIN patients p ON p.id=c.patient_id LEFT JOIN students s ON s.id=p.student_id LEFT JOIN employees e ON e.id=p.employee_id WHERE ${where}`,params);
  const [rows]=await pool.execute(`${consultationSelect} WHERE ${where} ORDER BY v.visit_date DESC,v.visit_time DESC LIMIT ? OFFSET ?`,[...params,limit,offset]);for(const row of rows)row.recommendations=parseRecommendations(row.recommendations);
  return ok(res,rows,'Consultations loaded.',paginationMeta(counts[0].total,page,limit));
}));

router.post('/',authorize('consultations.write'),requireCsrf,validate(z.object({body:consultationBody,params:z.object({}),query:z.object({})})),asyncHandler(async(req,res)=>{
  if(!req.user.staff_id)throw new AppError(403,'A clinic staff profile is required to record consultations.');
  const d=req.validated.body;
  const result=await withTransaction(async(connection)=>{
    if(d.idempotencyKey){
      await connection.execute(`INSERT IGNORE INTO api_idempotency_keys (id,user_id,scope,idempotency_key,expires_at) VALUES (?,?,'CONSULTATION_CREATE',?,DATE_ADD(NOW(),INTERVAL 1 DAY))`,[uuid(),req.user.id,d.idempotencyKey]);
      const[keys]=await connection.execute(`SELECT resource_id,response_json FROM api_idempotency_keys WHERE user_id=? AND scope='CONSULTATION_CREATE' AND idempotency_key=? FOR UPDATE`,[req.user.id,d.idempotencyKey]);
      if(keys[0]?.resource_id){try{return JSON.parse(keys[0].response_json);}catch{return{id:keys[0].resource_id};}}
    }
    const id=uuid(),number=reference('CON');
    const [visits]=await connection.execute(`SELECT v.id,v.patient_id,v.student_id,v.status,p.archived_at FROM visits v JOIN patients p ON p.id=v.patient_id WHERE v.id=? FOR UPDATE`,[d.visitId]);if(!visits.length)throw new AppError(404,'Visit not found.');
    if(visits[0].archived_at)throw new AppError(409,'The linked patient is archived and cannot receive a new consultation.');
    const [existing]=await connection.execute('SELECT id,consultation_number FROM consultations WHERE visit_id=? FOR UPDATE',[d.visitId]);
    if(existing.length){
      if(d.idempotencyKey){const response={id:existing[0].id,consultationNumber:existing[0].consultation_number};await connection.execute(`UPDATE api_idempotency_keys SET resource_type='consultations',resource_id=?,response_json=? WHERE user_id=? AND scope='CONSULTATION_CREATE' AND idempotency_key=?`,[response.id,JSON.stringify(response),req.user.id,d.idempotencyKey]);return response;}
      throw new AppError(409,'This visit already has a consultation record.');
    }
    await connection.execute(`INSERT INTO consultations (id,consultation_number,visit_id,patient_id,student_id,staff_id,prepared_by_staff_id,chief_complaint,symptoms,diagnosis,findings,severity,treatment_provided,dosage,frequency,duration,recommendations,notes,status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,[id,number,d.visitId,visits[0].patient_id,visits[0].student_id,req.user.staff_id,req.user.staff_id,d.chiefComplaint,d.symptoms||null,d.diagnosis||null,d.findings||null,d.severity,d.treatmentProvided||null,d.dosage||null,d.frequency||null,d.duration||null,JSON.stringify(d.recommendations||[]),d.notes||null,d.status]);
    const v=d.vitalSigns||{};await connection.execute(`INSERT INTO vital_signs (id,consultation_id,temperature,systolic,diastolic,heart_rate,respiratory_rate,oxygen_saturation,weight,height) VALUES (?,?,?,?,?,?,?,?,?,?)`,[uuid(),id,v.temperature??null,v.systolic??null,v.diastolic??null,v.heartRate??null,v.respiratoryRate??null,v.oxygenSaturation??null,v.weight??null,v.height??null]);
    const p=d.physicalAssessment||{};await connection.execute(`INSERT INTO physical_assessments (id,consultation_id,general_appearance,heent,respiratory,cardiovascular,abdomen,musculoskeletal,skin,neurological) VALUES (?,?,?,?,?,?,?,?,?,?)`,[uuid(),id,p.generalAppearance||null,p.heent||null,p.respiratory||null,p.cardiovascular||null,p.abdomen||null,p.musculoskeletal||null,p.skin||null,p.neurological||null]);
    await connection.execute("UPDATE visits SET status='IN_PROGRESS',updated_at=NOW() WHERE id=?",[d.visitId]);await connection.execute("UPDATE clinic_queue_entries SET status='IN_CONSULTATION',consultation_started_at=COALESCE(consultation_started_at,NOW()),updated_at=NOW() WHERE visit_id=? AND status IN ('WAITING','CALLED')",[d.visitId]);await connection.execute("UPDATE appointments a JOIN clinic_queue_entries q ON q.appointment_id=a.id SET a.status='IN_CONSULTATION',a.updated_at=NOW() WHERE q.visit_id=?",[d.visitId]);
    const response={id,consultationNumber:number};
    if(d.idempotencyKey)await connection.execute(`UPDATE api_idempotency_keys SET resource_type='consultations',resource_id=?,response_json=? WHERE user_id=? AND scope='CONSULTATION_CREATE' AND idempotency_key=?`,[id,JSON.stringify(response),req.user.id,d.idempotencyKey]);
    await writeAudit({actorUserId:req.user.id,action:'CREATE_CONSULTATION',entityType:'consultations',entityId:id,description:`Created consultation ${number}.`,ipAddress:req.ip,request:req,connection});
    return response;
  });
  return created(res,result,'Consultation draft created successfully.');
}));

router.get('/:id',authorize('consultations.read'),asyncHandler(async(req,res)=>{
  const[rows]=await pool.execute(`${consultationSelect} WHERE c.id=?`,[req.params.id]);if(!rows.length)throw new AppError(404,'Consultation not found.');const row=rows[0];row.recommendations=parseRecommendations(row.recommendations);
  const[revisions]=await pool.execute(`SELECT mr.*,u.username revised_by_username FROM medical_record_revisions mr JOIN users u ON u.id=mr.revised_by WHERE mr.consultation_id=? ORDER BY mr.created_at DESC`,[req.params.id]);
  const[followUps]=await pool.execute(`SELECT f.*,a.appointment_number,a.status appointment_status,CONCAT_WS(' ',st.first_name,st.last_name) assigned_doctor_name FROM follow_ups f LEFT JOIN appointments a ON a.id=f.appointment_id LEFT JOIN staff st ON st.id=f.assigned_doctor_staff_id WHERE f.consultation_id=? ORDER BY f.created_at DESC`,[req.params.id]);
  const[attachments]=await pool.execute('SELECT id,original_name,mime_type,file_size,description,created_at FROM medical_attachments WHERE consultation_id=? ORDER BY created_at DESC',[req.params.id]);
  await auditRecordAccess({req,entityType:'consultations',entityId:req.params.id,description:`Viewed consultation ${row.consultation_number}.`,metadata:{patientId:row.patient_id,status:row.status}});
  return ok(res,{consultation:row,revisions,followUps,attachments,capabilities:{canSign:canSign(req),canRelease:req.user.role_code==='SUPER_ADMIN'||req.user.permissions.includes('consultations.release')}});
}));

router.patch('/:id',authorize('consultations.write'),requireCsrf,validate(z.object({body:consultationBody.partial().extend({revisionReason:z.string().trim().max(1000).optional()}),params:z.object({id:z.string().uuid()}),query:z.object({})})),asyncHandler(async(req,res)=>{
  const d=req.validated.body;
  await withTransaction(async(connection)=>{
    const[rows]=await connection.execute('SELECT * FROM consultations WHERE id=? FOR UPDATE',[req.params.id]);if(!rows.length)throw new AppError(404,'Consultation not found.');const existing=rows[0];const finalized=['COMPLETED','RELEASED'].includes(existing.status);
    if(finalized&&!canSign(req))throw new AppError(403,'Only an authorized doctor can amend a clinically completed consultation.');if(finalized&&!d.revisionReason)throw new AppError(409,'A correction reason is required when amending a completed medical record.');
    const map={chiefComplaint:'chief_complaint',symptoms:'symptoms',diagnosis:'diagnosis',findings:'findings',severity:'severity',treatmentProvided:'treatment_provided',dosage:'dosage',frequency:'frequency',duration:'duration',recommendations:'recommendations',notes:'notes',status:'status'};const sets=[];const params=[];
    for(const[key,column]of Object.entries(map))if(Object.hasOwn(d,key)){if(finalized&&key==='status')continue;sets.push(`${column}=?`);params.push(key==='recommendations'?JSON.stringify(d[key]||[]):(d[key]||null));}
    if(sets.length){params.push(req.params.id);await connection.execute(`UPDATE consultations SET ${sets.join(',')},updated_at=NOW() WHERE id=?`,params);}
    if(d.vitalSigns){const v=d.vitalSigns;await connection.execute(`INSERT INTO vital_signs (id,consultation_id,temperature,systolic,diastolic,heart_rate,respiratory_rate,oxygen_saturation,weight,height) VALUES (?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE temperature=VALUES(temperature),systolic=VALUES(systolic),diastolic=VALUES(diastolic),heart_rate=VALUES(heart_rate),respiratory_rate=VALUES(respiratory_rate),oxygen_saturation=VALUES(oxygen_saturation),weight=VALUES(weight),height=VALUES(height),updated_at=NOW()`,[uuid(),req.params.id,v.temperature??null,v.systolic??null,v.diastolic??null,v.heartRate??null,v.respiratoryRate??null,v.oxygenSaturation??null,v.weight??null,v.height??null]);}
    if(d.physicalAssessment){const p=d.physicalAssessment;await connection.execute(`INSERT INTO physical_assessments (id,consultation_id,general_appearance,heent,respiratory,cardiovascular,abdomen,musculoskeletal,skin,neurological) VALUES (?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE general_appearance=VALUES(general_appearance),heent=VALUES(heent),respiratory=VALUES(respiratory),cardiovascular=VALUES(cardiovascular),abdomen=VALUES(abdomen),musculoskeletal=VALUES(musculoskeletal),skin=VALUES(skin),neurological=VALUES(neurological),updated_at=NOW()`,[uuid(),req.params.id,p.generalAppearance||null,p.heent||null,p.respiratory||null,p.cardiovascular||null,p.abdomen||null,p.musculoskeletal||null,p.skin||null,p.neurological||null]);}
    if(finalized){const[updated]=await connection.execute('SELECT * FROM consultations WHERE id=?',[req.params.id]);await connection.execute('INSERT INTO medical_record_revisions (id,consultation_id,revised_by,reason,before_data,after_data) VALUES (?,?,?,?,?,?)',[uuid(),req.params.id,req.user.id,d.revisionReason,JSON.stringify(existing),JSON.stringify(updated[0])]);}
    await writeAudit({actorUserId:req.user.id,action:finalized?'AMEND_COMPLETED_CONSULTATION':'UPDATE_CONSULTATION',entityType:'consultations',entityId:req.params.id,description:finalized?'Amended a completed consultation with a recorded reason.':'Updated consultation draft.',ipAddress:req.ip,metadata:{fields:Object.keys(d),revisionReason:d.revisionReason||null},request:req,connection});
  });return ok(res,{id:req.params.id},'Consultation saved successfully.');
}));

router.post('/:id/sign-off',authorize('consultations.signoff'),requireCsrf,validate(z.object({body:z.object({completionNotes:z.string().max(2000).optional().nullable()}),params:z.object({id:z.string().uuid()}),query:z.object({})})),asyncHandler(async(req,res)=>{
  if(req.user.role_code!=='DOCTOR'||!req.user.staff_id)throw new AppError(403,'Only an authenticated Doctor account can clinically complete a consultation.');
  await withTransaction(async(connection)=>{
    const[doctor]=await connection.execute(`SELECT dp.*,st.id staff_id FROM doctor_profiles dp JOIN staff st ON st.id=dp.staff_id WHERE dp.staff_id=? AND dp.is_active=1 AND (dp.license_expiration_date IS NULL OR dp.license_expiration_date>=CURDATE()) FOR UPDATE`,[req.user.staff_id]);if(!doctor.length)throw new AppError(403,'Your doctor professional profile is inactive or its license is expired.');
    const[rows]=await connection.execute('SELECT * FROM consultations WHERE id=? FOR UPDATE',[req.params.id]);if(!rows.length)throw new AppError(404,'Consultation not found.');const c=rows[0];if(c.status==='RELEASED')throw new AppError(409,'Released consultations require an amendment workflow.');if(c.status==='COMPLETED'&&c.signed_off_at)throw new AppError(409,'This consultation has already been signed off.');if(!c.diagnosis&&!c.findings)throw new AppError(422,'Record a diagnosis or clinical findings before doctor sign-off.');
    await connection.execute("UPDATE consultations SET status='COMPLETED',doctor_staff_id=?,completed_at=NOW(),signed_off_at=NOW(),signed_off_by_user_id=?,notes=CASE WHEN ? IS NULL OR ?='' THEN notes ELSE CONCAT_WS('\n\n',notes,?) END,updated_at=NOW() WHERE id=?",[req.user.staff_id,req.user.id,req.validated.body.completionNotes,req.validated.body.completionNotes,req.validated.body.completionNotes,req.params.id]);
    await connection.execute("UPDATE visits SET status='COMPLETED',updated_at=NOW() WHERE id=?",[c.visit_id]);await connection.execute("UPDATE clinic_queue_entries SET status='COMPLETED',completed_at=NOW(),updated_at=NOW() WHERE visit_id=? AND status<>'CANCELLED'",[c.visit_id]);await connection.execute("UPDATE appointments a JOIN clinic_queue_entries q ON q.appointment_id=a.id SET a.status='COMPLETED',a.completed_at=NOW(),a.updated_at=NOW() WHERE q.visit_id=?",[c.visit_id]);
    await writeAudit({actorUserId:req.user.id,action:'SIGN_OFF_CONSULTATION',entityType:'consultations',entityId:req.params.id,description:`Doctor signed off consultation ${c.consultation_number}.`,ipAddress:req.ip,metadata:{doctorStaffId:req.user.staff_id},request:req,connection});
  });return ok(res,{id:req.params.id,status:'COMPLETED'},'Consultation clinically completed and signed off.');
}));

router.post('/:id/release',authorize('consultations.release'),requireCsrf,asyncHandler(async(req,res)=>{
  let student=null;
  await withTransaction(async(connection)=>{
    const[rows]=await connection.execute(`SELECT c.*,p.student_id,s.registered_email,s.first_name,sa.verified_email_at FROM consultations c JOIN patients p ON p.id=c.patient_id LEFT JOIN students s ON s.id=p.student_id LEFT JOIN student_accounts sa ON sa.student_id=s.id WHERE c.id=? FOR UPDATE`,[req.params.id]);if(!rows.length)throw new AppError(404,'Consultation not found.');const c=rows[0];if(c.status!=='COMPLETED')throw new AppError(409,'Only clinically completed consultations can be released.');if(!c.signed_off_at&&!c.legacy_completion)throw new AppError(409,'Doctor sign-off is required before releasing this consultation.');
    await connection.execute("UPDATE consultations SET status='RELEASED',released_at=NOW(),released_by=?,updated_at=NOW() WHERE id=?",[req.user.id,c.id]);await writeAudit({actorUserId:req.user.id,action:'RELEASE_CONSULTATION',entityType:'consultations',entityId:c.id,description:`Released consultation ${c.consultation_number} to the patient portal.`,ipAddress:req.ip,request:req,connection});student=c;
  });
  if(student?.student_id&&student.registered_email&&student.verified_email_at)await enqueueEmail({recipient:student.registered_email,subject:'A consultation result is available in your KLD Clinic Portal',template:'CONSULTATION_RELEASED',payload:{title:'Consultation result available',message:`<p>Hello ${student.first_name}, an authorized clinic consultation result is available in your secure portal.</p>`,actionUrl:`${env.APP_URL}/student/consultations`,actionLabel:'View result securely'},relatedType:'consultations',relatedId:req.params.id});
  return ok(res,{id:req.params.id,status:'RELEASED'},'Consultation released successfully.');
}));

export default router;
