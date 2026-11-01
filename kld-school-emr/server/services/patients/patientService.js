import { AppError } from '../../utils/http.js';

export const patientIdentityColumns = `
    p.id AS patient_id,
    p.patient_type,
    p.record_number,
    p.status AS patient_status,
    p.archived_at,
    p.archive_reason,
    p.archived_by,
    p.unarchived_at,
    p.student_id,
    p.employee_id,
    COALESCE(s.first_name, e.first_name) AS first_name,
    COALESCE(s.middle_name, e.middle_name) AS middle_name,
    COALESCE(s.last_name, e.last_name) AS last_name,
    COALESCE(s.birth_date, e.birth_date) AS birth_date,
    COALESCE(s.sex, e.sex) AS sex,
    COALESCE(s.registered_email, e.email) AS email,
    COALESCE(s.contact_number, e.contact_number) AS contact_number,
    COALESCE(s.address, e.address) AS address,
    s.student_number,
    s.program,
    s.year_level,
    s.section,
    s.enrollment_status,
    s.academic_year,
    s.semester,
    e.employee_number,
    e.category_id AS employee_category_id,
    e.department,
    e.position_title,
    e.employment_status,
    ec.name AS employee_category`;

/**
 * Build the patient identity joins.
 * With no argument it starts a query from patients. With an expression such as
 * `v.patient_id`, it joins the patient identity onto an existing table.
 */
export function patientIdentityFrom(patientIdExpression = null) {
  const patientClause = patientIdExpression
    ? `JOIN patients p ON p.id = ${patientIdExpression}`
    : 'FROM patients p';
  return `${patientClause}
    LEFT JOIN students s ON s.id = p.student_id
    LEFT JOIN employees e ON e.id = p.employee_id
    LEFT JOIN employee_categories ec ON ec.id = e.category_id`;
}

export function patientIdentitySelect(patientIdExpression = null) {
  return `SELECT ${patientIdentityColumns} ${patientIdentityFrom(patientIdExpression)}`;
}

export function patientDisplayName(row) {
  return [row?.first_name, row?.middle_name, row?.last_name].filter(Boolean).join(' ');
}

export async function getPatientById(connection, patientId, { forUpdate = false } = {}) {
  const [rows] = await connection.execute(
    `${patientIdentitySelect()} WHERE p.id = ?${forUpdate ? ' FOR UPDATE' : ''}`,
    [patientId]
  );
  if (!rows.length) throw new AppError(404, 'Patient record not found.');
  return rows[0];
}

export async function getPatientForStudentUser(connection, userId, { forUpdate = false } = {}) {
  const [rows] = await connection.execute(
    `SELECT ${patientIdentityColumns}
     ${patientIdentityFrom()}
     JOIN student_accounts sa ON sa.student_id = p.student_id
     WHERE sa.user_id = ? AND p.patient_type = 'STUDENT'${forUpdate ? ' FOR UPDATE' : ''}`,
    [userId]
  );
  if (!rows.length) throw new AppError(403, 'No patient profile is linked to this student account.');
  return rows[0];
}
