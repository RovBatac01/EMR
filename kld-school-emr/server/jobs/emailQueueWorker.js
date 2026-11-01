import { pool, withTransaction } from '../config/db.js';
import { env } from '../config/env.js';
import { deliverQueuedEmail, enqueueEmail } from '../services/emailService.js';
import { uuid } from '../utils/ids.js';

let timer;
let running = false;

function appointmentReminderMessage(row) {
  const scheduled = row.confirmed_start || row.proposed_start || row.requested_start;
  const when = new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'medium', timeStyle: 'short', timeZone: env.DB_TIMEZONE === '+08:00' ? 'Asia/Manila' : undefined
  }).format(new Date(scheduled));
  return row.reminder_type === 'TWO_HOUR'
    ? `Your ${row.service_name} appointment is scheduled in approximately two hours (${when}).`
    : `Reminder: your ${row.service_name} appointment is scheduled for ${when}.`;
}

async function dispatchAppointmentReminders() {
  const [rows] = await pool.execute(
    `SELECT ar.*,a.status appointment_status,a.patient_id,a.appointment_number,
       a.requested_start,a.proposed_start,a.confirmed_start,aps.name service_name,
       sa.user_id,COALESCE(s.registered_email,e.email) email
     FROM appointment_reminders ar
     JOIN appointments a ON a.id=ar.appointment_id
     JOIN appointment_services aps ON aps.id=a.service_id
     JOIN patients p ON p.id=a.patient_id
     LEFT JOIN students s ON s.id=p.student_id
     LEFT JOIN employees e ON e.id=p.employee_id
     LEFT JOIN student_accounts sa ON sa.student_id=p.student_id
     WHERE ar.status='PENDING' AND ar.scheduled_for<=NOW()
     ORDER BY ar.scheduled_for LIMIT 25`
  );

  for (const row of rows) {
    const [claimed] = await pool.execute(
      "UPDATE appointment_reminders SET status='QUEUED' WHERE id=? AND status='PENDING'",
      [row.id]
    );
    if (!claimed.affectedRows) continue;
    if (row.appointment_status !== 'CONFIRMED') {
      await pool.execute("UPDATE appointment_reminders SET status='SKIPPED' WHERE id=?", [row.id]);
      continue;
    }
    const message = appointmentReminderMessage(row);
    try {
      if (row.channel === 'IN_APP') {
        if (!row.user_id) {
          await pool.execute("UPDATE appointment_reminders SET status='SKIPPED' WHERE id=?", [row.id]);
          continue;
        }
        await pool.execute(
          `INSERT INTO notifications
           (id,user_id,patient_id,notification_type,severity,title,message,link)
           VALUES (?,?,?,'APPOINTMENT_REMINDER','INFO','Clinic appointment reminder',?, '/student/appointments')`,
          [uuid(), row.user_id, row.patient_id, message]
        );
        await pool.execute("UPDATE appointment_reminders SET status='SENT',sent_at=NOW() WHERE id=?", [row.id]);
      } else {
        if (!row.email) {
          await pool.execute("UPDATE appointment_reminders SET status='SKIPPED' WHERE id=?", [row.id]);
          continue;
        }
        await enqueueEmail({
          recipient: row.email,
          subject: 'KLD Clinic appointment reminder',
          template: 'APPOINTMENT_REMINDER',
          payload: {
            title: 'Clinic appointment reminder',
            message: `<p>${message}</p>`,
            actionUrl: `${env.APP_URL}/student/appointments`,
            actionLabel: 'Review appointment'
          },
          relatedType: 'appointments', relatedId: row.appointment_id
        });
        await pool.execute("UPDATE appointment_reminders SET status='QUEUED',sent_at=NOW() WHERE id=?", [row.id]);
      }
    } catch (error) {
      await pool.execute("UPDATE appointment_reminders SET status='FAILED' WHERE id=?", [row.id]);
      console.error('[appointment-reminder]', error.message);
    }
  }
}

