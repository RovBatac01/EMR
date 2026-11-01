-- KLD School Electronic Medical Records and Student Clinic Portal
-- Fresh MySQL / MariaDB schema for XAMPP
-- Import this file first, then import seed.sql.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP DATABASE IF EXISTS kld_school_emr;
CREATE DATABASE kld_school_emr CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE kld_school_emr;

CREATE TABLE roles (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(40) NOT NULL,
  name VARCHAR(100) NOT NULL,
  `rank` INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_roles_code (code)
) ENGINE=InnoDB;

CREATE TABLE permissions (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(80) NOT NULL,
  description VARCHAR(255) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_permissions_code (code)
) ENGINE=InnoDB;

CREATE TABLE role_permissions (
  role_id INT UNSIGNED NOT NULL,
  permission_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  CONSTRAINT fk_role_permissions_permission FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE users (
  id CHAR(36) NOT NULL,
  username VARCHAR(40) NOT NULL,
  email VARCHAR(190) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role_id INT UNSIGNED NOT NULL,
  status ENUM('ACTIVE','DISABLED','LOCKED','PENDING') NOT NULL DEFAULT 'ACTIVE',
  must_change_password TINYINT(1) NOT NULL DEFAULT 0,
  email_verified_at DATETIME NULL,
  password_changed_at DATETIME NULL,
  last_login_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_username (username),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_role_status (role_id, status),
  CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id)
) ENGINE=InnoDB;

