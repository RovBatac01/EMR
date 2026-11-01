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
import { getPatientForStudentUser, getPatientById, patientDisplayName } from '../services/patients/patientService.js';
import { enqueueEmail } from '../services/emailService.js';
import { env } from '../config/env.js';

const router = express.Router();
router.use(authenticate);

const activeStatuses = ['PENDING','CONFIRMED','PROPOSED','CHECKED_IN','IN_QUEUE','IN_CONSULTATION'];
const dateTimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/;
const appointmentBody = z.object({
  patientId: z.string().uuid().optional(),
  serviceId: z.string().uuid(),
  requestedStart: z.string().regex(dateTimeRegex),
  reason: z.string().trim().min(3).max(2000),
  idempotencyKey: z.string().trim().min(8).max(100).optional()
});

function toSqlDateTime(value) {
  return value.replace('T', ' ').length === 16 ? `${value.replace('T', ' ')}:00` : value.replace('T', ' ');
}

function parseTimeToMinutes(value) {
  const [h, m] = String(value).split(':').map(Number);
  return h * 60 + m;
}

function dateOnly(sqlDateTime) { return String(sqlDateTime).slice(0, 10); }
function timeOnly(sqlDateTime) { return String(sqlDateTime).slice(11, 16); }
function dayOfWeek(dateString) {
  const day = new Date(`${dateString}T12:00:00`).getDay();
  return day === 0 ? 7 : day;
}
function addMinutes(sqlDateTime, minutes) {
  const date = new Date(sqlDateTime.replace(' ', 'T'));
  date.setMinutes(date.getMinutes() + minutes);
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
}

async function resolvePatient(req, connection, submittedPatientId) {
  const patient = req.user.role_code === 'STUDENT'
    ? await getPatientForStudentUser(connection, req.user.id, { forUpdate: true })
    : submittedPatientId
      ? await getPatientById(connection, submittedPatientId, { forUpdate: true })
      : null;
  if (!patient) throw new AppError(422, 'Select a patient.');
  if (patient.archived_at) throw new AppError(409, 'This patient record is archived and cannot request new appointments.');
  if (patient.patient_status !== 'ACTIVE') throw new AppError(409, 'This patient record is inactive.');
  return patient;
}

async function loadSlotRules(connection, serviceId, start, { lock = true } = {}) {
  const [services] = await connection.execute(
    `SELECT * FROM appointment_services WHERE id=? AND is_active=1${lock ? ' FOR UPDATE' : ''}`,
    [serviceId]
  );
  if (!services.length) throw new AppError(404, 'Appointment service is unavailable.');
  const service = services[0];
  const date = dateOnly(start);
  const time = timeOnly(start);
  const [[timing]] = await connection.execute(
    `SELECT TIMESTAMPDIFF(MINUTE, NOW(), ?) AS notice_minutes,
            DATEDIFF(DATE(?), CURDATE()) AS days_ahead`,
    [start, start]
  );
  if (Number(timing.notice_minutes) < Number(service.minimum_notice_hours || 0) * 60) {
    throw new AppError(409, `Appointments for this service require at least ${service.minimum_notice_hours || 0} hour(s) notice.`);
  }
  if (Number(timing.days_ahead) > Number(service.advance_booking_days || 0)) {
    throw new AppError(409, `Appointments for this service may only be booked up to ${service.advance_booking_days || 0} day(s) ahead.`);
  }
  const [schedules] = await connection.execute(
    `SELECT * FROM clinic_schedules WHERE service_id=? AND day_of_week=? AND is_active=1 ORDER BY start_time${lock ? ' FOR UPDATE' : ''}`,
    [serviceId, dayOfWeek(date)]
  );
  const duration = Number(service.duration_minutes);
  const startMinutes = parseTimeToMinutes(time);
  const schedule = schedules.find((row) => startMinutes >= parseTimeToMinutes(row.start_time) && startMinutes + duration <= parseTimeToMinutes(row.end_time));
  if (!schedule) throw new AppError(409, 'The requested time is outside the configured clinic schedule.');
  const [blocked] = await connection.execute(
    `SELECT id FROM clinic_unavailable_dates
     WHERE unavailable_date=? AND (service_id IS NULL OR service_id=?)
       AND (start_time IS NULL OR (start_time<=? AND (end_time IS NULL OR end_time>?))) LIMIT 1${lock ? ' FOR UPDATE' : ''}`,
    [date, serviceId, `${time}:00`, `${time}:00`]
  );
  if (blocked.length) throw new AppError(409, 'The clinic is unavailable at the requested date and time.');
  const capacity = Number(schedule.slot_capacity || service.slot_capacity || 1);
  const dailyLimit = Number(schedule.booking_limit || service.daily_booking_limit || 0);
  return { service, schedule, capacity, dailyLimit, end: addMinutes(start, duration) };
}

