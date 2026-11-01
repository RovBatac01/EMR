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
import { getPatientForStudentUser } from '../services/patients/patientService.js';

const router=express.Router();
router.use(authenticate);

function parseJson(value){if(!value)return{};if(typeof value==='object')return value;try{return JSON.parse(value);}catch{return{};}}

async function currentSnapshot(connection,patientId,type,{lock=false}={}){
  const suffix=lock?' FOR UPDATE':'';
  if(type==='CONTACT'){
    const [rows]=await connection.execute(`SELECT s.contact_number,s.address,s.registered_email,s.updated_at FROM patients p JOIN students s ON s.id=p.student_id WHERE p.id=?${suffix}`,[patientId]);
    if(!rows.length)throw new AppError(404,'Student contact record not found.');
    const r=rows[0];return {values:{contactNumber:r.contact_number||'',address:r.address||'',registeredEmail:r.registered_email||''},updatedAt:r.updated_at};
  }
  if(type==='GUARDIAN'){
    const [rows]=await connection.execute(`SELECT id,full_name,relationship,contact_number,email,updated_at FROM guardians WHERE patient_id=? ORDER BY is_primary DESC,created_at LIMIT 1${suffix}`,[patientId]);
    const r=rows[0];return {values:r?{fullName:r.full_name||'',relationship:r.relationship||'',contactNumber:r.contact_number||'',email:r.email||''}:{fullName:'',relationship:'',contactNumber:'',email:''},updatedAt:r?.updated_at||null,recordId:r?.id||null};
  }
  if(type==='EMERGENCY_CONTACT'){
    const [rows]=await connection.execute(`SELECT id,full_name,relationship,contact_number,updated_at FROM emergency_contacts WHERE patient_id=? ORDER BY is_primary DESC,created_at LIMIT 1${suffix}`,[patientId]);
    const r=rows[0];return {values:r?{fullName:r.full_name||'',relationship:r.relationship||'',contactNumber:r.contact_number||''}:{fullName:'',relationship:'',contactNumber:''},updatedAt:r?.updated_at||null,recordId:r?.id||null};
  }
  const [rows]=await connection.execute(`SELECT id,blood_type,allergies,existing_conditions,current_medications,medical_history,immunizations,important_alerts,updated_at FROM patient_medical_history WHERE patient_id=?${suffix}`,[patientId]);
  if(!rows.length)throw new AppError(404,'Patient medical information was not found.');const r=rows[0];
  return {values:{bloodType:r.blood_type||'',allergies:r.allergies||'',existingConditions:r.existing_conditions||'',currentMedications:r.current_medications||'',medicalHistory:r.medical_history||'',immunizations:r.immunizations||'',importantAlerts:r.important_alerts||''},updatedAt:r.updated_at,recordId:r.id};
}

const phoneSchema=z.string().trim().min(7,'Enter a valid contact number.').max(40).regex(/^[0-9+()\- .]+$/,'Enter a valid contact number.');
const optionalEmail=z.preprocess(value=>value===''?null:value,z.string().trim().email().max(190).nullable().optional());
const correctionBody=z.discriminatedUnion('requestType',[
  z.object({requestType:z.literal('CONTACT'),proposedValues:z.object({contactNumber:phoneSchema,address:z.string().trim().min(5).max(1000),registeredEmail:z.string().trim().email().max(190)}).strict()}),
  z.object({requestType:z.literal('GUARDIAN'),proposedValues:z.object({fullName:z.string().trim().min(2).max(200),relationship:z.string().trim().min(2).max(100),contactNumber:phoneSchema,email:optionalEmail}).strict()}),
  z.object({requestType:z.literal('EMERGENCY_CONTACT'),proposedValues:z.object({fullName:z.string().trim().min(2).max(200),relationship:z.string().trim().min(2).max(100),contactNumber:phoneSchema}).strict()}),
  z.object({requestType:z.literal('HEALTH_INFORMATION'),proposedValues:z.object({
    bloodType:z.string().trim().max(10),allergies:z.string().trim().max(20000),existingConditions:z.string().trim().max(20000),
    currentMedications:z.string().trim().max(20000),medicalHistory:z.string().trim().max(20000),immunizations:z.string().trim().max(20000),importantAlerts:z.string().trim().max(20000)
  }).strict().refine(values=>Object.values(values).some(value=>value.length>0),{message:'Enter at least one health-information value.'})})
]);
router.post('/',requireCsrf,validate(z.object({body:correctionBody,params:z.object({}),query:z.object({})})),asyncHandler(async(req,res)=>{
  if(req.user.role_code!=='STUDENT')throw new AppError(403,'Patient correction requests must be submitted through a student portal account.');
  const patient=await getPatientForStudentUser(pool,req.user.id);const type=req.validated.body.requestType;const snapshot=await currentSnapshot(pool,patient.patient_id,type);
  const [pending]=await pool.execute("SELECT id,request_number FROM patient_correction_requests WHERE patient_id=? AND request_type=? AND status='PENDING'",[patient.patient_id,type]);if(pending.length)throw new AppError(409,`A pending request already exists (${pending[0].request_number}).`);
  const id=uuid(),number=reference('PCR');
  await pool.execute(`INSERT INTO patient_correction_requests (id,request_number,patient_id,requested_by_user_id,request_type,current_values_json,proposed_values_json,source_updated_at,status) VALUES (?,?,?,?,?,?,?,?,'PENDING')`,[id,number,patient.patient_id,req.user.id,type,JSON.stringify(snapshot.values),JSON.stringify(req.validated.body.proposedValues),snapshot.updatedAt]);
  await writeAudit({actorUserId:req.user.id,action:'SUBMIT_PATIENT_CORRECTION',entityType:'patient_correction_requests',entityId:id,description:`Submitted patient information correction ${number}.`,ipAddress:req.ip,metadata:{requestType:type},request:req});
  return created(res,{id,requestNumber:number},'Correction request submitted for clinic review.');
}));