CREATE TABLE user_sessions (
  id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  token_hash CHAR(64) NOT NULL,
  user_agent VARCHAR(500) NULL,
  ip_address VARCHAR(64) NULL,
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_sessions_token (token_hash),
  KEY idx_user_sessions_user_active (user_id, revoked_at, expires_at),
  CONSTRAINT fk_user_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE password_reset_tokens (
  id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_password_reset_hash (token_hash),
  KEY idx_password_reset_user (user_id, expires_at),
  CONSTRAINT fk_password_reset_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE staff (
  id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  staff_number VARCHAR(40) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  middle_name VARCHAR(100) NULL,
  last_name VARCHAR(100) NOT NULL,
  contact_number VARCHAR(40) NULL,
  position VARCHAR(120) NOT NULL,
  license_number VARCHAR(80) NULL,
  profile_picture VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_staff_user (user_id),
  UNIQUE KEY uq_staff_number (staff_number),
  KEY idx_staff_name (last_name, first_name),
  CONSTRAINT fk_staff_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE students (
  id CHAR(36) NOT NULL,
  student_number VARCHAR(40) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  middle_name VARCHAR(100) NULL,
  last_name VARCHAR(100) NOT NULL,
  birth_date DATE NOT NULL,
  sex ENUM('MALE','FEMALE','OTHER','PREFER_NOT_TO_SAY') NOT NULL,
  program VARCHAR(150) NOT NULL,
  year_level VARCHAR(30) NOT NULL,
  section VARCHAR(80) NULL,
  registered_email VARCHAR(190) NOT NULL,
  contact_number VARCHAR(40) NULL,
  address VARCHAR(1000) NULL,
  enrollment_status ENUM('ACTIVE','INACTIVE','GRADUATED','TRANSFERRED','SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
  academic_year VARCHAR(20) NOT NULL,
  semester VARCHAR(30) NOT NULL,
  portal_eligible TINYINT(1) NOT NULL DEFAULT 1,
  account_activation_status ENUM('NOT_ACTIVATED','PENDING_VERIFICATION','ACTIVE','REVOKED') NOT NULL DEFAULT 'NOT_ACTIVATED',
  account_linked TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_students_number (student_number),
  KEY idx_students_name (last_name, first_name),
  KEY idx_students_program_year (program, year_level),
  KEY idx_students_status (enrollment_status, portal_eligible),
  KEY idx_students_email (registered_email)
) ENGINE=InnoDB;

CREATE TABLE student_enrollments (
  id CHAR(36) NOT NULL,
  student_id CHAR(36) NOT NULL,
  academic_year VARCHAR(20) NOT NULL,
  semester VARCHAR(30) NOT NULL,
  program VARCHAR(150) NOT NULL,
  year_level VARCHAR(30) NOT NULL,
  section VARCHAR(80) NULL,
  enrollment_status ENUM('ACTIVE','INACTIVE','GRADUATED','TRANSFERRED','SUSPENDED') NOT NULL,
  is_current TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_student_enrollment_term (student_id, academic_year, semester),
  KEY idx_student_enrollment_current (student_id, is_current),
  CONSTRAINT fk_student_enrollments_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE student_accounts (
  id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  student_id CHAR(36) NOT NULL,
  verified_email_at DATETIME NULL,
  activated_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_student_accounts_user (user_id),
  UNIQUE KEY uq_student_accounts_student (student_id),
  CONSTRAINT fk_student_accounts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_student_accounts_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE email_verification_tokens (
  id CHAR(36) NOT NULL,
  student_id CHAR(36) NOT NULL,
  email VARCHAR(190) NOT NULL,
  token_hash CHAR(64) NOT NULL,
  purpose ENUM('STUDENT_ACTIVATION','EMAIL_CHANGE') NOT NULL,
  attempts INT UNSIGNED NOT NULL DEFAULT 0,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_email_verification_hash (token_hash),
  KEY idx_email_verification_student (student_id, expires_at),
  CONSTRAINT fk_email_verification_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE guardians (
  id CHAR(36) NOT NULL,
  student_id CHAR(36) NOT NULL,
  full_name VARCHAR(200) NOT NULL,
  relationship VARCHAR(80) NULL,
  contact_number VARCHAR(40) NULL,
  email VARCHAR(190) NULL,
  address VARCHAR(1000) NULL,
  is_primary TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_guardians_student (student_id, is_primary),
  CONSTRAINT fk_guardians_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE emergency_contacts (
  id CHAR(36) NOT NULL,
  student_id CHAR(36) NOT NULL,
  full_name VARCHAR(200) NOT NULL,
  relationship VARCHAR(80) NULL,
  contact_number VARCHAR(40) NOT NULL,
  is_primary TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_emergency_contacts_student (student_id, is_primary),
  CONSTRAINT fk_emergency_contacts_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE patient_medical_history (
  id CHAR(36) NOT NULL,
  student_id CHAR(36) NOT NULL,
  blood_type VARCHAR(10) NULL,
  allergies TEXT NULL,
  existing_conditions TEXT NULL,
  current_medications TEXT NULL,
  medical_history MEDIUMTEXT NULL,
  immunizations MEDIUMTEXT NULL,
  important_alerts TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_medical_history_student (student_id),
  CONSTRAINT fk_medical_history_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE visits (
  id CHAR(36) NOT NULL,
  visit_number VARCHAR(40) NOT NULL,
  student_id CHAR(36) NOT NULL,
  visit_date DATE NOT NULL,
  visit_time TIME NOT NULL,
  visit_type ENUM('WALK_IN','FOLLOW_UP','EMERGENCY','REFERRAL','MEDICAL_CLEARANCE','OTHER') NOT NULL,
  reason VARCHAR(500) NOT NULL,
  complaint VARCHAR(1000) NOT NULL,
  accompanied_by VARCHAR(200) NULL,
  priority ENUM('NORMAL','MODERATE','URGENT','EMERGENCY') NOT NULL DEFAULT 'NORMAL',
  notes MEDIUMTEXT NULL,
  status ENUM('REGISTERED','IN_PROGRESS','COMPLETED','CANCELLED') NOT NULL DEFAULT 'REGISTERED',
  registered_by CHAR(36) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_visits_number (visit_number),
  KEY idx_visits_student_date (student_id, visit_date, visit_time),
  KEY idx_visits_date_status (visit_date, status),
  KEY idx_visits_priority (priority, visit_date),
  CONSTRAINT fk_visits_student FOREIGN KEY (student_id) REFERENCES students(id),
  CONSTRAINT fk_visits_staff FOREIGN KEY (registered_by) REFERENCES staff(id)
) ENGINE=InnoDB;

CREATE TABLE consultations (
  id CHAR(36) NOT NULL,
  consultation_number VARCHAR(40) NOT NULL,
  visit_id CHAR(36) NOT NULL,
  student_id CHAR(36) NOT NULL,
  staff_id CHAR(36) NOT NULL,
  chief_complaint TEXT NOT NULL,
  symptoms MEDIUMTEXT NULL,
  diagnosis TEXT NULL,
  findings MEDIUMTEXT NULL,
  severity ENUM('MILD','MODERATE','SEVERE','CRITICAL') NOT NULL DEFAULT 'MILD',
  treatment_provided MEDIUMTEXT NULL,
  dosage VARCHAR(500) NULL,
  frequency VARCHAR(500) NULL,
  duration VARCHAR(500) NULL,
  recommendations LONGTEXT NULL,
  notes LONGTEXT NULL,
  status ENUM('DRAFT','IN_PROGRESS','COMPLETED','RELEASED') NOT NULL DEFAULT 'DRAFT',
  released_at DATETIME NULL,
  released_by CHAR(36) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_consultations_number (consultation_number),
  UNIQUE KEY uq_consultations_visit (visit_id),
  KEY idx_consultations_student_status (student_id, status),
  KEY idx_consultations_staff_date (staff_id, created_at),
  CONSTRAINT fk_consultations_visit FOREIGN KEY (visit_id) REFERENCES visits(id),
  CONSTRAINT fk_consultations_student FOREIGN KEY (student_id) REFERENCES students(id),
  CONSTRAINT fk_consultations_staff FOREIGN KEY (staff_id) REFERENCES staff(id),
  CONSTRAINT fk_consultations_released_by FOREIGN KEY (released_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE vital_signs (
  id CHAR(36) NOT NULL,
  consultation_id CHAR(36) NOT NULL,
  temperature DECIMAL(5,2) NULL,
  systolic SMALLINT UNSIGNED NULL,
  diastolic SMALLINT UNSIGNED NULL,
  heart_rate SMALLINT UNSIGNED NULL,
  respiratory_rate SMALLINT UNSIGNED NULL,
  oxygen_saturation DECIMAL(5,2) NULL,
  weight DECIMAL(7,2) NULL,
  height DECIMAL(7,2) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_vital_signs_consultation (consultation_id),
  CONSTRAINT fk_vital_signs_consultation FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE physical_assessments (
  id CHAR(36) NOT NULL,
  consultation_id CHAR(36) NOT NULL,
  general_appearance TEXT NULL,
  heent TEXT NULL,
  respiratory TEXT NULL,
  cardiovascular TEXT NULL,
  abdomen TEXT NULL,
  musculoskeletal TEXT NULL,
  skin TEXT NULL,
  neurological TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_physical_assessment_consultation (consultation_id),
  CONSTRAINT fk_physical_assessment_consultation FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE medical_record_revisions (
  id CHAR(36) NOT NULL,
  consultation_id CHAR(36) NOT NULL,
  revised_by CHAR(36) NOT NULL,
  reason VARCHAR(1000) NOT NULL,
  before_data LONGTEXT NOT NULL,
  after_data LONGTEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_medical_revisions_consultation (consultation_id, created_at),
  CONSTRAINT fk_medical_revisions_consultation FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE CASCADE,
  CONSTRAINT fk_medical_revisions_user FOREIGN KEY (revised_by) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE medicine_categories (
  id CHAR(36) NOT NULL,
  name VARCHAR(120) NOT NULL,
  description VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_medicine_categories_name (name)
) ENGINE=InnoDB;

CREATE TABLE medicines (
  id CHAR(36) NOT NULL,
  medicine_code VARCHAR(40) NOT NULL,
  generic_name VARCHAR(180) NOT NULL,
  brand_name VARCHAR(180) NULL,
  category_id CHAR(36) NULL,
  dosage_form VARCHAR(120) NOT NULL,
  unit VARCHAR(40) NOT NULL,
  minimum_stock INT UNSIGNED NOT NULL DEFAULT 0,
  supplier VARCHAR(180) NULL,
  storage_location VARCHAR(180) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_medicines_code (medicine_code),
  KEY idx_medicines_name (generic_name, brand_name),
  KEY idx_medicines_category (category_id, is_active),
  CONSTRAINT fk_medicines_category FOREIGN KEY (category_id) REFERENCES medicine_categories(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE medicine_batches (
  id CHAR(36) NOT NULL,
  medicine_id CHAR(36) NOT NULL,
  batch_number VARCHAR(100) NOT NULL,
  quantity INT UNSIGNED NOT NULL DEFAULT 0,
  expiration_date DATE NOT NULL,
  received_date DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_medicine_batch (medicine_id, batch_number),
  KEY idx_medicine_batches_expiry (expiration_date, quantity),
  KEY idx_medicine_batches_stock (medicine_id, quantity, expiration_date),
  CONSTRAINT fk_medicine_batches_medicine FOREIGN KEY (medicine_id) REFERENCES medicines(id)
) ENGINE=InnoDB;

CREATE TABLE medicine_issuances (
  id CHAR(36) NOT NULL,
  issuance_number VARCHAR(40) NOT NULL,
  student_id CHAR(36) NOT NULL,
  visit_id CHAR(36) NULL,
  consultation_id CHAR(36) NULL,
  issued_by CHAR(36) NOT NULL,
  notes TEXT NULL,
  status ENUM('COMPLETED','VOIDED') NOT NULL DEFAULT 'COMPLETED',
  issued_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  voided_at DATETIME NULL,
  voided_by CHAR(36) NULL,
  void_reason VARCHAR(1000) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_medicine_issuances_number (issuance_number),
  KEY idx_medicine_issuances_student (student_id, issued_at),
  KEY idx_medicine_issuances_staff (issued_by, issued_at),
  CONSTRAINT fk_medicine_issuances_student FOREIGN KEY (student_id) REFERENCES students(id),
  CONSTRAINT fk_medicine_issuances_visit FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE SET NULL,
  CONSTRAINT fk_medicine_issuances_consultation FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE SET NULL,
  CONSTRAINT fk_medicine_issuances_staff FOREIGN KEY (issued_by) REFERENCES staff(id),
  CONSTRAINT fk_medicine_issuances_voided_by FOREIGN KEY (voided_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE medicine_issuance_items (
  id CHAR(36) NOT NULL,
  issuance_id CHAR(36) NOT NULL,
  medicine_id CHAR(36) NOT NULL,
  batch_id CHAR(36) NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  dosage VARCHAR(300) NOT NULL,
  frequency VARCHAR(300) NOT NULL,
  duration VARCHAR(300) NOT NULL,
  instructions VARCHAR(1000) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_issuance_items_issuance (issuance_id),
  KEY idx_issuance_items_medicine (medicine_id, created_at),
  CONSTRAINT fk_issuance_items_issuance FOREIGN KEY (issuance_id) REFERENCES medicine_issuances(id) ON DELETE CASCADE,
  CONSTRAINT fk_issuance_items_medicine FOREIGN KEY (medicine_id) REFERENCES medicines(id),
  CONSTRAINT fk_issuance_items_batch FOREIGN KEY (batch_id) REFERENCES medicine_batches(id)
) ENGINE=InnoDB;

CREATE TABLE inventory_transactions (
  id CHAR(36) NOT NULL,
  medicine_id CHAR(36) NOT NULL,
  batch_id CHAR(36) NOT NULL,
  transaction_type ENUM('RECEIPT','ISSUANCE','RETURN','ADJUSTMENT','EXPIRY_WRITE_OFF') NOT NULL,
  quantity_change INT NOT NULL,
  balance_after INT UNSIGNED NOT NULL,
  reference_type VARCHAR(60) NULL,
  reference_id CHAR(36) NULL,
  created_by CHAR(36) NOT NULL,
  notes VARCHAR(1000) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_inventory_transactions_medicine (medicine_id, created_at),
  KEY idx_inventory_transactions_batch (batch_id, created_at),
  CONSTRAINT fk_inventory_transactions_medicine FOREIGN KEY (medicine_id) REFERENCES medicines(id),
  CONSTRAINT fk_inventory_transactions_batch FOREIGN KEY (batch_id) REFERENCES medicine_batches(id),
  CONSTRAINT fk_inventory_transactions_user FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE clinic_forms (
  id CHAR(36) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NULL,
  audience ENUM('ALL_STUDENTS','ASSIGNED_STUDENTS') NOT NULL DEFAULT 'ASSIGNED_STUDENTS',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_by CHAR(36) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_clinic_forms_active (is_active, updated_at),
  CONSTRAINT fk_clinic_forms_user FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE clinic_form_versions (
  id CHAR(36) NOT NULL,
  form_id CHAR(36) NOT NULL,
  version INT UNSIGNED NOT NULL,
  schema_json LONGTEXT NOT NULL,
  is_current TINYINT(1) NOT NULL DEFAULT 0,
  published_at DATETIME NULL,
  created_by CHAR(36) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_clinic_form_version (form_id, version),
  KEY idx_clinic_form_current (form_id, is_current),
  CONSTRAINT fk_form_versions_form FOREIGN KEY (form_id) REFERENCES clinic_forms(id) ON DELETE CASCADE,
  CONSTRAINT fk_form_versions_user FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE form_assignments (
  id CHAR(36) NOT NULL,
  form_version_id CHAR(36) NOT NULL,
  student_id CHAR(36) NOT NULL,
  due_date DATE NULL,
  status ENUM('ASSIGNED','DRAFT','SUBMITTED','CANCELLED') NOT NULL DEFAULT 'ASSIGNED',
  assigned_by CHAR(36) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_form_assignment (form_version_id, student_id),
  KEY idx_form_assignments_student_status (student_id, status),
  CONSTRAINT fk_form_assignments_version FOREIGN KEY (form_version_id) REFERENCES clinic_form_versions(id),
  CONSTRAINT fk_form_assignments_student FOREIGN KEY (student_id) REFERENCES students(id),
  CONSTRAINT fk_form_assignments_user FOREIGN KEY (assigned_by) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE form_submissions (
  id CHAR(36) NOT NULL,
  assignment_id CHAR(36) NOT NULL,
  form_version_id CHAR(36) NOT NULL,
  student_id CHAR(36) NOT NULL,
  reference_number VARCHAR(40) NOT NULL,
  status ENUM('SUBMITTED','CORRECTED') NOT NULL DEFAULT 'SUBMITTED',
  submitted_at DATETIME NOT NULL,
  receipt_path VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_form_submissions_assignment (assignment_id),
  UNIQUE KEY uq_form_submissions_reference (reference_number),
  KEY idx_form_submissions_student (student_id, submitted_at),
  CONSTRAINT fk_form_submissions_assignment FOREIGN KEY (assignment_id) REFERENCES form_assignments(id),
  CONSTRAINT fk_form_submissions_version FOREIGN KEY (form_version_id) REFERENCES clinic_form_versions(id),
  CONSTRAINT fk_form_submissions_student FOREIGN KEY (student_id) REFERENCES students(id)
) ENGINE=InnoDB;

CREATE TABLE form_submission_answers (
  id CHAR(36) NOT NULL,
  submission_id CHAR(36) NOT NULL,
  field_key VARCHAR(100) NOT NULL,
  question_snapshot VARCHAR(500) NOT NULL,
  answer_json LONGTEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_form_answers_submission (submission_id),
  CONSTRAINT fk_form_answers_submission FOREIGN KEY (submission_id) REFERENCES form_submissions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE notifications (
  id CHAR(36) NOT NULL,
  user_id CHAR(36) NULL,
  role_id INT UNSIGNED NULL,
  student_id CHAR(36) NULL,
  notification_type VARCHAR(80) NOT NULL,
  severity ENUM('INFO','WARNING','CRITICAL') NOT NULL DEFAULT 'INFO',
  title VARCHAR(200) NOT NULL,
  message VARCHAR(2000) NOT NULL,
  link VARCHAR(500) NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  read_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_notifications_user_unread (user_id, is_read, created_at),
  KEY idx_notifications_role (role_id, created_at),
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_notifications_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  CONSTRAINT fk_notifications_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE email_queue (
  id CHAR(36) NOT NULL,
  recipient VARCHAR(190) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  template VARCHAR(80) NOT NULL,
  payload_json LONGTEXT NULL,
  status ENUM('PENDING','PROCESSING','RETRY','SENT','FAILED') NOT NULL DEFAULT 'PENDING',
  attempts INT UNSIGNED NOT NULL DEFAULT 0,
  next_attempt_at DATETIME NOT NULL,
  last_error VARCHAR(1000) NULL,
  related_type VARCHAR(80) NULL,
  related_id CHAR(36) NULL,
  sent_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_email_queue_status (status, next_attempt_at),
  KEY idx_email_queue_related (related_type, related_id)
) ENGINE=InnoDB;

CREATE TABLE email_delivery_logs (
  id CHAR(36) NOT NULL,
  queue_id CHAR(36) NOT NULL,
  recipient VARCHAR(190) NOT NULL,
  email_type VARCHAR(80) NOT NULL,
  status ENUM('SENT','FAILED') NOT NULL,
  message_id VARCHAR(500) NULL,
  error_message VARCHAR(1000) NULL,
  attempted_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_email_delivery_queue (queue_id, attempted_at),
  CONSTRAINT fk_email_delivery_queue FOREIGN KEY (queue_id) REFERENCES email_queue(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE activity_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  actor_user_id CHAR(36) NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(80) NULL,
  entity_id CHAR(36) NULL,
  description VARCHAR(2000) NOT NULL,
  ip_address VARCHAR(64) NULL,
  metadata LONGTEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_activity_actor (actor_user_id, created_at),
  KEY idx_activity_action (action, created_at),
  KEY idx_activity_entity (entity_type, entity_id),
  CONSTRAINT fk_activity_user FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE system_settings (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  setting_key VARCHAR(100) NOT NULL,
  setting_value MEDIUMTEXT NULL,
  value_type ENUM('STRING','NUMBER','BOOLEAN','JSON') NOT NULL DEFAULT 'STRING',
  group_name VARCHAR(80) NOT NULL DEFAULT 'SYSTEM',
  updated_by CHAR(36) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_system_settings_key (setting_key),
  CONSTRAINT fk_system_settings_user FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE OR REPLACE VIEW v_medicine_inventory AS
SELECT
  m.id,
  m.medicine_code,
  m.generic_name,
  m.brand_name,
  m.dosage_form,
  m.unit,
  m.minimum_stock,
  m.is_active,
  mc.name AS category_name,
  COALESCE(SUM(CASE WHEN mb.expiration_date >= CURDATE() THEN mb.quantity ELSE 0 END), 0) AS available_quantity,
  COALESCE(SUM(mb.quantity), 0) AS total_quantity,
  COALESCE(SUM(CASE WHEN mb.quantity > 0 AND mb.expiration_date < CURDATE() THEN mb.quantity ELSE 0 END), 0) AS expired_quantity,
  MIN(CASE WHEN mb.quantity > 0 AND mb.expiration_date >= CURDATE() THEN mb.expiration_date END) AS nearest_expiration,
  CASE
    WHEN m.is_active = 0 THEN 'INACTIVE'
    WHEN COALESCE(SUM(CASE WHEN mb.expiration_date >= CURDATE() THEN mb.quantity ELSE 0 END), 0) = 0 THEN 'OUT_OF_STOCK'
    WHEN COALESCE(SUM(CASE WHEN mb.expiration_date >= CURDATE() THEN mb.quantity ELSE 0 END), 0) <= m.minimum_stock THEN 'LOW_STOCK'
    WHEN MIN(CASE WHEN mb.quantity > 0 AND mb.expiration_date >= CURDATE() THEN mb.expiration_date END) <= DATE_ADD(CURDATE(), INTERVAL 60 DAY) THEN 'NEAR_EXPIRATION'
    ELSE 'AVAILABLE'
  END AS stock_status
FROM medicines m
LEFT JOIN medicine_categories mc ON mc.id = m.category_id
LEFT JOIN medicine_batches mb ON mb.medicine_id = m.id
GROUP BY m.id, m.medicine_code, m.generic_name, m.brand_name, m.dosage_form, m.unit, m.minimum_stock, m.is_active, mc.name;

SET FOREIGN_KEY_CHECKS = 1;