async function assertSlotCapacity(connection, serviceId, start, ignoreAppointmentId = null) {
  const rules = await loadSlotRules(connection, serviceId, start, { lock: true });
  const placeholders = activeStatuses.map(() => '?').join(',');
  const params = [serviceId, ...activeStatuses, start, start, start];
  let ignore = '';
  if (ignoreAppointmentId) { ignore = ' AND id<>?'; params.push(ignoreAppointmentId); }
  const [slotCount] = await connection.execute(
    `SELECT COUNT(*) AS total FROM appointments
     WHERE service_id=? AND status IN (${placeholders})
       AND COALESCE(confirmed_start,proposed_start,requested_start)=?${ignore}`,
    [serviceId, ...activeStatuses, start, ...(ignoreAppointmentId ? [ignoreAppointmentId] : [])]
  );
  if (Number(slotCount[0].total) >= rules.capacity) throw new AppError(409, 'The selected appointment slot is already full.');
  if (rules.dailyLimit > 0) {
    const dailyParams = [serviceId, ...activeStatuses, `${dateOnly(start)} 00:00:00`, `${dateOnly(start)} 23:59:59`];
    if (ignoreAppointmentId) dailyParams.push(ignoreAppointmentId);
    const [dailyCount] = await connection.execute(
      `SELECT COUNT(*) AS total FROM appointments
       WHERE service_id=? AND status IN (${placeholders})
         AND COALESCE(confirmed_start,proposed_start,requested_start) BETWEEN ? AND ?${ignore}`,
      dailyParams
    );
    if (Number(dailyCount[0].total) >= rules.dailyLimit) throw new AppError(409, 'The service has reached its booking limit for that date.');
  }
  return rules;
}


async function scheduleAppointmentReminders(connection, appointmentId, start) {
  const reminderRows = [
    ['ONE_DAY', 'IN_APP', '1 DAY'],
    ['ONE_DAY', 'EMAIL', '1 DAY'],
    ['TWO_HOUR', 'IN_APP', '2 HOUR'],
    ['TWO_HOUR', 'EMAIL', '2 HOUR']
  ];
  for (const [reminderType, channel, interval] of reminderRows) {
    await connection.execute(
      `INSERT INTO appointment_reminders
       (id,appointment_id,reminder_type,channel,status,scheduled_for)
       VALUES (?,?,?,?, 'PENDING', DATE_SUB(?, INTERVAL ${interval}))
       ON DUPLICATE KEY UPDATE status='PENDING',scheduled_for=VALUES(scheduled_for),sent_at=NULL`,
      [uuid(), appointmentId, reminderType, channel, start]
    );
  }
}

async function patientContact(connection, patientId) {
  const [rows] = await connection.execute(
    `SELECT p.patient_type,p.record_number,
      COALESCE(s.first_name,e.first_name) first_name,
      COALESCE(s.last_name,e.last_name) last_name,
      COALESCE(s.registered_email,e.email) email,
      sa.user_id
     FROM patients p LEFT JOIN students s ON s.id=p.student_id LEFT JOIN employees e ON e.id=p.employee_id
     LEFT JOIN student_accounts sa ON sa.student_id=p.student_id WHERE p.id=?`, [patientId]
  );
  return rows[0] || {};
}

async function queueAppointmentNotification(appointmentId, type, message, actionUrl = '/student/appointments') {
  const [rows] = await pool.execute(
    `SELECT a.*,aps.name service_name,p.patient_type,p.record_number,
      COALESCE(s.first_name,e.first_name) first_name,COALESCE(s.registered_email,e.email) email,sa.user_id
     FROM appointments a JOIN appointment_services aps ON aps.id=a.service_id JOIN patients p ON p.id=a.patient_id
     LEFT JOIN students s ON s.id=p.student_id LEFT JOIN employees e ON e.id=p.employee_id LEFT JOIN student_accounts sa ON sa.student_id=p.student_id
     WHERE a.id=?`, [appointmentId]
  );
  if (!rows.length) return;
  const row = rows[0];
  if (row.user_id) {
    await pool.execute(
      `INSERT INTO notifications (id,user_id,patient_id,notification_type,severity,title,message,link)
       VALUES (?,?,?,?, 'INFO',?,?,?)`,
      [uuid(), row.user_id, row.patient_id, `APPOINTMENT_${type}`, `Appointment ${type.toLowerCase()}`, message, actionUrl]
    );
  }
  if (row.email) {
    await enqueueEmail({
      recipient: row.email,
      subject: `KLD Clinic appointment ${type.toLowerCase()}`,
      template: 'APPOINTMENT_UPDATE',
      payload: { title: `Appointment ${type.toLowerCase()}`, message: `<p>${message}</p>`, actionUrl: `${env.APP_URL}${actionUrl}`, actionLabel: 'View appointment' },
      relatedType: 'appointments', relatedId: appointmentId
    });
  }
}

router.get('/services', asyncHandler(async (_req, res) => {
  const [rows] = await pool.query('SELECT * FROM appointment_services WHERE is_active=1 ORDER BY sort_order,name');
  return ok(res, rows);
}));