router.get('/mine',asyncHandler(async(req,res)=>{
  if(req.user.role_code!=='STUDENT')throw new AppError(403,'This endpoint is for student portal accounts.');const patient=await getPatientForStudentUser(pool,req.user.id);
  const [rows]=await pool.execute('SELECT * FROM patient_correction_requests WHERE patient_id=? ORDER BY submitted_at DESC',[patient.patient_id]);for(const row of rows){row.current_values=parseJson(row.current_values_json);row.proposed_values=parseJson(row.proposed_values_json);delete row.current_values_json;delete row.proposed_values_json;}return ok(res,rows);
}));

router.get('/',authorize('patient_corrections.review'),asyncHandler(async(req,res)=>{
  const {page,limit,offset}=paginationFromQuery(req.query);const clauses=['1=1'];const params=[];if(req.query.status){clauses.push('pcr.status=?');params.push(req.query.status);}if(req.query.type){clauses.push('pcr.request_type=?');params.push(req.query.type);}const where=clauses.join(' AND ');
  const [counts]=await pool.execute(`SELECT COUNT(*) total FROM patient_correction_requests pcr WHERE ${where}`,params);
  const [rows]=await pool.execute(`SELECT pcr.*,p.patient_type,p.record_number,CONCAT_WS(' ',COALESCE(s.first_name,e.first_name),COALESCE(s.middle_name,e.middle_name),COALESCE(s.last_name,e.last_name)) patient_name,ru.username requested_by_username,vu.username reviewed_by_username FROM patient_correction_requests pcr JOIN patients p ON p.id=pcr.patient_id LEFT JOIN students s ON s.id=p.student_id LEFT JOIN employees e ON e.id=p.employee_id JOIN users ru ON ru.id=pcr.requested_by_user_id LEFT JOIN users vu ON vu.id=pcr.reviewed_by_user_id WHERE ${where} ORDER BY pcr.submitted_at DESC LIMIT ? OFFSET ?`,[...params,limit,offset]);
  for(const row of rows){row.current_values=parseJson(row.current_values_json);row.proposed_values=parseJson(row.proposed_values_json);delete row.current_values_json;delete row.proposed_values_json;}
  return ok(res,rows,'Correction requests loaded.',paginationMeta(counts[0].total,page,limit));
}));

