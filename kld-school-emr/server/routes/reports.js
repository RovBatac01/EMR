import express from 'express';
import PDFDocument from 'pdfkit';
import { pool } from '../config/db.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler, ok } from '../utils/http.js';
import { writeAudit } from '../utils/audit.js';
import { patientIdentityColumns, patientIdentityFrom } from '../services/patients/patientService.js';

const router = express.Router();
router.use(authenticate, authorize('reports.read'));

router.get('/dashboard', asyncHandler(async (_req, res) => {
  const [[counts]] = await pool.query(`SELECT
    (SELECT COUNT(*) FROM patients WHERE status = 'ACTIVE') AS total_patients,
    (SELECT COUNT(*) FROM patients WHERE patient_type = 'STUDENT') AS total_students,
    (SELECT COUNT(*) FROM students WHERE enrollment_status = 'ACTIVE') AS active_students,
    (SELECT COUNT(*) FROM patients WHERE patient_type = 'EMPLOYEE' AND status = 'ACTIVE') AS active_employees,
    (SELECT COUNT(*) FROM visits WHERE visit_date = CURDATE()) AS visits_today,
    (SELECT COUNT(DISTINCT patient_id) FROM visits WHERE visit_date = CURDATE()) AS patients_today,
    (SELECT COUNT(*) FROM consultations WHERE status IN ('DRAFT','IN_PROGRESS')) AS pending_consultations,
    (SELECT COUNT(*) FROM appointments WHERE status IN ('PENDING','PROPOSED')) AS pending_appointments,
    (SELECT COUNT(*) FROM clinic_queue_entries WHERE queue_date = CURDATE() AND status IN ('WAITING','CALLED','IN_CONSULTATION')) AS active_queue,
    (SELECT COUNT(*) FROM follow_ups WHERE status IN ('PENDING','SCHEDULED') AND target_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)) AS due_followups,
    (SELECT COUNT(*) FROM (
       SELECT m.id, COALESCE(SUM(CASE WHEN mb.expiration_date >= CURDATE() THEN mb.quantity ELSE 0 END),0) qty, m.minimum_stock
       FROM medicines m LEFT JOIN medicine_batches mb ON mb.medicine_id = m.id
       WHERE m.is_active = 1 AND m.archived_at IS NULL GROUP BY m.id HAVING qty <= m.minimum_stock
     ) x) AS low_stock_medicines,
    (SELECT COUNT(*) FROM medicine_batches mb JOIN medicines m ON m.id = mb.medicine_id WHERE mb.quantity > 0 AND mb.expiration_date < CURDATE() AND m.is_active = 1 AND m.archived_at IS NULL) AS expired_batches,
    (SELECT COUNT(*) FROM visits WHERE priority IN ('URGENT','EMERGENCY') AND visit_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)) AS flagged_cases`);
  const [daily] = await pool.query(`SELECT DATE_FORMAT(d.day,'%Y-%m-%d') AS date, COALESCE(COUNT(v.id),0) AS visits
    FROM (SELECT CURDATE() day UNION ALL SELECT CURDATE()-INTERVAL 1 DAY UNION ALL SELECT CURDATE()-INTERVAL 2 DAY
      UNION ALL SELECT CURDATE()-INTERVAL 3 DAY UNION ALL SELECT CURDATE()-INTERVAL 4 DAY
      UNION ALL SELECT CURDATE()-INTERVAL 5 DAY UNION ALL SELECT CURDATE()-INTERVAL 6 DAY) d
    LEFT JOIN visits v ON v.visit_date = d.day GROUP BY d.day ORDER BY d.day`);
  const [monthly] = await pool.query(`SELECT DATE_FORMAT(visit_date,'%Y-%m') AS month, COUNT(*) AS visits
    FROM visits WHERE visit_date >= DATE_SUB(CURDATE(),INTERVAL 11 MONTH)
    GROUP BY DATE_FORMAT(visit_date,'%Y-%m') ORDER BY month`);
  const [complaints] = await pool.query(`SELECT complaint AS name, COUNT(*) AS value FROM visits
    WHERE complaint IS NOT NULL AND complaint <> '' GROUP BY complaint ORDER BY value DESC LIMIT 8`);
  const [medicineUsage] = await pool.query(`SELECT m.generic_name AS name, SUM(mii.quantity) AS value
    FROM medicine_issuance_items mii JOIN medicines m ON m.id = mii.medicine_id
    JOIN medicine_issuances mi ON mi.id = mii.issuance_id WHERE mi.status = 'COMPLETED'
    GROUP BY m.id ORDER BY value DESC LIMIT 8`);
  const [population] = await pool.query(`SELECT patient_type AS name, COUNT(*) AS value FROM patients GROUP BY patient_type`);
  const [programs] = await pool.query(`SELECT program AS name, COUNT(*) AS value FROM students GROUP BY program ORDER BY value DESC LIMIT 10`);
  const [appointments] = await pool.query(`SELECT status AS name, COUNT(*) AS value FROM appointments
    WHERE requested_start >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) GROUP BY status ORDER BY value DESC`);
  const [recent] = await pool.query(`SELECT al.*, u.username FROM activity_logs al
    LEFT JOIN users u ON u.id = al.actor_user_id ORDER BY al.created_at DESC LIMIT 12`);
  return ok(res, { counts, daily, monthly, complaints, medicineUsage, population, programs, appointments, recent });
}));

