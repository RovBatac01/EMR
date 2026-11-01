-- KLD School EMR v1.1.0 non-destructive feature upgrade
-- Apply once to an existing v1.0.0 kld_school_emr database.
-- Back up the database before running this migration.

USE kld_school_emr;
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(80) NOT NULL,
  description VARCHAR(255) NOT NULL,
  applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (version)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- Roles and permissions
-- ---------------------------------------------------------------------------
INSERT IGNORE INTO roles (code, name, `rank`) VALUES ('DOCTOR', 'Clinic Doctor', 70);

INSERT IGNORE INTO permissions (code, description) VALUES
  ('landing.manage', 'Manage the public clinic landing page'),
  ('appointments.read', 'View appointment schedules'),
  ('appointments.write', 'Request and update appointments'),
  ('appointments.manage', 'Approve, decline, reschedule, cancel, and check in appointments'),
  ('queue.manage', 'Manage the clinic queue'),
  ('followups.manage', 'Create and manage clinical follow-ups'),
  ('inventory.adjust.request', 'Request medicine stock adjustments'),
  ('inventory.adjust.approve', 'Approve medicine stock adjustments'),
  ('inventory.count', 'Perform physical medicine stock counts'),
  ('patient_corrections.review', 'Review patient information correction requests'),
  ('attachments.manage', 'Upload and manage authorized medical attachments'),
  ('consultations.signoff', 'Clinically complete and sign consultations'),
  ('employees.manage', 'Manage employee patient records');

-- Super administrator receives all permissions.
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p WHERE r.code = 'SUPER_ADMIN';

-- Clinic administrator operational permissions.
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.code IN (
  'landing.manage','appointments.read','appointments.write','appointments.manage','queue.manage','followups.manage',
  'inventory.adjust.request','inventory.adjust.approve','inventory.count','patient_corrections.review',
  'attachments.manage','employees.manage'
) WHERE r.code = 'CLINIC_ADMIN';

-- Clinic staff operational permissions.
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.code IN (
  'appointments.read','appointments.write','appointments.manage','queue.manage','followups.manage',
  'inventory.adjust.request','inventory.count','attachments.manage'
) WHERE r.code = 'CLINIC_STAFF';

-- Viewer can see schedules and queues but cannot modify them.
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.code IN ('appointments.read')
WHERE r.code = 'VIEWER';

-- Student self-service appointment permissions.
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.code IN ('appointments.read','appointments.write')
WHERE r.code = 'STUDENT';

-- Doctor permissions.
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.code IN (
  'dashboard.read','patients.read','visits.read','visits.write','consultations.read','consultations.write',
  'consultations.signoff','consultations.release','medicines.read','medicines.issue','reports.read','settings.read',
  'appointments.read','appointments.write','appointments.manage','queue.manage','followups.manage','attachments.manage'
) WHERE r.code = 'DOCTOR';