router.post('/:id/review',authorize('patient_corrections.review'),requireCsrf,validate(z.object({body:z.object({decision:z.enum(['APPROVE','REJECT']),comments:z.string().trim().min(3).max(2000)}),params:z.object({id:z.string().uuid()}),query:z.object({})})),asyncHandler(async(req,res)=>{
  const decision=req.validated.body.decision;let status;
  await withTransaction(async(connection)=>{
    const [requests]=await connection.execute('SELECT * FROM patient_correction_requests WHERE id=? FOR UPDATE',[req.params.id]);if(!requests.length)throw new AppError(404,'Correction request not found.');const r=requests[0];if(r.status!=='PENDING')throw new AppError(409,'This correction request has already been reviewed.');
    if(decision==='REJECT'){status='REJECTED';await connection.execute("UPDATE patient_correction_requests SET status='REJECTED',reviewer_comments=?,reviewed_by_user_id=?,reviewed_at=NOW(),updated_at=NOW() WHERE id=?",[req.validated.body.comments,req.user.id,r.id]);}
    else{
      const snapshot=await currentSnapshot(connection,r.patient_id,r.request_type,{lock:true});
      const source=r.source_updated_at?String(r.source_updated_at):null;const current=snapshot.updatedAt?String(snapshot.updatedAt):null;
      if(source!==current){status='CONFLICT';await connection.execute("UPDATE patient_correction_requests SET status='CONFLICT',reviewer_comments=?,reviewed_by_user_id=?,reviewed_at=NOW(),updated_at=NOW() WHERE id=?",[`Official record changed after submission. ${req.validated.body.comments}`,req.user.id,r.id]);}
      else{
        const proposed=parseJson(r.proposed_values_json);const [patientRows]=await connection.execute('SELECT * FROM patients WHERE id=? FOR UPDATE',[r.patient_id]);const patient=patientRows[0];
        if(r.request_type==='CONTACT')await connection.execute('UPDATE students SET contact_number=?,address=?,registered_email=?,updated_at=NOW() WHERE id=?',[proposed.contactNumber||null,proposed.address||null,proposed.registeredEmail||null,patient.student_id]);
        else if(r.request_type==='GUARDIAN'){
          if(snapshot.recordId)await connection.execute('UPDATE guardians SET full_name=?,relationship=?,contact_number=?,email=?,updated_at=NOW() WHERE id=?',[proposed.fullName,proposed.relationship||null,proposed.contactNumber||null,proposed.email||null,snapshot.recordId]);
          else await connection.execute('INSERT INTO guardians (id,patient_id,student_id,full_name,relationship,contact_number,email,is_primary) VALUES (?,?,?,?,?,?,?,1)',[uuid(),r.patient_id,patient.student_id,proposed.fullName,proposed.relationship||null,proposed.contactNumber||null,proposed.email||null]);
        }else if(r.request_type==='EMERGENCY_CONTACT'){
          if(snapshot.recordId)await connection.execute('UPDATE emergency_contacts SET full_name=?,relationship=?,contact_number=?,updated_at=NOW() WHERE id=?',[proposed.fullName,proposed.relationship||null,proposed.contactNumber,snapshot.recordId]);
          else await connection.execute('INSERT INTO emergency_contacts (id,patient_id,student_id,full_name,relationship,contact_number,is_primary) VALUES (?,?,?,?,?,?,1)',[uuid(),r.patient_id,patient.student_id,proposed.fullName,proposed.relationship||null,proposed.contactNumber]);
        }else await connection.execute(`UPDATE patient_medical_history SET blood_type=?,allergies=?,existing_conditions=?,current_medications=?,medical_history=?,immunizations=?,important_alerts=?,updated_at=NOW() WHERE patient_id=?`,[proposed.bloodType||null,proposed.allergies||null,proposed.existingConditions||null,proposed.currentMedications||null,proposed.medicalHistory||null,proposed.immunizations||null,proposed.importantAlerts||null,r.patient_id]);
        status='APPROVED';await connection.execute("UPDATE patient_correction_requests SET status='APPROVED',reviewer_comments=?,reviewed_by_user_id=?,reviewed_at=NOW(),applied_at=NOW(),updated_at=NOW() WHERE id=?",[req.validated.body.comments,req.user.id,r.id]);
      }
    }
    const [studentUsers]=await connection.execute('SELECT sa.user_id FROM patients p JOIN student_accounts sa ON sa.student_id=p.student_id WHERE p.id=?',[r.patient_id]);if(studentUsers.length)await connection.execute(`INSERT INTO notifications (id,user_id,patient_id,notification_type,severity,title,message,link) VALUES (?,?,?,'PATIENT_CORRECTION_RESULT',?,?,?,?)`,[uuid(),studentUsers[0].user_id,r.patient_id,status==='APPROVED'?'INFO':'WARNING',`Correction request ${status.toLowerCase()}`,`Your request ${r.request_number} was ${status.toLowerCase()}.`,'/student/profile']);
    await writeAudit({actorUserId:req.user.id,action:`PATIENT_CORRECTION_${status}`,entityType:'patient_correction_requests',entityId:r.id,description:`Reviewed correction request ${r.request_number}: ${status}.`,ipAddress:req.ip,metadata:{requestType:r.request_type},request:req,connection});
  });return ok(res,{id:req.params.id,status},status==='APPROVED'?'Correction approved and applied.':status==='CONFLICT'?'The official record changed; the request was marked as a conflict.':'Correction request rejected.');
}));

export default router;
