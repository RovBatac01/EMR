import express from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { pool } from '../config/db.js';
import { env } from '../config/env.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { requireCsrf } from '../middleware/csrf.js';
import { validate } from '../middleware/validate.js';
import { AppError, asyncHandler, ok } from '../utils/http.js';
import { writeAudit } from '../utils/audit.js';
import { hasValidFileSignature, removeUploadedFile } from '../utils/fileSignatures.js';

const router=express.Router();
const __dirname=path.dirname(fileURLToPath(import.meta.url));
const brandingDir=path.resolve(__dirname,'..',env.UPLOAD_DIR,'branding');
await fs.mkdir(brandingDir,{recursive:true});

const imageExtensions={ 'image/png':'.png', 'image/jpeg':'.jpg', 'image/webp':'.webp' };
const upload=multer({
  storage:multer.diskStorage({
    destination:(_req,_file,cb)=>cb(null,brandingDir),
    filename:(_req,file,cb)=>cb(null,`logo-${Date.now()}-${Math.random().toString(36).slice(2,10)}${imageExtensions[file.mimetype]||'.img'}`)
  }),
  limits:{fileSize:2*1024*1024,files:1},
  fileFilter:(_req,file,cb)=>{
    if(!imageExtensions[file.mimetype])return cb(new AppError(400,'Logo must be a PNG, JPG, or WebP image.'));
    cb(null,true);
  }
});

async function getSettings(group=null){
  const [rows]=group?await pool.execute('SELECT setting_key,setting_value,value_type,group_name FROM system_settings WHERE group_name=? ORDER BY setting_key',[group]):await pool.query('SELECT setting_key,setting_value,value_type,group_name FROM system_settings ORDER BY group_name,setting_key');
  const result={};
  for(const row of rows){let value=row.setting_value;if(row.value_type==='BOOLEAN')value=value==='true';if(row.value_type==='NUMBER')value=Number(value);result[row.setting_key]=value;}
  return result;
}

router.get('/public',asyncHandler(async(_req,res)=>{
  const all=await getSettings();
  const allowed=['school_name','clinic_name','clinic_contact','clinic_address','clinic_operating_info','institutional_logo','system_name','system_version'];
  return ok(res,Object.fromEntries(allowed.map(k=>[k,all[k]])));
}));

router.use(authenticate);
router.get('/',authorize('settings.read'),asyncHandler(async(_req,res)=>ok(res,await getSettings())));

router.patch('/',authorize('settings.manage'),requireCsrf,validate(z.object({body:z.object({settings:z.record(z.union([z.string().max(5000),z.number(),z.boolean(),z.null()]))}),params:z.object({}),query:z.object({})})),asyncHandler(async(req,res)=>{
  const allowed=new Set(['school_name','clinic_name','clinic_contact','clinic_address','clinic_operating_info','system_name','timezone','date_format','near_expiry_days','email_notifications_enabled']);
  for(const [key,value] of Object.entries(req.validated.body.settings)){
    if(!allowed.has(key))continue;
    const type=typeof value==='boolean'?'BOOLEAN':typeof value==='number'?'NUMBER':'STRING';
    await pool.execute(
      `INSERT INTO system_settings (setting_key,setting_value,value_type,group_name,updated_by)
       VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value),value_type=VALUES(value_type),updated_by=VALUES(updated_by),updated_at=NOW()`,
      [key,String(value??''),type,key.includes('email')?'NOTIFICATIONS':key.includes('name')||key.startsWith('clinic_')?'CLINIC':'SYSTEM',req.user.id]
    );
  }
  await writeAudit({actorUserId:req.user.id,action:'CHANGE_SETTINGS',entityType:'system_settings',description:'Updated system and clinic settings.',ipAddress:req.ip,metadata:{keys:Object.keys(req.validated.body.settings)}});
  return ok(res,await getSettings(),'Settings saved successfully.');
}));

router.post('/logo',authorize('settings.manage'),requireCsrf,upload.single('logo'),asyncHandler(async(req,res)=>{
  if(!req.file)throw new AppError(400,'Select a logo file to upload.');
  if(!await hasValidFileSignature(req.file.path,req.file.mimetype)){await removeUploadedFile(req.file);throw new AppError(400,'The uploaded file is not a valid image.');}
  const relative=`/uploads/branding/${req.file.filename}`;
  const [old]=await pool.execute("SELECT setting_value FROM system_settings WHERE setting_key='institutional_logo'");
  await pool.execute(
    `INSERT INTO system_settings (setting_key,setting_value,value_type,group_name,updated_by)
     VALUES ('institutional_logo',?,'STRING','CLINIC',?) ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value),updated_by=VALUES(updated_by),updated_at=NOW()`,[relative,req.user.id]);
  const oldValue=old[0]?.setting_value;
  if(oldValue?.startsWith('/uploads/branding/')){
    const oldPath=path.join(brandingDir,path.basename(oldValue));
    if(oldPath!==req.file.path)await fs.unlink(oldPath).catch(()=>{});
  }
  await writeAudit({actorUserId:req.user.id,action:'CHANGE_SETTINGS',entityType:'system_settings',description:'Updated institutional clinic logo.',ipAddress:req.ip});
  return ok(res,{institutional_logo:relative},'Logo uploaded successfully.');
}));

router.delete('/logo',authorize('settings.manage'),requireCsrf,asyncHandler(async(req,res)=>{
  const [old]=await pool.execute("SELECT setting_value FROM system_settings WHERE setting_key='institutional_logo'");
  const oldValue=old[0]?.setting_value;
  await pool.execute("UPDATE system_settings SET setting_value='/assets/default-clinic-logo.svg',updated_by=?,updated_at=NOW() WHERE setting_key='institutional_logo'",[req.user.id]);
  if(oldValue?.startsWith('/uploads/branding/'))await fs.unlink(path.join(brandingDir,path.basename(oldValue))).catch(()=>{});
  return ok(res,{institutional_logo:'/assets/default-clinic-logo.svg'},'Default logo restored.');
}));

export default router;