-- ---------------------------------------------------------------------------
-- Public landing page
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS landing_page_config (
  id CHAR(36) NOT NULL,
  hero_heading VARCHAR(220) NOT NULL,
  hero_description VARCHAR(2000) NULL,
  hero_media_type ENUM('IMAGE','VIDEO','NONE') NOT NULL DEFAULT 'NONE',
  hero_media_path VARCHAR(500) NULL,
  hero_fallback_path VARCHAR(500) NULL,
  primary_cta_label VARCHAR(100) NULL,
  primary_cta_url VARCHAR(500) NULL,
  secondary_cta_label VARCHAR(100) NULL,
  secondary_cta_url VARCHAR(500) NULL,
  about_heading VARCHAR(180) NULL,
  about_content MEDIUMTEXT NULL,
  contact_heading VARCHAR(180) NULL,
  contact_content MEDIUMTEXT NULL,
  operating_hours MEDIUMTEXT NULL,
  location_text VARCHAR(1000) NULL,
  location_url VARCHAR(500) NULL,
  is_published TINYINT(1) NOT NULL DEFAULT 1,
  updated_by CHAR(36) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_landing_config_user FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS landing_content_items (
  id CHAR(36) NOT NULL,
  section_type ENUM('ANNOUNCEMENT','PROMOTION','SERVICE','TEAM') NOT NULL,
  title VARCHAR(220) NOT NULL,
  summary VARCHAR(2000) NULL,
  body MEDIUMTEXT NULL,
  image_path VARCHAR(500) NULL,
  link_label VARCHAR(100) NULL,
  link_url VARCHAR(500) NULL,
  metadata_json LONGTEXT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_published TINYINT(1) NOT NULL DEFAULT 1,
  publish_from DATETIME NULL,
  publish_until DATETIME NULL,
  created_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_landing_items_public (section_type, is_published, sort_order),
  CONSTRAINT fk_landing_item_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_landing_item_updater FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

INSERT IGNORE INTO landing_page_config
(id, hero_heading, hero_description, hero_media_type, primary_cta_label, primary_cta_url, secondary_cta_label, secondary_cta_url, about_heading, about_content, contact_heading, contact_content, operating_hours, location_text, is_published)
VALUES
('11111111-1111-4111-8111-111111111111',
 'KLD School Clinic',
 'Accessible, confidential, and coordinated healthcare support for the KLD community.',
 'NONE',
 'Sign In', '/login',
 'Request an Appointment', '/student/appointments',
 'About the Clinic',
 'The KLD School Clinic supports student and employee wellness through first aid, consultations, health education, medicine management, and coordinated referrals.',
 'Contact the Clinic',
 'For urgent concerns during school hours, contact the clinic or proceed directly to the clinic reception area.',
 'Monday to Friday, 8:00 AM to 5:00 PM',
 'Kolehiyo ng Lungsod ng Dasmariñas', 1);

-- ---------------------------------------------------------------------------
-- Generic patient identity and employee patients
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS employee_categories (
  id CHAR(36) NOT NULL,
  name VARCHAR(120) NOT NULL,
  description VARCHAR(500) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_employee_category_name (name)
) ENGINE=InnoDB;

INSERT IGNORE INTO employee_categories (id, name, description) VALUES
('21000000-0000-4000-8000-000000000001','Faculty / Professor','Teaching personnel'),
('21000000-0000-4000-8000-000000000002','Maintenance','Facilities and maintenance personnel'),
('21000000-0000-4000-8000-000000000003','Security','Campus security personnel'),
('21000000-0000-4000-8000-000000000004','University Administrator','Administrative leadership and office personnel'),
('21000000-0000-4000-8000-000000000005','Other Personnel','Other school employees');

CREATE TABLE IF NOT EXISTS employees (
  id CHAR(36) NOT NULL,
  employee_number VARCHAR(40) NOT NULL,
  category_id CHAR(36) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  middle_name VARCHAR(100) NULL,
  last_name VARCHAR(100) NOT NULL,
  birth_date DATE NOT NULL,
  sex ENUM('MALE','FEMALE','OTHER','PREFER_NOT_TO_SAY') NOT NULL,
  department VARCHAR(180) NOT NULL,
  position_title VARCHAR(180) NULL,
  employment_status ENUM('ACTIVE','INACTIVE','ON_LEAVE','SEPARATED') NOT NULL DEFAULT 'ACTIVE',
  email VARCHAR(190) NULL,
  contact_number VARCHAR(40) NULL,
  address VARCHAR(1000) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_employees_number (employee_number),
  KEY idx_employees_name (last_name, first_name),
  KEY idx_employees_department_status (department, employment_status),
  CONSTRAINT fk_employees_category FOREIGN KEY (category_id) REFERENCES employee_categories(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS patients (
  id CHAR(36) NOT NULL,
  patient_type ENUM('STUDENT','EMPLOYEE') NOT NULL,
  student_id CHAR(36) NULL,
  employee_id CHAR(36) NULL,
  record_number VARCHAR(40) NOT NULL,
  status ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_patients_student (student_id),
  UNIQUE KEY uq_patients_employee (employee_id),
  UNIQUE KEY uq_patients_record_number (record_number),
  KEY idx_patients_type_status (patient_type, status),
  CONSTRAINT fk_patients_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT fk_patients_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
) ENGINE=InnoDB;

INSERT IGNORE INTO patients (id, patient_type, student_id, employee_id, record_number, status, created_at, updated_at)
SELECT s.id, 'STUDENT', s.id, NULL, s.student_number,
       IF(s.enrollment_status = 'ACTIVE', 'ACTIVE', 'INACTIVE'), s.created_at, s.updated_at
FROM students s;

ALTER TABLE guardians ADD COLUMN patient_id CHAR(36) NULL AFTER id;
UPDATE guardians SET patient_id = student_id WHERE patient_id IS NULL;
ALTER TABLE guardians MODIFY student_id CHAR(36) NULL;
ALTER TABLE guardians ADD KEY idx_guardians_patient (patient_id, is_primary);
ALTER TABLE guardians ADD CONSTRAINT fk_guardians_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE emergency_contacts ADD COLUMN patient_id CHAR(36) NULL AFTER id;
UPDATE emergency_contacts SET patient_id = student_id WHERE patient_id IS NULL;
ALTER TABLE emergency_contacts MODIFY student_id CHAR(36) NULL;
ALTER TABLE emergency_contacts ADD KEY idx_emergency_contacts_patient (patient_id, is_primary);
ALTER TABLE emergency_contacts ADD CONSTRAINT fk_emergency_contacts_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE patient_medical_history ADD COLUMN patient_id CHAR(36) NULL AFTER id;
UPDATE patient_medical_history SET patient_id = student_id WHERE patient_id IS NULL;
ALTER TABLE patient_medical_history MODIFY student_id CHAR(36) NULL;
ALTER TABLE patient_medical_history ADD UNIQUE KEY uq_medical_history_patient (patient_id);
ALTER TABLE patient_medical_history ADD CONSTRAINT fk_medical_history_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE visits ADD COLUMN patient_id CHAR(36) NULL AFTER visit_number;
UPDATE visits SET patient_id = student_id WHERE patient_id IS NULL;
ALTER TABLE visits MODIFY student_id CHAR(36) NULL;
ALTER TABLE visits ADD KEY idx_visits_patient_date (patient_id, visit_date, visit_time);
ALTER TABLE visits ADD CONSTRAINT fk_visits_patient FOREIGN KEY (patient_id) REFERENCES patients(id);

ALTER TABLE consultations ADD COLUMN patient_id CHAR(36) NULL AFTER visit_id;
UPDATE consultations SET patient_id = student_id WHERE patient_id IS NULL;
ALTER TABLE consultations MODIFY student_id CHAR(36) NULL;
ALTER TABLE consultations ADD KEY idx_consultations_patient_status (patient_id, status);
ALTER TABLE consultations ADD CONSTRAINT fk_consultations_patient FOREIGN KEY (patient_id) REFERENCES patients(id);

ALTER TABLE medicine_issuances ADD COLUMN patient_id CHAR(36) NULL AFTER issuance_number;
UPDATE medicine_issuances SET patient_id = student_id WHERE patient_id IS NULL;
ALTER TABLE medicine_issuances MODIFY student_id CHAR(36) NULL;
ALTER TABLE medicine_issuances ADD KEY idx_medicine_issuances_patient (patient_id, issued_at);
ALTER TABLE medicine_issuances ADD CONSTRAINT fk_medicine_issuances_patient FOREIGN KEY (patient_id) REFERENCES patients(id);

ALTER TABLE notifications ADD COLUMN patient_id CHAR(36) NULL AFTER student_id;
UPDATE notifications SET patient_id = student_id WHERE patient_id IS NULL AND student_id IS NOT NULL;
ALTER TABLE notifications ADD KEY idx_notifications_patient (patient_id, created_at);
ALTER TABLE notifications ADD CONSTRAINT fk_notifications_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS patient_measurements (
  id CHAR(36) NOT NULL,
  patient_id CHAR(36) NOT NULL,
  height_cm DECIMAL(7,2) NULL,
  weight_kg DECIMAL(7,2) NULL,
  measured_on DATE NOT NULL,
  source ENUM('PATIENT_SELF_REPORTED','CLINIC_STAFF','IMPORT') NOT NULL,
  submitted_by_user_id CHAR(36) NULL,
  recorded_by_staff_id CHAR(36) NULL,
  notes VARCHAR(1000) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_patient_measurements_date (patient_id, measured_on),
  CONSTRAINT fk_measurements_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  CONSTRAINT fk_measurements_user FOREIGN KEY (submitted_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_measurements_staff FOREIGN KEY (recorded_by_staff_id) REFERENCES staff(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS medical_attachments (
  id CHAR(36) NOT NULL,
  patient_id CHAR(36) NOT NULL,
  visit_id CHAR(36) NULL,
  consultation_id CHAR(36) NULL,
  original_name VARCHAR(255) NOT NULL,
  stored_name VARCHAR(255) NOT NULL,
  relative_path VARCHAR(500) NOT NULL,
  mime_type VARCHAR(120) NOT NULL,
  file_size INT UNSIGNED NOT NULL,
  description VARCHAR(1000) NULL,
  uploaded_by CHAR(36) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_attachments_patient (patient_id, created_at),
  CONSTRAINT fk_attachments_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  CONSTRAINT fk_attachments_visit FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE SET NULL,
  CONSTRAINT fk_attachments_consultation FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE SET NULL,
  CONSTRAINT fk_attachments_user FOREIGN KEY (uploaded_by) REFERENCES users(id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- Doctor profiles and clinical sign-off
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS doctor_profiles (
  id CHAR(36) NOT NULL,
  staff_id CHAR(36) NOT NULL,
  specialization VARCHAR(180) NULL,
  professional_license_number VARCHAR(100) NOT NULL,
  license_expiration_date DATE NULL,
  signature_name VARCHAR(200) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_doctor_staff (staff_id),
  UNIQUE KEY uq_doctor_license (professional_license_number),
  CONSTRAINT fk_doctor_profile_staff FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
) ENGINE=InnoDB;

ALTER TABLE consultations ADD COLUMN prepared_by_staff_id CHAR(36) NULL AFTER staff_id;
UPDATE consultations SET prepared_by_staff_id = staff_id WHERE prepared_by_staff_id IS NULL;
ALTER TABLE consultations ADD COLUMN doctor_staff_id CHAR(36) NULL AFTER prepared_by_staff_id;
ALTER TABLE consultations ADD COLUMN completed_at DATETIME NULL AFTER status;
ALTER TABLE consultations ADD COLUMN signed_off_at DATETIME NULL AFTER completed_at;
ALTER TABLE consultations ADD COLUMN signed_off_by_user_id CHAR(36) NULL AFTER signed_off_at;
ALTER TABLE consultations ADD COLUMN legacy_completion TINYINT(1) NOT NULL DEFAULT 0 AFTER signed_off_by_user_id;
UPDATE consultations
SET completed_at = COALESCE(completed_at, updated_at),
    signed_off_at = COALESCE(signed_off_at, updated_at),
    legacy_completion = 1
WHERE status IN ('COMPLETED','RELEASED') AND doctor_staff_id IS NULL;
ALTER TABLE consultations ADD KEY idx_consultations_doctor_status (doctor_staff_id, status, completed_at);
ALTER TABLE consultations ADD CONSTRAINT fk_consultations_prepared_by FOREIGN KEY (prepared_by_staff_id) REFERENCES staff(id) ON DELETE SET NULL;
ALTER TABLE consultations ADD CONSTRAINT fk_consultations_doctor FOREIGN KEY (doctor_staff_id) REFERENCES staff(id) ON DELETE SET NULL;
ALTER TABLE consultations ADD CONSTRAINT fk_consultations_signed_user FOREIGN KEY (signed_off_by_user_id) REFERENCES users(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- Appointment scheduling, queue, and follow-ups
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS appointment_services (
  id CHAR(36) NOT NULL,
  name VARCHAR(180) NOT NULL,
  description VARCHAR(2000) NULL,
  duration_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 30,
  slot_capacity SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  daily_booking_limit SMALLINT UNSIGNED NULL,
  advance_booking_days SMALLINT UNSIGNED NOT NULL DEFAULT 30,
  minimum_notice_hours SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  is_public TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_appointment_service_name (name),
  KEY idx_appointment_service_active (is_active, sort_order)
) ENGINE=InnoDB;

INSERT IGNORE INTO appointment_services (id, name, description, duration_minutes, slot_capacity, daily_booking_limit, advance_booking_days, minimum_notice_hours, is_active, is_public, sort_order) VALUES
('31000000-0000-4000-8000-000000000001','General Clinic Consultation','General school clinic consultation and health assessment.',30,2,30,30,1,1,1,10),
('31000000-0000-4000-8000-000000000002','Medical Clearance','Medical clearance review and documentation.',30,1,15,30,4,1,1,20),
('31000000-0000-4000-8000-000000000003','Follow-up Consultation','Scheduled return consultation after an earlier clinic encounter.',20,2,30,60,1,1,1,30);

CREATE TABLE IF NOT EXISTS clinic_schedules (
  id CHAR(36) NOT NULL,
  service_id CHAR(36) NOT NULL,
  day_of_week TINYINT UNSIGNED NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_capacity SMALLINT UNSIGNED NULL,
  booking_limit SMALLINT UNSIGNED NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_clinic_schedule (service_id, day_of_week, start_time, end_time),
  KEY idx_clinic_schedule_active (service_id, day_of_week, is_active),
  CONSTRAINT fk_clinic_schedule_service FOREIGN KEY (service_id) REFERENCES appointment_services(id)
) ENGINE=InnoDB;

INSERT IGNORE INTO clinic_schedules (id, service_id, day_of_week, start_time, end_time, slot_capacity, booking_limit, is_active) VALUES
('32000000-0000-4000-8000-000000000001','31000000-0000-4000-8000-000000000001',1,'08:00:00','17:00:00',2,30,1),
('32000000-0000-4000-8000-000000000002','31000000-0000-4000-8000-000000000001',2,'08:00:00','17:00:00',2,30,1),
('32000000-0000-4000-8000-000000000003','31000000-0000-4000-8000-000000000001',3,'08:00:00','17:00:00',2,30,1),
('32000000-0000-4000-8000-000000000004','31000000-0000-4000-8000-000000000001',4,'08:00:00','17:00:00',2,30,1),
('32000000-0000-4000-8000-000000000005','31000000-0000-4000-8000-000000000001',5,'08:00:00','17:00:00',2,30,1),
('32000000-0000-4000-8000-000000000006','31000000-0000-4000-8000-000000000002',1,'09:00:00','16:00:00',1,15,1),
('32000000-0000-4000-8000-000000000007','31000000-0000-4000-8000-000000000002',3,'09:00:00','16:00:00',1,15,1),
('32000000-0000-4000-8000-000000000008','31000000-0000-4000-8000-000000000002',5,'09:00:00','16:00:00',1,15,1),
('32000000-0000-4000-8000-000000000009','31000000-0000-4000-8000-000000000003',1,'08:00:00','17:00:00',2,30,1),
('32000000-0000-4000-8000-000000000010','31000000-0000-4000-8000-000000000003',2,'08:00:00','17:00:00',2,30,1),
('32000000-0000-4000-8000-000000000011','31000000-0000-4000-8000-000000000003',3,'08:00:00','17:00:00',2,30,1),
('32000000-0000-4000-8000-000000000012','31000000-0000-4000-8000-000000000003',4,'08:00:00','17:00:00',2,30,1),
('32000000-0000-4000-8000-000000000013','31000000-0000-4000-8000-000000000003',5,'08:00:00','17:00:00',2,30,1);

CREATE TABLE IF NOT EXISTS clinic_unavailable_dates (
  id CHAR(36) NOT NULL,
  service_id CHAR(36) NULL,
  unavailable_date DATE NOT NULL,
  start_time TIME NULL,
  end_time TIME NULL,
  reason VARCHAR(500) NOT NULL,
  created_by CHAR(36) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_unavailable_date (unavailable_date, service_id),
  CONSTRAINT fk_unavailable_service FOREIGN KEY (service_id) REFERENCES appointment_services(id) ON DELETE CASCADE,
  CONSTRAINT fk_unavailable_user FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS appointments (
  id CHAR(36) NOT NULL,
  appointment_number VARCHAR(40) NOT NULL,
  patient_id CHAR(36) NOT NULL,
  service_id CHAR(36) NOT NULL,
  requested_start DATETIME NOT NULL,
  requested_end DATETIME NOT NULL,
  proposed_start DATETIME NULL,
  proposed_end DATETIME NULL,
  confirmed_start DATETIME NULL,
  confirmed_end DATETIME NULL,
  reason VARCHAR(2000) NOT NULL,
  status ENUM('PENDING','CONFIRMED','PROPOSED','DECLINED','CANCELLED','CHECKED_IN','IN_QUEUE','IN_CONSULTATION','COMPLETED','NO_SHOW') NOT NULL DEFAULT 'PENDING',
  student_response ENUM('PENDING','ACCEPTED','DECLINED') NULL,
  staff_notes VARCHAR(2000) NULL,
  cancellation_reason VARCHAR(1000) NULL,
  no_show_reason VARCHAR(1000) NULL,
  requested_by_user_id CHAR(36) NOT NULL,
  reviewed_by_user_id CHAR(36) NULL,
  visit_id CHAR(36) NULL,
  idempotency_key VARCHAR(100) NULL,
  checked_in_at DATETIME NULL,
  completed_at DATETIME NULL,
  cancelled_at DATETIME NULL,
  no_show_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_appointments_number (appointment_number),
  UNIQUE KEY uq_appointments_idempotency (idempotency_key),
  UNIQUE KEY uq_appointments_visit (visit_id),
  KEY idx_appointments_schedule (service_id, requested_start, status),
  KEY idx_appointments_patient (patient_id, created_at),
  KEY idx_appointments_status_date (status, requested_start),
  CONSTRAINT fk_appointments_patient FOREIGN KEY (patient_id) REFERENCES patients(id),
  CONSTRAINT fk_appointments_service FOREIGN KEY (service_id) REFERENCES appointment_services(id),
  CONSTRAINT fk_appointments_request_user FOREIGN KEY (requested_by_user_id) REFERENCES users(id),
  CONSTRAINT fk_appointments_review_user FOREIGN KEY (reviewed_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_appointments_visit FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS appointment_status_history (
  id CHAR(36) NOT NULL,
  appointment_id CHAR(36) NOT NULL,
  from_status VARCHAR(40) NULL,
  to_status VARCHAR(40) NOT NULL,
  changed_by_user_id CHAR(36) NOT NULL,
  reason VARCHAR(1000) NULL,
  metadata_json LONGTEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_appointment_history (appointment_id, created_at),
  CONSTRAINT fk_appointment_history_appointment FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
  CONSTRAINT fk_appointment_history_user FOREIGN KEY (changed_by_user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS appointment_reminders (
  id CHAR(36) NOT NULL,
  appointment_id CHAR(36) NOT NULL,
  reminder_type ENUM('CONFIRMATION','CHANGE','ONE_DAY','TWO_HOUR','CANCELLATION') NOT NULL,
  channel ENUM('IN_APP','EMAIL') NOT NULL,
  status ENUM('PENDING','QUEUED','SENT','SKIPPED','FAILED') NOT NULL DEFAULT 'PENDING',
  scheduled_for DATETIME NOT NULL,
  sent_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_appointment_reminder (appointment_id, reminder_type, channel),
  KEY idx_appointment_reminders_due (status, scheduled_for),
  CONSTRAINT fk_appointment_reminder_appointment FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS queue_daily_counters (
  queue_date DATE NOT NULL,
  last_number INT UNSIGNED NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (queue_date)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS clinic_queue_entries (
  id CHAR(36) NOT NULL,
  queue_date DATE NOT NULL,
  queue_number INT UNSIGNED NOT NULL,
  patient_id CHAR(36) NOT NULL,
  appointment_id CHAR(36) NULL,
  visit_id CHAR(36) NOT NULL,
  priority ENUM('NORMAL','MODERATE','URGENT','EMERGENCY') NOT NULL DEFAULT 'NORMAL',
  status ENUM('WAITING','CALLED','IN_CONSULTATION','COMPLETED','CANCELLED') NOT NULL DEFAULT 'WAITING',
  checked_in_by CHAR(36) NOT NULL,
  called_by CHAR(36) NULL,
  checked_in_at DATETIME NOT NULL,
  called_at DATETIME NULL,
  consultation_started_at DATETIME NULL,
  completed_at DATETIME NULL,
  cancelled_at DATETIME NULL,
  idempotency_key VARCHAR(100) NULL,
  notes VARCHAR(1000) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_queue_number_date (queue_date, queue_number),
  UNIQUE KEY uq_queue_appointment (appointment_id),
  UNIQUE KEY uq_queue_visit (visit_id),
  UNIQUE KEY uq_queue_idempotency (idempotency_key),
  KEY idx_queue_daily_status (queue_date, status, priority, checked_in_at),
  CONSTRAINT fk_queue_patient FOREIGN KEY (patient_id) REFERENCES patients(id),
  CONSTRAINT fk_queue_appointment FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
  CONSTRAINT fk_queue_visit FOREIGN KEY (visit_id) REFERENCES visits(id),
  CONSTRAINT fk_queue_checked_by FOREIGN KEY (checked_in_by) REFERENCES users(id),
  CONSTRAINT fk_queue_called_by FOREIGN KEY (called_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS follow_ups (
  id CHAR(36) NOT NULL,
  follow_up_number VARCHAR(40) NOT NULL,
  consultation_id CHAR(36) NOT NULL,
  patient_id CHAR(36) NOT NULL,
  reason VARCHAR(2000) NOT NULL,
  target_date DATE NOT NULL,
  assigned_staff_id CHAR(36) NULL,
  assigned_doctor_staff_id CHAR(36) NULL,
  notes VARCHAR(3000) NULL,
  status ENUM('PENDING','SCHEDULED','COMPLETED','MISSED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  appointment_id CHAR(36) NULL,
  created_by_user_id CHAR(36) NOT NULL,
  completed_at DATETIME NULL,
  cancelled_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_followup_number (follow_up_number),
  UNIQUE KEY uq_followup_appointment (appointment_id),
  KEY idx_followups_patient_status (patient_id, status, target_date),
  KEY idx_followups_consultation (consultation_id, target_date),
  CONSTRAINT fk_followup_consultation FOREIGN KEY (consultation_id) REFERENCES consultations(id),
  CONSTRAINT fk_followup_patient FOREIGN KEY (patient_id) REFERENCES patients(id),
  CONSTRAINT fk_followup_staff FOREIGN KEY (assigned_staff_id) REFERENCES staff(id) ON DELETE SET NULL,
  CONSTRAINT fk_followup_doctor FOREIGN KEY (assigned_doctor_staff_id) REFERENCES staff(id) ON DELETE SET NULL,
  CONSTRAINT fk_followup_appointment FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
  CONSTRAINT fk_followup_user FOREIGN KEY (created_by_user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS follow_up_reminders (
  id CHAR(36) NOT NULL,
  follow_up_id CHAR(36) NOT NULL,
  reminder_type ENUM('CREATED','ONE_DAY','MISSED') NOT NULL,
  channel ENUM('IN_APP','EMAIL') NOT NULL,
  status ENUM('PENDING','QUEUED','SENT','SKIPPED','FAILED') NOT NULL DEFAULT 'PENDING',
  scheduled_for DATETIME NOT NULL,
  sent_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_followup_reminder (follow_up_id, reminder_type, channel),
  CONSTRAINT fk_followup_reminder_followup FOREIGN KEY (follow_up_id) REFERENCES follow_ups(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- Inventory control enhancements
-- ---------------------------------------------------------------------------
ALTER TABLE medicine_categories ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER description;
ALTER TABLE medicine_categories ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at;

ALTER TABLE inventory_transactions MODIFY transaction_type
ENUM('RECEIPT','ISSUANCE','RETURN','ADJUSTMENT','EXPIRY_WRITE_OFF','DAMAGE','LOSS','CORRECTION','RECONCILIATION') NOT NULL;

CREATE TABLE IF NOT EXISTS inventory_adjustment_requests (
  id CHAR(36) NOT NULL,
  adjustment_number VARCHAR(40) NOT NULL,
  medicine_id CHAR(36) NOT NULL,
  batch_id CHAR(36) NOT NULL,
  adjustment_type ENUM('DAMAGED','LOST','EXPIRED','CORRECTION','RECONCILIATION') NOT NULL,
  quantity_change INT NOT NULL,
  reason VARCHAR(1000) NOT NULL,
  supporting_notes VARCHAR(3000) NULL,
  status ENUM('PENDING','APPROVED','REJECTED','APPLIED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  before_quantity INT UNSIGNED NOT NULL,
  after_quantity INT UNSIGNED NULL,
  requested_by CHAR(36) NOT NULL,
  approved_by CHAR(36) NULL,
  requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at DATETIME NULL,
  applied_at DATETIME NULL,
  review_notes VARCHAR(2000) NULL,
  stock_count_item_id CHAR(36) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_inventory_adjustment_number (adjustment_number),
  KEY idx_adjustment_status (status, requested_at),
  KEY idx_adjustment_batch (batch_id, created_at),
  CONSTRAINT fk_adjustment_medicine FOREIGN KEY (medicine_id) REFERENCES medicines(id),
  CONSTRAINT fk_adjustment_batch FOREIGN KEY (batch_id) REFERENCES medicine_batches(id),
  CONSTRAINT fk_adjustment_requester FOREIGN KEY (requested_by) REFERENCES users(id),
  CONSTRAINT fk_adjustment_approver FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS stock_count_sessions (
  id CHAR(36) NOT NULL,
  count_number VARCHAR(40) NOT NULL,
  title VARCHAR(200) NOT NULL,
  storage_location VARCHAR(180) NULL,
  status ENUM('OPEN','SUBMITTED','RECONCILED','CANCELLED') NOT NULL DEFAULT 'OPEN',
  opened_by CHAR(36) NOT NULL,
  submitted_by CHAR(36) NULL,
  reconciled_by CHAR(36) NULL,
  notes VARCHAR(3000) NULL,
  opened_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  submitted_at DATETIME NULL,
  reconciled_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_stock_count_number (count_number),
  KEY idx_stock_count_status (status, opened_at),
  CONSTRAINT fk_stock_count_opener FOREIGN KEY (opened_by) REFERENCES users(id),
  CONSTRAINT fk_stock_count_submitter FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_stock_count_reconciler FOREIGN KEY (reconciled_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS stock_count_items (
  id CHAR(36) NOT NULL,
  session_id CHAR(36) NOT NULL,
  medicine_id CHAR(36) NOT NULL,
  batch_id CHAR(36) NOT NULL,
  expected_quantity INT UNSIGNED NOT NULL,
  counted_quantity INT UNSIGNED NULL,
  variance INT NULL,
  notes VARCHAR(1000) NULL,
  adjustment_request_id CHAR(36) NULL,
  counted_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_stock_count_batch (session_id, batch_id),
  KEY idx_stock_count_item_variance (session_id, variance),
  CONSTRAINT fk_stock_count_item_session FOREIGN KEY (session_id) REFERENCES stock_count_sessions(id) ON DELETE CASCADE,
  CONSTRAINT fk_stock_count_item_medicine FOREIGN KEY (medicine_id) REFERENCES medicines(id),
  CONSTRAINT fk_stock_count_item_batch FOREIGN KEY (batch_id) REFERENCES medicine_batches(id),
  CONSTRAINT fk_stock_count_item_adjustment FOREIGN KEY (adjustment_request_id) REFERENCES inventory_adjustment_requests(id) ON DELETE SET NULL
) ENGINE=InnoDB;

ALTER TABLE inventory_adjustment_requests
  ADD CONSTRAINT fk_adjustment_stock_count_item FOREIGN KEY (stock_count_item_id) REFERENCES stock_count_items(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- Patient correction requests
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS patient_correction_requests (
  id CHAR(36) NOT NULL,
  request_number VARCHAR(40) NOT NULL,
  patient_id CHAR(36) NOT NULL,
  requested_by_user_id CHAR(36) NOT NULL,
  request_type ENUM('CONTACT','GUARDIAN','EMERGENCY_CONTACT','HEALTH_INFORMATION') NOT NULL,
  current_values_json LONGTEXT NOT NULL,
  proposed_values_json LONGTEXT NOT NULL,
  source_updated_at DATETIME NULL,
  status ENUM('PENDING','APPROVED','REJECTED','CONFLICT','CANCELLED') NOT NULL DEFAULT 'PENDING',
  reviewer_comments VARCHAR(2000) NULL,
  reviewed_by_user_id CHAR(36) NULL,
  submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at DATETIME NULL,
  applied_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_patient_correction_number (request_number),
  KEY idx_patient_correction_patient (patient_id, status, submitted_at),
  KEY idx_patient_correction_review (status, submitted_at),
  CONSTRAINT fk_patient_correction_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  CONSTRAINT fk_patient_correction_requester FOREIGN KEY (requested_by_user_id) REFERENCES users(id),
  CONSTRAINT fk_patient_correction_reviewer FOREIGN KEY (reviewed_by_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- Audit enhancements
-- ---------------------------------------------------------------------------
ALTER TABLE activity_logs ADD COLUMN request_method VARCHAR(10) NULL AFTER ip_address;
ALTER TABLE activity_logs ADD COLUMN request_path VARCHAR(500) NULL AFTER request_method;
ALTER TABLE activity_logs ADD COLUMN request_id VARCHAR(100) NULL AFTER request_path;
ALTER TABLE activity_logs ADD KEY idx_activity_request (request_id);

INSERT INTO system_settings (setting_key, setting_value, value_type, group_name)
VALUES ('system_version','1.1.0','STRING','SYSTEM')
ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value), updated_at=NOW();

INSERT INTO schema_migrations (version, description)
VALUES ('001_upgrade_v1_1_0', 'Public landing page, appointments, queue, follow-ups, generic patients, doctor sign-off, inventory controls, corrections, and audit enhancements')
ON DUPLICATE KEY UPDATE description=VALUES(description), applied_at=CURRENT_TIMESTAMP;

SET FOREIGN_KEY_CHECKS = 1;
