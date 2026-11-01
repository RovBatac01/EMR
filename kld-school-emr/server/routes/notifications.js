import express from 'express';
import { pool } from '../config/db.js';
import { authenticate } from '../middleware/auth.js';
import { requireCsrf } from '../middleware/csrf.js';
import { asyncHandler, ok } from '../utils/http.js';

const router=express.Router();router.use(authenticate);
router.get('/',asyncHandler(async(req,res)=>{
  const [rows]=await pool.execute(`SELECT n.* FROM notifications n LEFT JOIN users u ON u.id=? WHERE (n.user_id=? OR (n.user_id IS NULL AND n.role_id=(SELECT role_id FROM users WHERE id=?))) ORDER BY n.created_at DESC LIMIT 100`,[req.user.id,req.user.id,req.user.id]);
  const unread=rows.filter(r=>!r.is_read).length;return ok(res,{items:rows,unread});
}));
router.patch('/:id/read',requireCsrf,asyncHandler(async(req,res)=>{await pool.execute('UPDATE notifications SET is_read=1,read_at=NOW() WHERE id=? AND user_id=?',[req.params.id,req.user.id]);return ok(res,null,'Notification marked as read.');}));
router.post('/read-all',requireCsrf,asyncHandler(async(req,res)=>{await pool.execute('UPDATE notifications SET is_read=1,read_at=NOW() WHERE user_id=? AND is_read=0',[req.user.id]);return ok(res,null,'All notifications marked as read.');}));
export default router;
