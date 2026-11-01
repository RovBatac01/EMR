import express from 'express';
import { pool } from '../config/db.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler, ok } from '../utils/http.js';
import { paginationFromQuery, paginationMeta } from '../utils/pagination.js';

const router=express.Router();
router.use(authenticate,authorize('logs.read'));
router.get('/',asyncHandler(async(req,res)=>{
  const {page,limit,offset}=paginationFromQuery(req.query);const clauses=['1=1'];const params=[];
  if(req.query.search){const like=`%${String(req.query.search).trim()}%`;clauses.push('(al.action LIKE ? OR al.description LIKE ? OR u.username LIKE ?)');params.push(like,like,like);}
  if(req.query.action){clauses.push('al.action=?');params.push(req.query.action);}
  if(req.query.dateFrom){clauses.push('DATE(al.created_at)>=?');params.push(req.query.dateFrom);}
  if(req.query.dateTo){clauses.push('DATE(al.created_at)<=?');params.push(req.query.dateTo);}
  const where=clauses.join(' AND ');
  const [counts]=await pool.execute(`SELECT COUNT(*) total FROM activity_logs al LEFT JOIN users u ON u.id=al.actor_user_id WHERE ${where}`,params);
  const [rows]=await pool.execute(`SELECT al.*,u.username,r.name role_name FROM activity_logs al LEFT JOIN users u ON u.id=al.actor_user_id LEFT JOIN roles r ON r.id=u.role_id WHERE ${where} ORDER BY al.created_at DESC LIMIT ? OFFSET ?`,[...params,limit,offset]);
  return ok(res,rows,'Activity logs loaded.',paginationMeta(counts[0].total,page,limit));
}));
export default router;