async function dispatchFollowUpReminders() {
  const [rows] = await pool.execute(
    `SELECT fur.*,f.status follow_up_status,f.patient_id,f.follow_up_number,f.target_date,f.reason,
       sa.user_id,COALESCE(s.registered_email,e.email) email
     FROM follow_up_reminders fur
     JOIN follow_ups f ON f.id=fur.follow_up_id
     JOIN patients p ON p.id=f.patient_id
     LEFT JOIN students s ON s.id=p.student_id
     LEFT JOIN employees e ON e.id=p.employee_id
     LEFT JOIN student_accounts sa ON sa.student_id=p.student_id
     WHERE fur.status='PENDING' AND fur.scheduled_for<=NOW()
     ORDER BY fur.scheduled_for LIMIT 25`
  );

  for (const row of rows) {
    const [claimed] = await pool.execute(
      "UPDATE follow_up_reminders SET status='QUEUED' WHERE id=? AND status='PENDING'",
      [row.id]
    );
    if (!claimed.affectedRows) continue;
    if (!['PENDING','SCHEDULED'].includes(row.follow_up_status)) {
      await pool.execute("UPDATE follow_up_reminders SET status='SKIPPED' WHERE id=?", [row.id]);
      continue;
    }
    const message = `Reminder: your clinic follow-up is targeted for ${row.target_date}. ${row.reason}`;
    try {
      if (row.channel === 'IN_APP') {
        if (!row.user_id) {
          await pool.execute("UPDATE follow_up_reminders SET status='SKIPPED' WHERE id=?", [row.id]);
          continue;
        }
        await pool.execute(
          `INSERT INTO notifications
           (id,user_id,patient_id,notification_type,severity,title,message,link)
           VALUES (?,?,?,'FOLLOW_UP_REMINDER','INFO','Clinic follow-up reminder',?, '/student/appointments')`,
          [uuid(), row.user_id, row.patient_id, message]
        );
        await pool.execute("UPDATE follow_up_reminders SET status='SENT',sent_at=NOW() WHERE id=?", [row.id]);
      } else {
        if (!row.email) {
          await pool.execute("UPDATE follow_up_reminders SET status='SKIPPED' WHERE id=?", [row.id]);
          continue;
        }
        await enqueueEmail({
          recipient: row.email,
          subject: 'KLD Clinic follow-up reminder',
          template: 'FOLLOW_UP_REMINDER',
          payload: {
            title: 'Clinic follow-up reminder',
            message: `<p>${message}</p>`,
            actionUrl: `${env.APP_URL}/student/appointments`,
            actionLabel: 'Review follow-up'
          },
          relatedType: 'follow_ups', relatedId: row.follow_up_id
        });
        await pool.execute("UPDATE follow_up_reminders SET status='QUEUED',sent_at=NOW() WHERE id=?", [row.id]);
      }
    } catch (error) {
      await pool.execute("UPDATE follow_up_reminders SET status='FAILED' WHERE id=?", [row.id]);
      console.error('[follow-up-reminder]', error.message);
    }
  }
}

async function deliverEmailBatch() {
  const [items] = await pool.execute(
    `SELECT * FROM email_queue
     WHERE status IN ('PENDING', 'RETRY') AND next_attempt_at <= NOW()
     ORDER BY created_at ASC LIMIT 10`
  );

  for (const item of items) {
    const claimed = await withTransaction(async (connection) => {
      const [result] = await connection.execute(
        `UPDATE email_queue SET status = 'PROCESSING', updated_at = NOW()
         WHERE id = ? AND status IN ('PENDING', 'RETRY')`,
        [item.id]
      );
      return result.affectedRows > 0;
    });
    if (!claimed) continue;

    try {
      const info = await deliverQueuedEmail(item);
      await withTransaction(async (connection) => {
        await connection.execute(
          `UPDATE email_queue SET status = 'SENT', attempts = attempts + 1, sent_at = NOW(), updated_at = NOW() WHERE id = ?`,
          [item.id]
        );
        await connection.execute(
          `INSERT INTO email_delivery_logs
            (id, queue_id, recipient, email_type, status, message_id, attempted_at)
           VALUES (?, ?, ?, ?, 'SENT', ?, NOW())`,
          [uuid(), item.id, item.recipient, item.template, info.messageId || null]
        );
      });
    } catch (error) {
      const attempts = Number(item.attempts || 0) + 1;
      const final = attempts >= 3;
      await withTransaction(async (connection) => {
        await connection.execute(
          `UPDATE email_queue
           SET status = ?, attempts = ?, next_attempt_at = DATE_ADD(NOW(), INTERVAL ? MINUTE), last_error = ?, updated_at = NOW()
           WHERE id = ?`,
          [final ? 'FAILED' : 'RETRY', attempts, attempts * 5, String(error.message).slice(0, 1000), item.id]
        );
        await connection.execute(
          `INSERT INTO email_delivery_logs
            (id, queue_id, recipient, email_type, status, error_message, attempted_at)
           VALUES (?, ?, ?, ?, 'FAILED', ?, NOW())`,
          [uuid(), item.id, item.recipient, item.template, String(error.message).slice(0, 1000)]
        );
      });
    }
  }
}

async function processBatch() {
  if (running) return;
  running = true;
  try {
    await dispatchAppointmentReminders();
    await dispatchFollowUpReminders();
    await deliverEmailBatch();
  } catch (error) {
    console.error('[email-worker]', error.message);
  } finally {
    running = false;
  }
}

export function startEmailQueueWorker() {
  if (timer) return;
  processBatch();
  timer = setInterval(processBatch, env.EMAIL_WORKER_INTERVAL_MS);
  timer.unref?.();
}
