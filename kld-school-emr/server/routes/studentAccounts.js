import express from 'express';
import multer from 'multer';
import { z } from 'zod';
import { pool, withTransaction } from '../config/db.js';
import { env } from '../config/env.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { requireCsrf } from '../middleware/csrf.js';
import { validate } from '../middleware/validate.js';
import { AppError, asyncHandler, ok } from '../utils/http.js';
import { paginationFromQuery, paginationMeta } from '../utils/pagination.js';
import { randomToken, sha256 } from '../utils/security.js';
import { uuid } from '../utils/ids.js';
import { enqueueEmail } from '../services/emailService.js';
import { writeAudit } from '../utils/audit.js';

const router=express.Router();const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:2*1024*1024}});
router.use(authenticate,authorize('student_accounts.manage'));

router.get('/',asyncHandler(async(req,res)=>{
  const {page,limit,offset}=paginationFromQuery(req.query);const clauses=['1=1'];const params=[];
  if(req.query.search){const like=`%${String(req.query.search).trim()}%`;clauses.push('(s.student_number LIKE ? OR CONCAT_WS(" ",s.first_name,s.middle_name,s.last_name) LIKE ? OR s.registered_email LIKE ? OR s.program LIKE ?)');params.push(like,like,like,like);}
  if(req.query.status){clauses.push('s.account_activation_status=?');params.push(req.query.status);}
  if(req.query.enrollmentStatus){clauses.push('s.enrollment_status=?');params.push(req.query.enrollmentStatus);}
  const where=clauses.join(' AND ');
  const [counts]=await pool.execute(`SELECT COUNT(*) total FROM students s WHERE ${where}`,params);
  const [rows]=await pool.execute(`SELECT s.id,s.student_number,s.first_name,s.middle_name,s.last_name,s.program,s.year_level,s.section,s.registered_email,s.enrollment_status,s.academic_year,s.semester,s.portal_eligible,s.account_activation_status,s.account_linked,sa.activated_at,sa.verified_email_at,u.username,u.status AS account_status,u.last_login_at FROM students s LEFT JOIN student_accounts sa ON sa.student_id=s.id LEFT JOIN users u ON u.id=sa.user_id WHERE ${where} ORDER BY s.last_name,s.first_name LIMIT ? OFFSET ?`,[...params,limit,offset]);
  return ok(res,rows,'Student accounts loaded.',paginationMeta(counts[0].total,page,limit));
}));

router.patch('/:id',requireCsrf,validate(z.object({body:z.object({registeredEmail:z.string().email().optional(),enrollmentStatus:z.enum(['ACTIVE','INACTIVE','GRADUATED','TRANSFERRED','SUSPENDED']).optional(),portalEligible:z.boolean().optional(),academicYear:z.string().max(20).optional(),semester:z.string().max(30).optional()}),params:z.object({id:z.string().uuid()}),query:z.object({})})),asyncHandler(async(req,res)=>{
  const map={registeredEmail:'registered_email',enrollmentStatus:'enrollment_status',portalEligible:'portal_eligible',academicYear:'academic_year',semester:'semester'};const sets=[];const params=[];
  for(const [k,c] of Object.entries(map))if(Object.hasOwn(req.validated.body,k)){sets.push(`${c}=?`);params.push(k==='portalEligible'?(req.validated.body[k]?1:0):req.validated.body[k]);}
  if(!sets.length)return ok(res,null,'No changes were submitted.');params.push(req.params.id);
  const [result]=await pool.execute(`UPDATE students SET ${sets.join(',')},updated_at=NOW() WHERE id=?`,params);if(!result.affectedRows)throw new AppError(404,'Student not found.');
  if(req.validated.body.enrollmentStatus&&req.validated.body.enrollmentStatus!=='ACTIVE'){await pool.execute(`UPDATE users u JOIN student_accounts sa ON sa.user_id=u.id SET u.status='DISABLED' WHERE sa.student_id=?`,[req.params.id]);}
  await writeAudit({actorUserId:req.user.id,action:'UPDATE_STUDENT_ACCOUNT_ELIGIBILITY',entityType:'students',entityId:req.params.id,description:'Updated student portal eligibility.',ipAddress:req.ip,metadata:req.validated.body});
  return ok(res,null,'Student account eligibility updated.');
}));