router.get('/summary', asyncHandler(async (req, res) => {
  const dateFrom = req.query.dateFrom || '2000-01-01';
  const dateTo = req.query.dateTo || '2999-12-31';
  const patientType = req.query.patientType || null;
  const patientClause = patientType ? ' AND p.patient_type = ?' : '';
  const params = patientType ? [dateFrom, dateTo, patientType] : [dateFrom, dateTo];
  const [visits] = await pool.execute(
    `SELECT v.visit_date, v.visit_time, v.visit_number, v.visit_type, v.priority, v.complaint, v.status,
       ${patientIdentityColumns}, c.diagnosis, CONCAT_WS(' ', st.first_name, st.last_name) AS staff_name
     FROM visits v ${patientIdentityFrom('v.patient_id')}
     LEFT JOIN consultations c ON c.visit_id = v.id
     LEFT JOIN staff st ON st.id = v.registered_by
     WHERE v.visit_date BETWEEN ? AND ?${patientClause}
     ORDER BY v.visit_date DESC, v.visit_time DESC`, params);
  const [medicine] = await pool.execute(
    `SELECT DATE(mi.issued_at) AS issued_date, mi.issuance_number, ${patientIdentityColumns},
       m.generic_name, mii.quantity, m.unit, CONCAT_WS(' ', st.first_name, st.last_name) AS issued_by
     FROM medicine_issuances mi ${patientIdentityFrom('mi.patient_id')}
     JOIN medicine_issuance_items mii ON mii.issuance_id = mi.id
     JOIN medicines m ON m.id = mii.medicine_id
     JOIN staff st ON st.id = mi.issued_by
     WHERE DATE(mi.issued_at) BETWEEN ? AND ? AND mi.status = 'COMPLETED'${patientClause}
     ORDER BY mi.issued_at DESC`, params);
  const [staff] = await pool.execute(
    `SELECT CONCAT_WS(' ', st.first_name, st.last_name) AS name,
       COUNT(DISTINCT v.id) AS visits_handled, COUNT(DISTINCT c.id) AS consultations_handled,
       COUNT(DISTINCT CASE WHEN c.signed_off_at IS NOT NULL THEN c.id END) AS consultations_signed
     FROM staff st
     LEFT JOIN visits v ON v.registered_by = st.id AND v.visit_date BETWEEN ? AND ?
     LEFT JOIN consultations c ON (c.prepared_by_staff_id = st.id OR c.doctor_staff_id = st.id)
       AND DATE(c.created_at) BETWEEN ? AND ?
     GROUP BY st.id ORDER BY consultations_handled DESC, visits_handled DESC`,
    [dateFrom, dateTo, dateFrom, dateTo]);
  const [appointments] = await pool.execute(
    `SELECT DATE(COALESCE(confirmed_start, proposed_start, requested_start)) AS appointment_date,
       a.status, aps.name AS service_name, COUNT(*) AS total
     FROM appointments a JOIN appointment_services aps ON aps.id = a.service_id
     JOIN patients p ON p.id = a.patient_id
     WHERE DATE(COALESCE(confirmed_start, proposed_start, requested_start)) BETWEEN ? AND ?${patientType ? ' AND p.patient_type = ?' : ''}
     GROUP BY appointment_date, a.status, aps.name ORDER BY appointment_date DESC`,
    patientType ? [dateFrom, dateTo, patientType] : [dateFrom, dateTo]);
  const [expiry] = await pool.execute(
    `SELECT mb.expiration_date, mb.batch_number, mb.quantity, m.medicine_code, m.generic_name,
       m.brand_name, m.unit, m.archived_at,
       CASE
         WHEN mb.quantity = 0 THEN 'OUT_OF_STOCK'
         WHEN mb.expiration_date < CURDATE() THEN 'EXPIRED'
         WHEN mb.expiration_date <= DATE_ADD(CURDATE(), INTERVAL 60 DAY) THEN 'NEAR_EXPIRATION'
         ELSE 'AVAILABLE'
       END AS stock_status
     FROM medicine_batches mb
     JOIN medicines m ON m.id = mb.medicine_id
     WHERE mb.expiration_date BETWEEN ? AND ? AND m.is_active = 1 AND m.archived_at IS NULL
     ORDER BY mb.expiration_date, m.generic_name`,
    [dateFrom, dateTo]);
  return ok(res, { visits, medicine, staff, appointments, expiry });
}));

