import express from 'express';
import { pool } from '../config/db.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { requireCsrf } from '../middleware/csrf.js';
import { asyncHandler, ok } from '../utils/http.js';
import { paginationFromQuery, paginationMeta } from '../utils/pagination.js';

const router=express.Router();router.use(authenticate,authorize('email_logs.read'));
router.get('/',asyncHandler(async(req,res)=>{const {page,limit,offset}=paginationFromQuery(req.query);const [counts]=await pool.query('SELECT COUNT(*) total FROM email_queue');const [rows]=await pool.execute(`SELECT eq.*,edl.status delivery_status,edl.message_id,edl.error_message,edl.attempted_at FROM email_queue eq LEFT JOIN email_delivery_logs edl ON edl.id=(SELECT id FROM email_delivery_logs WHERE queue_id=eq.id ORDER BY attempted_at DESC LIMIT 1) ORDER BY eq.created_at DESC LIMIT ? OFFSET ?`,[limit,offset]);return ok(res,rows,'Email queue loaded.',paginationMeta(counts[0].total,page,limit));}));
router.post('/:id/retry',requireCsrf,asyncHandler(async(req,res)=>{await pool.execute("UPDATE email_queue SET status='RETRY',next_attempt_at=NOW(),updated_at=NOW() WHERE id=? AND status='FAILED'",[req.params.id]);return ok(res,null,'Email queued for retry.');}));
export default router;