router.post('/:id/resend-activation',requireCsrf,asyncHandler(async(req,res)=>{
  const [rows]=await pool.execute(`SELECT s.* FROM students s LEFT JOIN student_accounts sa ON sa.student_id=s.id WHERE s.id=? AND s.enrollment_status='ACTIVE' AND s.portal_eligible=1 AND sa.id IS NULL`,[req.params.id]);
  if(!rows.length)throw new AppError(409,'This student is not eligible for a new activation message.');
  const token=randomToken(32);await pool.execute('UPDATE email_verification_tokens SET used_at=NOW() WHERE student_id=? AND used_at IS NULL',[req.params.id]);
  await pool.execute("INSERT INTO email_verification_tokens (id,student_id,email,token_hash,purpose,expires_at) VALUES (?,?,?,?, 'STUDENT_ACTIVATION',DATE_ADD(NOW(),INTERVAL 30 MINUTE))",[uuid(),req.params.id,rows[0].registered_email,sha256(token)]);
  await enqueueEmail({recipient:rows[0].registered_email,subject:'Activate your KLD Student Clinic Portal',template:'STUDENT_ACTIVATION',payload:{title:'Student clinic account activation',message:'<p>An authorized KLD clinic administrator has sent you a new activation link.</p>',actionUrl:`${env.APP_URL}/activate-student?token=${token}`,actionLabel:'Activate account'},relatedType:'students',relatedId:req.params.id});
  await writeAudit({actorUserId:req.user.id,action:'RESEND_STUDENT_ACTIVATION',entityType:'students',entityId:req.params.id,description:'Resent student portal activation message.',ipAddress:req.ip});
  return ok(res,env.NODE_ENV==='development'&&env.EMAIL_MODE==='log'?{developmentToken:token}:null,'Activation message queued.');
}));

router.post('/:id/revoke',requireCsrf,validate(z.object({body:z.object({reason:z.string().trim().min(5).max(1000)}),params:z.object({id:z.string().uuid()}),query:z.object({})})),asyncHandler(async(req,res)=>{
  await withTransaction(async(connection)=>{
    const [accounts]=await connection.execute('SELECT user_id FROM student_accounts WHERE student_id=? FOR UPDATE',[req.params.id]);if(!accounts.length)throw new AppError(404,'Linked student account not found.');
    await connection.execute("UPDATE users SET status='DISABLED' WHERE id=?",[accounts[0].user_id]);
    await connection.execute('UPDATE user_sessions SET revoked_at=NOW() WHERE user_id=? AND revoked_at IS NULL',[accounts[0].user_id]);
    await connection.execute("UPDATE students SET account_activation_status='REVOKED' WHERE id=?",[req.params.id]);
    await writeAudit({actorUserId:req.user.id,action:'STUDENT_ACCOUNT_DISABLED',entityType:'students',entityId:req.params.id,description:'Revoked student portal access.',ipAddress:req.ip,metadata:{reason:req.validated.body.reason},connection});
  });return ok(res,null,'Student portal access revoked.');
}));

function parseCsv(text){
  const lines=text.replace(/^\uFEFF/,'').split(/\r?\n/).filter(Boolean);if(lines.length<2)return[];
  const parseLine=(line)=>{const out=[];let value='';let quoted=false;for(let i=0;i<line.length;i++){const ch=line[i];if(ch==='"'&&quoted&&line[i+1]==='"'){value+='"';i++;}else if(ch==='"'){quoted=!quoted;}else if(ch===','&&!quoted){out.push(value.trim());value='';}else value+=ch;}out.push(value.trim());return out;};
  const headers=parseLine(lines[0]).map(h=>h.toLowerCase().replace(/\s+/g,'_'));return lines.slice(1).map(line=>Object.fromEntries(headers.map((h,i)=>[h,parseLine(line)[i]||''])));
}
router.post('/import',requireCsrf,upload.single('file'),asyncHandler(async(req,res)=>{
  if(!req.file)throw new AppError(400,'Select a CSV file.');const records=parseCsv(req.file.buffer.toString('utf8'));if(!records.length)throw new AppError(400,'The CSV file contains no data rows.');
  let inserted=0,updated=0;await withTransaction(async(connection)=>{for(const row of records){if(!row.student_number||!row.first_name||!row.last_name||!row.birth_date||!row.registered_email)continue;const id=uuid();const [result]=await connection.execute(`INSERT INTO students (id,student_number,first_name,middle_name,last_name,birth_date,sex,program,year_level,section,registered_email,contact_number,enrollment_status,academic_year,semester,portal_eligible,account_activation_status,account_linked) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?, 'NOT_ACTIVATED',0) ON DUPLICATE KEY UPDATE first_name=VALUES(first_name),middle_name=VALUES(middle_name),last_name=VALUES(last_name),birth_date=VALUES(birth_date),sex=VALUES(sex),program=VALUES(program),year_level=VALUES(year_level),section=VALUES(section),registered_email=VALUES(registered_email),contact_number=VALUES(contact_number),enrollment_status=VALUES(enrollment_status),academic_year=VALUES(academic_year),semester=VALUES(semester),portal_eligible=VALUES(portal_eligible),updated_at=NOW()`,[id,row.student_number,row.first_name,row.middle_name||null,row.last_name,row.birth_date,(row.sex||'PREFER_NOT_TO_SAY').toUpperCase(),row.program||'Unspecified',row.year_level||'Unspecified',row.section||null,row.registered_email,row.contact_number||null,(row.enrollment_status||'ACTIVE').toUpperCase(),row.academic_year||'',row.semester||'',String(row.portal_eligible||'true').toLowerCase()!=='false'?1:0]);if(result.affectedRows===1)inserted++;else updated++;}await writeAudit({actorUserId:req.user.id,action:'IMPORT_STUDENTS',entityType:'students',description:`Imported student registry CSV: ${inserted} inserted, ${updated} updated.`,ipAddress:req.ip,connection});});
  return ok(res,{inserted,updated,received:records.length},'Student registry import completed.');
}));

export default router;