function csvEscape(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

router.get('/visits.csv', asyncHandler(async (req, res) => {
  const dateFrom = req.query.dateFrom || '2000-01-01';
  const dateTo = req.query.dateTo || '2999-12-31';
  const patientType = ['STUDENT','EMPLOYEE'].includes(String(req.query.patientType || '').toUpperCase())
    ? String(req.query.patientType).toUpperCase()
    : null;
  const [rows] = await pool.execute(
    `SELECT v.visit_date, v.visit_time, v.visit_number, p.patient_type, p.record_number,
       COALESCE(CONCAT_WS(' ',s.first_name,s.middle_name,s.last_name), CONCAT_WS(' ',e.first_name,e.middle_name,e.last_name)) AS patient_name,
       v.visit_type, v.priority, v.complaint, c.diagnosis, v.status
     FROM visits v ${patientIdentityFrom('v.patient_id')}
     LEFT JOIN consultations c ON c.visit_id = v.id
     WHERE v.visit_date BETWEEN ? AND ?${patientType ? ' AND p.patient_type = ?' : ''}
     ORDER BY v.visit_date DESC, v.visit_time DESC`,
    patientType ? [dateFrom, dateTo, patientType] : [dateFrom, dateTo]
  );
  const headers = ['Date','Time','Visit ID','Patient Type','Record Number','Patient Name','Visit Type','Priority','Complaint','Diagnosis','Status'];
  const keys = ['visit_date','visit_time','visit_number','patient_type','record_number','patient_name','visit_type','priority','complaint','diagnosis','status'];
  const csv = [headers.join(','), ...rows.map((row) => keys.map((key) => csvEscape(row[key])).join(','))].join('\n');
  await writeAudit({
    actorUserId: req.user.id, action: 'EXPORT_REPORT', entityType: 'reports',
    description: 'Exported the clinic visit report as CSV.', ipAddress: req.ip, request: req,
    metadata: { format: 'CSV', dateFrom, dateTo, patientType, rowCount: rows.length }
  });
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="kld-visits-${dateFrom}-to-${dateTo}.csv"`);
  res.send('\uFEFF' + csv);
}));

router.get('/visits.pdf', asyncHandler(async (req, res) => {
  const dateFrom = req.query.dateFrom || '2000-01-01';
  const dateTo = req.query.dateTo || '2999-12-31';
  const patientType = ['STUDENT','EMPLOYEE'].includes(String(req.query.patientType || '').toUpperCase())
    ? String(req.query.patientType).toUpperCase()
    : null;
  const [rows] = await pool.execute(
    `SELECT v.visit_date, v.visit_number, p.patient_type, p.record_number,
       COALESCE(CONCAT_WS(' ',s.first_name,s.middle_name,s.last_name), CONCAT_WS(' ',e.first_name,e.middle_name,e.last_name)) AS patient_name,
       v.complaint, c.diagnosis, v.status
     FROM visits v ${patientIdentityFrom('v.patient_id')}
     LEFT JOIN consultations c ON c.visit_id = v.id
     WHERE v.visit_date BETWEEN ? AND ?${patientType ? ' AND p.patient_type = ?' : ''}
     ORDER BY v.visit_date DESC LIMIT 500`,
    patientType ? [dateFrom, dateTo, patientType] : [dateFrom, dateTo]
  );
  await writeAudit({
    actorUserId: req.user.id, action: 'EXPORT_REPORT', entityType: 'reports',
    description: 'Exported the clinic visit report as PDF.', ipAddress: req.ip, request: req,
    metadata: { format: 'PDF', dateFrom, dateTo, patientType, rowCount: rows.length }
  });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="kld-visits-${dateFrom}-to-${dateTo}.pdf"`);
  const doc = new PDFDocument({ margin: 36, size: 'A4' });
  doc.pipe(res);
  doc.fontSize(18).text('KLD School Clinic — Visit Report');
  doc.fontSize(10).fillColor('#4A5568').text(`${dateFrom} to ${dateTo}`);
  doc.moveDown();
  rows.forEach((row, index) => {
    if (doc.y > 760) doc.addPage();
    doc.fillColor('#1A202C').fontSize(10).text(`${index + 1}. ${row.visit_date} • ${row.visit_number} • ${row.patient_type} • ${row.record_number} • ${row.patient_name}`);
    doc.fontSize(8).fillColor('#4A5568').text(`Complaint: ${row.complaint || '—'} | Diagnosis: ${row.diagnosis || '—'} | ${row.status}`);
    doc.moveDown(0.45);
  });
  doc.end();
}));

export default router;