router.get('/availability', asyncHandler(async (req, res) => {
  const serviceId = String(req.query.serviceId || '');
  const date = String(req.query.date || '');
  if (!z.string().uuid().safeParse(serviceId).success || !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new AppError(422, 'Select a valid service and date.');
  const connection = await pool.getConnection();
  try {
    const [services] = await connection.execute('SELECT * FROM appointment_services WHERE id=? AND is_active=1', [serviceId]);
    if (!services.length) throw new AppError(404, 'Appointment service is unavailable.');
    const service = services[0];
    const [[window]] = await connection.execute(
      `SELECT DATEDIFF(?, CURDATE()) AS days_ahead,
              DATE_FORMAT(DATE_ADD(NOW(), INTERVAL ? HOUR), '%Y-%m-%d %H:%i:%s') AS minimum_start`,
      [date, Number(service.minimum_notice_hours || 0)]
    );
    if (Number(window.days_ahead) < 0 || Number(window.days_ahead) > Number(service.advance_booking_days || 0)) {
      return ok(res, { service, date, slots: [], message: `Choose a date within the next ${service.advance_booking_days || 0} day(s).` });
    }
    const [schedules] = await connection.execute('SELECT * FROM clinic_schedules WHERE service_id=? AND day_of_week=? AND is_active=1 ORDER BY start_time', [serviceId, dayOfWeek(date)]);
    const [blocked] = await connection.execute('SELECT * FROM clinic_unavailable_dates WHERE unavailable_date=? AND (service_id IS NULL OR service_id=?)', [date, serviceId]);
    const [bookings] = await connection.execute(
      `SELECT DATE_FORMAT(COALESCE(confirmed_start,proposed_start,requested_start), '%Y-%m-%d %H:%i:%s') slot_start, COUNT(*) total
       FROM appointments
       WHERE service_id=? AND status IN ('PENDING','CONFIRMED','PROPOSED','CHECKED_IN','IN_QUEUE','IN_CONSULTATION')
         AND DATE(COALESCE(confirmed_start,proposed_start,requested_start))=?
       GROUP BY COALESCE(confirmed_start,proposed_start,requested_start)`,
      [serviceId, date]
    );
    const bookedByStart = new Map(bookings.map((row) => [row.slot_start, Number(row.total)]));
    const dailyBooked = bookings.reduce((sum, row) => sum + Number(row.total), 0);
    const slots = [];
    for (const schedule of schedules) {
      for (let minute = parseTimeToMinutes(schedule.start_time); minute + Number(service.duration_minutes) <= parseTimeToMinutes(schedule.end_time); minute += Number(service.duration_minutes)) {
        const h = String(Math.floor(minute / 60)).padStart(2, '0');
        const m = String(minute % 60).padStart(2, '0');
        const start = `${date} ${h}:${m}:00`;
        if (start < window.minimum_start) continue;
        if (blocked.some((b) => !b.start_time || (parseTimeToMinutes(b.start_time) <= minute && (!b.end_time || parseTimeToMinutes(b.end_time) > minute)))) continue;
        const capacity = Number(schedule.slot_capacity || service.slot_capacity || 1);
        const booked = bookedByStart.get(start) || 0;
        const dailyLimit = Number(schedule.booking_limit || service.daily_booking_limit || 0);
        const dailyRemaining = dailyLimit > 0 ? Math.max(0, dailyLimit - dailyBooked) : capacity;
        slots.push({
          start: start.replace(' ', 'T').slice(0, 16),
          end: addMinutes(start, service.duration_minutes).replace(' ', 'T').slice(0, 16),
          capacity,
          booked,
          available: Math.min(Math.max(0, capacity - booked), dailyRemaining)
        });
      }
    }
    return ok(res, { service, date, slots });
  } finally { connection.release(); }
}));

router.get('/', authorize('appointments.read', 'appointments.write'), asyncHandler(async (req, res) => {
  const { page, limit, offset } = paginationFromQuery(req.query);
  const clauses = ['1=1']; const params = [];
  if (req.user.role_code === 'STUDENT') {
    const patient = await getPatientForStudentUser(pool, req.user.id);
    clauses.push('a.patient_id=?'); params.push(patient.patient_id);
  } else {
    if (req.query.status) { clauses.push('a.status=?'); params.push(req.query.status); }
    if (req.query.dateFrom) { clauses.push('DATE(COALESCE(a.confirmed_start,a.proposed_start,a.requested_start))>=?'); params.push(req.query.dateFrom); }
    if (req.query.dateTo) { clauses.push('DATE(COALESCE(a.confirmed_start,a.proposed_start,a.requested_start))<=?'); params.push(req.query.dateTo); }
    if (req.query.serviceId) { clauses.push('a.service_id=?'); params.push(req.query.serviceId); }
    if (req.query.patientId) { clauses.push('a.patient_id=?'); params.push(req.query.patientId); }
  }
  const where = clauses.join(' AND ');
  const [counts] = await pool.execute(`SELECT COUNT(*) total FROM appointments a WHERE ${where}`, params);
  const [rows] = await pool.execute(
    `SELECT a.*,aps.name service_name,p.patient_type,p.record_number,
      COALESCE(s.student_number,e.employee_number) patient_number,
      CONCAT_WS(' ',COALESCE(s.first_name,e.first_name),COALESCE(s.middle_name,e.middle_name),COALESCE(s.last_name,e.last_name)) patient_name,
      v.visit_number,q.queue_number,q.status queue_status
     FROM appointments a JOIN appointment_services aps ON aps.id=a.service_id JOIN patients p ON p.id=a.patient_id
     LEFT JOIN students s ON s.id=p.student_id LEFT JOIN employees e ON e.id=p.employee_id
     LEFT JOIN visits v ON v.id=a.visit_id LEFT JOIN clinic_queue_entries q ON q.appointment_id=a.id
     WHERE ${where} ORDER BY COALESCE(a.confirmed_start,a.proposed_start,a.requested_start) DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  return ok(res, rows, 'Appointments loaded.', paginationMeta(counts[0].total, page, limit));
}));

router.post('/', authorize('appointments.write'), requireCsrf, validate(z.object({ body: appointmentBody, params: z.object({}), query: z.object({}) })), asyncHandler(async (req, res) => {
  const data = req.validated.body;
  const requestedStart = toSqlDateTime(data.requestedStart);
  const id = uuid(); const number = reference('APT');
  let patient; let result = null; let isNew = false;
  await withTransaction(async (connection) => {
    if (data.idempotencyKey) {
      const [existing] = await connection.execute(
        'SELECT id, appointment_number FROM appointments WHERE idempotency_key=? FOR UPDATE',
        [data.idempotencyKey]
      );
      if (existing.length) {
        result = { id: existing[0].id, appointmentNumber: existing[0].appointment_number };
        return;
      }
    }
    patient = await resolvePatient(req, connection, data.patientId);
    const rules = await assertSlotCapacity(connection, data.serviceId, requestedStart);
    const [duplicate] = await connection.execute(
      `SELECT id,appointment_number FROM appointments WHERE patient_id=? AND service_id=?
       AND COALESCE(confirmed_start,proposed_start,requested_start)=? AND status IN ('PENDING','CONFIRMED','PROPOSED','CHECKED_IN','IN_QUEUE','IN_CONSULTATION') FOR UPDATE`,
      [patient.patient_id, data.serviceId, requestedStart]
    );
    if (duplicate.length) throw new AppError(409, `An active appointment already exists for this patient and time (${duplicate[0].appointment_number}).`);
    await connection.execute(
      `INSERT INTO appointments
       (id,appointment_number,patient_id,service_id,requested_start,requested_end,reason,status,requested_by_user_id,idempotency_key)
       VALUES (?,?,?,?,?,?,?,'PENDING',?,?)`,
      [id, number, patient.patient_id, data.serviceId, requestedStart, rules.end, data.reason, req.user.id, data.idempotencyKey || null]
    );
    await connection.execute(
      `INSERT INTO appointment_status_history (id,appointment_id,from_status,to_status,changed_by_user_id,reason) VALUES (?,?,NULL,'PENDING',?,?)`,
      [uuid(), id, req.user.id, 'Appointment requested']
    );
    await writeAudit({ actorUserId: req.user.id, action: 'CREATE_APPOINTMENT', entityType: 'appointments', entityId: id, description: `Requested appointment ${number} for ${patient.record_number}.`, ipAddress: req.ip, request: req, connection });
    result = { id, appointmentNumber: number };
    isNew = true;
  });
  if (isNew) await queueAppointmentNotification(result.id, 'REQUESTED', `Your appointment request ${result.appointmentNumber} was submitted and is awaiting clinic confirmation.`);
  return isNew
    ? created(res, result, 'Appointment request submitted.')
    : ok(res, result, 'This appointment request was already submitted.');
}));

const statusBody = z.object({
  action: z.enum(['CONFIRM','PROPOSE','DECLINE','CANCEL','NO_SHOW','COMPLETE']),
  proposedStart: z.string().regex(dateTimeRegex).optional(),
  reason: z.string().trim().max(1000).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable()
});

router.patch('/:id/status', authorize('appointments.manage'), requireCsrf, validate(z.object({ body: statusBody, params: z.object({ id: z.string().uuid() }), query: z.object({}) })), asyncHandler(async (req, res) => {
  const data = req.validated.body;
  let nextStatus; let message; let notificationType;
  await withTransaction(async (connection) => {
    const [rows] = await connection.execute('SELECT * FROM appointments WHERE id=? FOR UPDATE', [req.params.id]);
    if (!rows.length) throw new AppError(404, 'Appointment not found.');
    const current = rows[0];
    if (['COMPLETED','CANCELLED','DECLINED','NO_SHOW'].includes(current.status)) throw new AppError(409, 'This appointment is already closed.');
    if (data.action === 'CONFIRM') {
      await assertSlotCapacity(connection, current.service_id, current.requested_start, current.id);
      nextStatus = 'CONFIRMED'; message = 'Appointment confirmed.'; notificationType = 'CONFIRMED';
      await connection.execute("UPDATE appointments SET status='CONFIRMED',confirmed_start=requested_start,confirmed_end=requested_end,reviewed_by_user_id=?,staff_notes=?,updated_at=NOW() WHERE id=?", [req.user.id, data.notes || null, current.id]);
      await scheduleAppointmentReminders(connection, current.id, current.requested_start);
    } else if (data.action === 'PROPOSE') {
      if (!data.proposedStart) throw new AppError(422, 'Select the proposed appointment date and time.');
      const start = toSqlDateTime(data.proposedStart);
      const rules = await assertSlotCapacity(connection, current.service_id, start, current.id);
      nextStatus = 'PROPOSED'; message = 'Alternative appointment schedule proposed.'; notificationType = 'CHANGED';
      await connection.execute("UPDATE appointments SET status='PROPOSED',proposed_start=?,proposed_end=?,student_response='PENDING',reviewed_by_user_id=?,staff_notes=?,updated_at=NOW() WHERE id=?", [start, rules.end, req.user.id, data.notes || null, current.id]);
    } else if (data.action === 'DECLINE') {
      nextStatus = 'DECLINED'; message = 'Appointment request declined.'; notificationType = 'DECLINED';
      await connection.execute("UPDATE appointments SET status='DECLINED',cancellation_reason=?,reviewed_by_user_id=?,cancelled_at=NOW(),updated_at=NOW() WHERE id=?", [data.reason || 'Declined by clinic staff', req.user.id, current.id]);
    } else if (data.action === 'CANCEL') {
      nextStatus = 'CANCELLED'; message = 'Appointment cancelled.'; notificationType = 'CANCELLED';
      await connection.execute("UPDATE appointments SET status='CANCELLED',cancellation_reason=?,reviewed_by_user_id=?,cancelled_at=NOW(),updated_at=NOW() WHERE id=?", [data.reason || 'Cancelled by clinic staff', req.user.id, current.id]);
    } else if (data.action === 'NO_SHOW') {
      nextStatus = 'NO_SHOW'; message = 'Appointment marked as no-show.'; notificationType = 'NO_SHOW';
      await connection.execute("UPDATE appointments SET status='NO_SHOW',no_show_reason=?,reviewed_by_user_id=?,no_show_at=NOW(),updated_at=NOW() WHERE id=?", [data.reason || 'Patient did not arrive', req.user.id, current.id]);
    } else {
      nextStatus = 'COMPLETED'; message = 'Appointment completed.'; notificationType = 'COMPLETED';
      await connection.execute("UPDATE appointments SET status='COMPLETED',reviewed_by_user_id=?,completed_at=NOW(),updated_at=NOW() WHERE id=?", [req.user.id, current.id]);
    }
    await connection.execute('INSERT INTO appointment_status_history (id,appointment_id,from_status,to_status,changed_by_user_id,reason,metadata_json) VALUES (?,?,?,?,?,?,?)', [uuid(), current.id, current.status, nextStatus, req.user.id, data.reason || null, JSON.stringify({ notes: data.notes || null })]);
    await writeAudit({ actorUserId: req.user.id, action: `APPOINTMENT_${nextStatus}`, entityType: 'appointments', entityId: current.id, description: `${message} ${current.appointment_number}`, ipAddress: req.ip, request: req, connection });
  });
  await queueAppointmentNotification(req.params.id, notificationType, `${message} Open the portal to review the schedule.`);
  return ok(res, { id: req.params.id, status: nextStatus }, message);
}));

router.post('/:id/respond', authorize('appointments.write'), requireCsrf, validate(z.object({ body: z.object({ response: z.enum(['ACCEPT','DECLINE']), reason: z.string().max(1000).optional().nullable() }), params: z.object({ id: z.string().uuid() }), query: z.object({}) })), asyncHandler(async (req, res) => {
  const patient = await getPatientForStudentUser(pool, req.user.id);
  let status;
  await withTransaction(async (connection) => {
    const [rows] = await connection.execute("SELECT * FROM appointments WHERE id=? AND patient_id=? FOR UPDATE", [req.params.id, patient.patient_id]);
    if (!rows.length) throw new AppError(404, 'Appointment not found.');
    if (rows[0].status !== 'PROPOSED' || !rows[0].proposed_start) throw new AppError(409, 'This appointment has no pending alternative schedule.');
    if (req.validated.body.response === 'ACCEPT') {
      await assertSlotCapacity(connection, rows[0].service_id, rows[0].proposed_start, rows[0].id);
      status = 'CONFIRMED';
      await connection.execute("UPDATE appointments SET status='CONFIRMED',student_response='ACCEPTED',confirmed_start=proposed_start,confirmed_end=proposed_end,updated_at=NOW() WHERE id=?", [rows[0].id]);
      await scheduleAppointmentReminders(connection, rows[0].id, rows[0].proposed_start);
    } else {
      status = 'CANCELLED';
      await connection.execute("UPDATE appointments SET status='CANCELLED',student_response='DECLINED',cancellation_reason=?,cancelled_at=NOW(),updated_at=NOW() WHERE id=?", [req.validated.body.reason || 'Student declined the alternative schedule', rows[0].id]);
    }
    await connection.execute('INSERT INTO appointment_status_history (id,appointment_id,from_status,to_status,changed_by_user_id,reason) VALUES (?,?,?,?,?,?)', [uuid(), rows[0].id, rows[0].status, status, req.user.id, req.validated.body.reason || null]);
    await writeAudit({ actorUserId: req.user.id, action: `APPOINTMENT_${status}`, entityType: 'appointments', entityId: rows[0].id, description: `Student ${req.validated.body.response.toLowerCase()}ed the proposed appointment schedule.`, ipAddress: req.ip, request: req, connection });
  });
  return ok(res, { id: req.params.id, status }, status === 'CONFIRMED' ? 'Alternative schedule accepted.' : 'Alternative schedule declined.');
}));

router.post('/:id/cancel', authorize('appointments.write'), requireCsrf, validate(z.object({
  body: z.object({ reason: z.string().trim().min(3).max(1000) }),
  params: z.object({ id: z.string().uuid() }), query: z.object({})
})), asyncHandler(async (req, res) => {
  if (req.user.role_code !== 'STUDENT') throw new AppError(403, 'Use the staff appointment workflow to cancel this appointment.');
  const patient = await getPatientForStudentUser(pool, req.user.id);
  await withTransaction(async (connection) => {
    const [rows] = await connection.execute('SELECT * FROM appointments WHERE id=? AND patient_id=? FOR UPDATE', [req.params.id, patient.patient_id]);
    if (!rows.length) throw new AppError(404, 'Appointment not found.');
    const current = rows[0];
    if (!['PENDING','CONFIRMED','PROPOSED'].includes(current.status)) throw new AppError(409, 'This appointment can no longer be cancelled from the portal.');
    await connection.execute("UPDATE appointments SET status='CANCELLED',cancellation_reason=?,cancelled_at=NOW(),updated_at=NOW() WHERE id=?", [req.validated.body.reason, current.id]);
    await connection.execute("UPDATE appointment_reminders SET status='SKIPPED' WHERE appointment_id=? AND status='PENDING'", [current.id]);
    await connection.execute('INSERT INTO appointment_status_history (id,appointment_id,from_status,to_status,changed_by_user_id,reason) VALUES (?,?,?,?,?,?)', [uuid(), current.id, current.status, 'CANCELLED', req.user.id, req.validated.body.reason]);
    await writeAudit({ actorUserId: req.user.id, action: 'APPOINTMENT_CANCELLED', entityType: 'appointments', entityId: current.id, description: `Student cancelled appointment ${current.appointment_number}.`, ipAddress: req.ip, request: req, connection });
  });
  await queueAppointmentNotification(req.params.id, 'CANCELLED', 'Your clinic appointment was cancelled from the student portal.');
  return ok(res, { id: req.params.id, status: 'CANCELLED' }, 'Appointment cancelled.');
}));

router.post('/:id/check-in', authorize('appointments.manage'), requireCsrf, asyncHandler(async (req, res) => {
  if (!req.user.staff_id) throw new AppError(403, 'A clinic staff profile is required to check in a patient.');
  let result;
  await withTransaction(async (connection) => {
    const [rows] = await connection.execute(
      `SELECT a.*,aps.name service_name,p.student_id FROM appointments a JOIN appointment_services aps ON aps.id=a.service_id JOIN patients p ON p.id=a.patient_id WHERE a.id=? FOR UPDATE`,
      [req.params.id]
    );
    if (!rows.length) throw new AppError(404, 'Appointment not found.');
    const appointment = rows[0];
    if (!['CONFIRMED','CHECKED_IN','IN_QUEUE'].includes(appointment.status)) throw new AppError(409, 'Only a confirmed appointment can be checked in.');
    if (appointment.visit_id) {
      const [existing] = await connection.execute('SELECT q.id queue_id,q.queue_number,q.status queue_status,v.id visit_id,v.visit_number FROM visits v LEFT JOIN clinic_queue_entries q ON q.visit_id=v.id WHERE v.id=?', [appointment.visit_id]);
      result = existing[0];
      return;
    }
    const visitId = uuid(); const visitNumber = reference('VIS');
    const scheduled = appointment.confirmed_start || appointment.requested_start;
    await connection.execute(
      `INSERT INTO visits (id,visit_number,patient_id,student_id,visit_date,visit_time,visit_type,reason,complaint,priority,notes,status,registered_by)
       VALUES (?,?,?,?,DATE(?),TIME(?),'OTHER',?,?, 'NORMAL',?,'REGISTERED',?)`,
      [visitId, visitNumber, appointment.patient_id, appointment.student_id, scheduled, scheduled, `Appointment: ${appointment.service_name}`, appointment.reason, `Created from appointment ${appointment.appointment_number}`, req.user.staff_id]
    );
    const [[clock]] = await connection.query("SELECT DATE_FORMAT(CURDATE(), '%Y-%m-%d') AS queue_date");
    const queueDate = clock.queue_date;
    await connection.execute('INSERT INTO queue_daily_counters (queue_date,last_number) VALUES (?,1) ON DUPLICATE KEY UPDATE last_number=last_number+1', [queueDate]);
    const [[counter]] = await connection.execute('SELECT last_number FROM queue_daily_counters WHERE queue_date=? FOR UPDATE', [queueDate]);
    const queueId = uuid();
    await connection.execute(
      `INSERT INTO clinic_queue_entries (id,queue_date,queue_number,patient_id,appointment_id,visit_id,priority,status,checked_in_by,checked_in_at)
       VALUES (?,?,?,?,?,?, 'NORMAL','WAITING',?,NOW())`,
      [queueId, queueDate, counter.last_number, appointment.patient_id, appointment.id, visitId, req.user.id]
    );
    await connection.execute("UPDATE appointments SET status='IN_QUEUE',visit_id=?,checked_in_at=NOW(),updated_at=NOW() WHERE id=?", [visitId, appointment.id]);
    await connection.execute('INSERT INTO appointment_status_history (id,appointment_id,from_status,to_status,changed_by_user_id,reason) VALUES (?,?,?,?,?,?)', [uuid(), appointment.id, appointment.status, 'IN_QUEUE', req.user.id, 'Patient checked in']);
    await writeAudit({ actorUserId: req.user.id, action: 'APPOINTMENT_CHECK_IN', entityType: 'appointments', entityId: appointment.id, description: `Checked in ${appointment.appointment_number} as queue ${counter.last_number}.`, ipAddress: req.ip, request: req, connection });
    result = { queueId, queueNumber: counter.last_number, queueStatus: 'WAITING', visitId, visitNumber };
  });
  return ok(res, result, result?.queueId ? 'Patient checked in and added to the queue.' : 'Patient was already checked in.');
}));

// Administrative schedule configuration.
router.get('/admin/schedules', authorize('appointments.manage'), asyncHandler(async (_req, res) => {
  const [services] = await pool.query('SELECT * FROM appointment_services ORDER BY sort_order,name');
  const [schedules] = await pool.query('SELECT cs.*,aps.name service_name FROM clinic_schedules cs JOIN appointment_services aps ON aps.id=cs.service_id ORDER BY aps.name,cs.day_of_week,cs.start_time');
  const [unavailable] = await pool.query('SELECT cud.*,aps.name service_name FROM clinic_unavailable_dates cud LEFT JOIN appointment_services aps ON aps.id=cud.service_id ORDER BY unavailable_date DESC');
  return ok(res, { services, schedules, unavailable });
}));

router.post('/admin/services', authorize('appointments.manage'), requireCsrf, validate(z.object({ body: z.object({ name:z.string().trim().min(2).max(180), description:z.string().max(2000).optional().nullable(), durationMinutes:z.coerce.number().int().min(5).max(480), slotCapacity:z.coerce.number().int().min(1).max(100), dailyBookingLimit:z.coerce.number().int().min(1).max(1000).optional().nullable(), advanceBookingDays:z.coerce.number().int().min(1).max(365).default(30), minimumNoticeHours:z.coerce.number().int().min(0).max(720).default(1), isPublic:z.boolean().default(true) }), params:z.object({}), query:z.object({}) })), asyncHandler(async (req,res) => {
  const id=uuid(); const d=req.validated.body;
  await pool.execute('INSERT INTO appointment_services (id,name,description,duration_minutes,slot_capacity,daily_booking_limit,advance_booking_days,minimum_notice_hours,is_active,is_public) VALUES (?,?,?,?,?,?,?,?,1,?)',[id,d.name,d.description||null,d.durationMinutes,d.slotCapacity,d.dailyBookingLimit||null,d.advanceBookingDays,d.minimumNoticeHours,d.isPublic?1:0]);
  await writeAudit({actorUserId:req.user.id,action:'CREATE_APPOINTMENT_SERVICE',entityType:'appointment_services',entityId:id,description:`Created appointment service ${d.name}.`,ipAddress:req.ip,request:req});
  return created(res,{id},'Appointment service created.');
}));

router.post('/admin/schedules', authorize('appointments.manage'), requireCsrf, validate(z.object({ body:z.object({ serviceId:z.string().uuid(), dayOfWeek:z.coerce.number().int().min(1).max(7), startTime:z.string().regex(/^\d{2}:\d{2}$/), endTime:z.string().regex(/^\d{2}:\d{2}$/), slotCapacity:z.coerce.number().int().min(1).max(100).optional().nullable(), bookingLimit:z.coerce.number().int().min(1).max(1000).optional().nullable() }), params:z.object({}), query:z.object({}) })), asyncHandler(async(req,res)=>{
  const d=req.validated.body;if(parseTimeToMinutes(d.startTime)>=parseTimeToMinutes(d.endTime))throw new AppError(422,'End time must be later than start time.');const id=uuid();
  await pool.execute('INSERT INTO clinic_schedules (id,service_id,day_of_week,start_time,end_time,slot_capacity,booking_limit,is_active) VALUES (?,?,?,?,?,?,?,1)',[id,d.serviceId,d.dayOfWeek,`${d.startTime}:00`,`${d.endTime}:00`,d.slotCapacity||null,d.bookingLimit||null]);
  return created(res,{id},'Clinic schedule created.');
}));

router.post('/admin/unavailable-dates', authorize('appointments.manage'), requireCsrf, validate(z.object({ body:z.object({ serviceId:z.string().uuid().optional().nullable(), unavailableDate:z.string().regex(/^\d{4}-\d{2}-\d{2}$/), startTime:z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(), endTime:z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(), reason:z.string().trim().min(3).max(500) }), params:z.object({}), query:z.object({}) })), asyncHandler(async(req,res)=>{
  const d=req.validated.body;const id=uuid();await pool.execute('INSERT INTO clinic_unavailable_dates (id,service_id,unavailable_date,start_time,end_time,reason,created_by) VALUES (?,?,?,?,?,?,?)',[id,d.serviceId||null,d.unavailableDate,d.startTime?`${d.startTime}:00`:null,d.endTime?`${d.endTime}:00`:null,d.reason,req.user.id]);return created(res,{id},'Unavailable date added.');
}));


router.patch('/admin/services/:id', authorize('appointments.manage'), requireCsrf, validate(z.object({
  body: z.object({
    name:z.string().trim().min(2).max(180).optional(), description:z.string().max(2000).optional().nullable(),
    durationMinutes:z.coerce.number().int().min(5).max(480).optional(), slotCapacity:z.coerce.number().int().min(1).max(100).optional(),
    dailyBookingLimit:z.preprocess(v=>v===''?null:v,z.coerce.number().int().min(1).max(1000).nullable().optional()),
    advanceBookingDays:z.coerce.number().int().min(1).max(365).optional(), minimumNoticeHours:z.coerce.number().int().min(0).max(720).optional(),
    isPublic:z.boolean().optional(), isActive:z.boolean().optional(), sortOrder:z.coerce.number().int().optional()
  }), params:z.object({id:z.string().uuid()}), query:z.object({})
})), asyncHandler(async(req,res)=>{
  const map={name:'name',description:'description',durationMinutes:'duration_minutes',slotCapacity:'slot_capacity',dailyBookingLimit:'daily_booking_limit',advanceBookingDays:'advance_booking_days',minimumNoticeHours:'minimum_notice_hours',isPublic:'is_public',isActive:'is_active',sortOrder:'sort_order'};
  const sets=[];const params=[];
  for(const [key,column] of Object.entries(map)) if(Object.hasOwn(req.validated.body,key)){sets.push(`${column}=?`);const value=req.validated.body[key];params.push(typeof value==='boolean'?(value?1:0):(value??null));}
  if(!sets.length)return ok(res,{id:req.params.id},'No changes submitted.');params.push(req.params.id);
  const[result]=await pool.execute(`UPDATE appointment_services SET ${sets.join(',')},updated_at=NOW() WHERE id=?`,params);if(!result.affectedRows)throw new AppError(404,'Appointment service not found.');
  await writeAudit({actorUserId:req.user.id,action:'UPDATE_APPOINTMENT_SERVICE',entityType:'appointment_services',entityId:req.params.id,description:'Updated an appointment service.',ipAddress:req.ip,metadata:{fields:Object.keys(req.validated.body)},request:req});
  return ok(res,{id:req.params.id},'Appointment service updated.');
}));

router.patch('/admin/schedules/:id', authorize('appointments.manage'), requireCsrf, validate(z.object({
  body:z.object({dayOfWeek:z.coerce.number().int().min(1).max(7).optional(),startTime:z.string().regex(/^\d{2}:\d{2}$/).optional(),endTime:z.string().regex(/^\d{2}:\d{2}$/).optional(),slotCapacity:z.preprocess(v=>v===''?null:v,z.coerce.number().int().min(1).max(100).nullable().optional()),bookingLimit:z.preprocess(v=>v===''?null:v,z.coerce.number().int().min(1).max(1000).nullable().optional()),isActive:z.boolean().optional()}),
  params:z.object({id:z.string().uuid()}),query:z.object({})
})),asyncHandler(async(req,res)=>{
  const d=req.validated.body;if(d.startTime&&d.endTime&&parseTimeToMinutes(d.startTime)>=parseTimeToMinutes(d.endTime))throw new AppError(422,'End time must be later than start time.');
  const map={dayOfWeek:'day_of_week',startTime:'start_time',endTime:'end_time',slotCapacity:'slot_capacity',bookingLimit:'booking_limit',isActive:'is_active'};const sets=[];const params=[];
  for(const[key,column]of Object.entries(map))if(Object.hasOwn(d,key)){sets.push(`${column}=?`);let value=d[key];if(['startTime','endTime'].includes(key)&&value)value=`${value}:00`;if(typeof value==='boolean')value=value?1:0;params.push(value??null);}
  if(!sets.length)return ok(res,{id:req.params.id},'No changes submitted.');params.push(req.params.id);const[result]=await pool.execute(`UPDATE clinic_schedules SET ${sets.join(',')},updated_at=NOW() WHERE id=?`,params);if(!result.affectedRows)throw new AppError(404,'Clinic schedule not found.');return ok(res,{id:req.params.id},'Clinic schedule updated.');
}));

router.delete('/admin/schedules/:id', authorize('appointments.manage'), requireCsrf, asyncHandler(async(req,res)=>{
  const[result]=await pool.execute('UPDATE clinic_schedules SET is_active=0,updated_at=NOW() WHERE id=?',[req.params.id]);if(!result.affectedRows)throw new AppError(404,'Clinic schedule not found.');return ok(res,null,'Clinic schedule deactivated.');
}));

router.delete('/admin/unavailable-dates/:id', authorize('appointments.manage'), requireCsrf, asyncHandler(async(req,res)=>{
  const[result]=await pool.execute('DELETE FROM clinic_unavailable_dates WHERE id=?',[req.params.id]);if(!result.affectedRows)throw new AppError(404,'Unavailable date not found.');return ok(res,null,'Unavailable date removed.');
}));

export default router;
