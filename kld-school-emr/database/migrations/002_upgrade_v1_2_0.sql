-- KLD School EMR v1.2.0 non-destructive upgrade
-- Landing-page galleries, policy acknowledgment, record archives, and reliability safeguards.
-- Apply once after 001_upgrade_v1_1_0.sql. Back up the database and uploads first.

USE kld_school_emr;
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(80) NOT NULL,
  description VARCHAR(255) NOT NULL,
  applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (version)
) ENGINE=InnoDB;

-- Helpers make column/index/constraint additions safe when a previous attempt stopped midway.
DROP PROCEDURE IF EXISTS kld_add_column_if_missing;
DROP PROCEDURE IF EXISTS kld_add_index_if_missing;
DROP PROCEDURE IF EXISTS kld_add_fk_if_missing;
DELIMITER $$
CREATE PROCEDURE kld_add_column_if_missing(
  IN p_table VARCHAR(64),
  IN p_column VARCHAR(64),
  IN p_definition TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = p_table AND COLUMN_NAME = p_column
  ) THEN
    SET @ddl = CONCAT('ALTER TABLE `', p_table, '` ADD COLUMN ', p_definition);
    PREPARE stmt FROM @ddl;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END$$

CREATE PROCEDURE kld_add_index_if_missing(
  IN p_table VARCHAR(64),
  IN p_index VARCHAR(64),
  IN p_definition TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = p_table AND INDEX_NAME = p_index
  ) THEN
    SET @ddl = CONCAT('ALTER TABLE `', p_table, '` ADD ', p_definition);
    PREPARE stmt FROM @ddl;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END$$

CREATE PROCEDURE kld_add_fk_if_missing(
  IN p_table VARCHAR(64),
  IN p_constraint VARCHAR(64),
  IN p_definition TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = p_table
      AND CONSTRAINT_NAME = p_constraint AND CONSTRAINT_TYPE = 'FOREIGN KEY'
  ) THEN
    SET @ddl = CONCAT('ALTER TABLE `', p_table, '` ADD CONSTRAINT `', p_constraint, '` ', p_definition);
    PREPARE stmt FROM @ddl;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END$$
DELIMITER ;

-- ---------------------------------------------------------------------------
-- Permissions
-- ---------------------------------------------------------------------------
INSERT IGNORE INTO permissions (code, description) VALUES
  ('policies.manage', 'Create and publish privacy and terms documents'),
  ('archives.read', 'View archived patient and medicine records'),
  ('patients.archive', 'Archive patient records after operational checks'),
  ('patients.unarchive', 'Restore archived patient records'),
  ('medicines.archive', 'Archive medicines after inventory checks'),
  ('medicines.unarchive', 'Restore archived medicines');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.code = 'SUPER_ADMIN';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r JOIN permissions p ON p.code IN (
  'policies.manage','archives.read','patients.archive','patients.unarchive',
  'medicines.archive','medicines.unarchive'
)
WHERE r.code = 'CLINIC_ADMIN';

-- ---------------------------------------------------------------------------
-- Landing-page publication date and multi-image galleries
-- ---------------------------------------------------------------------------
CALL kld_add_column_if_missing(
  'landing_content_items',
  'publication_date',
  '`publication_date` DATE NULL AFTER `body`'
);
UPDATE landing_content_items
SET publication_date = DATE(COALESCE(publish_from, created_at))
WHERE publication_date IS NULL;

CREATE TABLE IF NOT EXISTS landing_content_media (
  id CHAR(36) NOT NULL,
  content_item_id CHAR(36) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  alt_text VARCHAR(300) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_cover TINYINT(1) NOT NULL DEFAULT 0,
  created_by CHAR(36) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_landing_media_item_path (content_item_id, file_path),
  KEY idx_landing_media_item (content_item_id, is_cover, sort_order),
  CONSTRAINT fk_landing_media_item FOREIGN KEY (content_item_id)
    REFERENCES landing_content_items(id) ON DELETE CASCADE,
  CONSTRAINT fk_landing_media_creator FOREIGN KEY (created_by)
    REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

INSERT IGNORE INTO landing_content_media
(id, content_item_id, file_path, alt_text, sort_order, is_cover, created_by)
SELECT UUID(), id, image_path, title, 0, 1, created_by
FROM landing_content_items
WHERE image_path IS NOT NULL AND image_path <> '';

-- ---------------------------------------------------------------------------
-- Versioned privacy policy and terms acceptance
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS policy_documents (
  id CHAR(36) NOT NULL,
  document_type ENUM('PRIVACY_POLICY','TERMS_AND_CONDITIONS') NOT NULL,
  version VARCHAR(40) NOT NULL,
  title VARCHAR(220) NOT NULL,
  body MEDIUMTEXT NOT NULL,
  status ENUM('DRAFT','PUBLISHED','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
  published_at DATETIME NULL,
  created_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_policy_type_version (document_type, version),
  KEY idx_policy_current (document_type, status, published_at),
  CONSTRAINT fk_policy_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_policy_updater FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS policy_acceptances (
  id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  document_id CHAR(36) NOT NULL,
  document_type ENUM('PRIVACY_POLICY','TERMS_AND_CONDITIONS') NOT NULL,
  document_version VARCHAR(40) NOT NULL,
  accepted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(64) NULL,
  user_agent VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_policy_acceptance_user_document (user_id, document_id),
  KEY idx_policy_acceptance_user_type (user_id, document_type, accepted_at),
  CONSTRAINT fk_policy_acceptance_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_policy_acceptance_document FOREIGN KEY (document_id) REFERENCES policy_documents(id)
) ENGINE=InnoDB;

INSERT IGNORE INTO policy_documents
(id, document_type, version, title, body, status, published_at)
VALUES
(
  '72000000-0000-4000-8000-000000000001',
  'PRIVACY_POLICY',
  '1.0',
  'KLD School Clinic Privacy Policy',
  'The KLD School Clinic collects and processes identity, contact, enrollment or employment, appointment, visit, consultation, medicine, form, and related health information to provide clinic services, maintain accurate medical records, support referrals, communicate authorized results, protect campus health, and meet legitimate administrative and legal obligations.\n\nAccess is limited according to assigned roles and patient ownership. Sensitive medical information is not intended for public disclosure. Important access, changes, exports, and clinical actions are audited. Information is retained according to approved school and clinic policies, and reasonable safeguards are applied to accounts, sessions, uploads, database access, backups, and email delivery.\n\nQuestions, correction requests, or privacy concerns may be directed to the clinic or the authorized school privacy office using the contact information published in the system.',
  'PUBLISHED',
  NOW()
),
(
  '72000000-0000-4000-8000-000000000002',
  'TERMS_AND_CONDITIONS',
  '1.0',
  'KLD School Clinic System Terms and Conditions',
  'This system is provided for authorized school-clinic operations and permitted patient self-service. Users must provide accurate information, protect their credentials, use only the records and functions they are authorized to access, and immediately report suspected unauthorized access.\n\nThe portal does not replace emergency services. Urgent or life-threatening concerns must be brought directly to the clinic or appropriate emergency responders. Appointment requests remain subject to clinic confirmation, capacity, operating schedules, and professional assessment.\n\nUnauthorized access, disclosure, alteration, copying, or misuse of medical information is prohibited. System activity may be logged and reviewed for security, privacy, quality, and accountability. Continued access may be suspended when these terms or applicable policies are violated.',
  'PUBLISHED',
  NOW()
);

-- ---------------------------------------------------------------------------
-- Patient and medicine archives
-- ---------------------------------------------------------------------------
CALL kld_add_column_if_missing('patients', 'pre_archive_status', '`pre_archive_status` VARCHAR(20) NULL AFTER `status`');
CALL kld_add_column_if_missing('patients', 'archived_at', '`archived_at` DATETIME NULL AFTER `pre_archive_status`');
CALL kld_add_column_if_missing('patients', 'archived_by', '`archived_by` CHAR(36) NULL AFTER `archived_at`');
CALL kld_add_column_if_missing('patients', 'archive_reason', '`archive_reason` VARCHAR(1000) NULL AFTER `archived_by`');
CALL kld_add_column_if_missing('patients', 'unarchived_at', '`unarchived_at` DATETIME NULL AFTER `archive_reason`');
CALL kld_add_column_if_missing('patients', 'unarchived_by', '`unarchived_by` CHAR(36) NULL AFTER `unarchived_at`');
CALL kld_add_index_if_missing('patients', 'idx_patients_archive', 'KEY `idx_patients_archive` (`archived_at`, `patient_type`, `status`)');
CALL kld_add_fk_if_missing('patients', 'fk_patients_archived_by', 'FOREIGN KEY (`archived_by`) REFERENCES `users`(`id`) ON DELETE SET NULL');
CALL kld_add_fk_if_missing('patients', 'fk_patients_unarchived_by', 'FOREIGN KEY (`unarchived_by`) REFERENCES `users`(`id`) ON DELETE SET NULL');

CALL kld_add_column_if_missing('medicines', 'pre_archive_is_active', '`pre_archive_is_active` TINYINT(1) NULL AFTER `is_active`');
CALL kld_add_column_if_missing('medicines', 'archived_at', '`archived_at` DATETIME NULL AFTER `pre_archive_is_active`');
CALL kld_add_column_if_missing('medicines', 'archived_by', '`archived_by` CHAR(36) NULL AFTER `archived_at`');
CALL kld_add_column_if_missing('medicines', 'archive_reason', '`archive_reason` VARCHAR(1000) NULL AFTER `archived_by`');
CALL kld_add_column_if_missing('medicines', 'unarchived_at', '`unarchived_at` DATETIME NULL AFTER `archive_reason`');
CALL kld_add_column_if_missing('medicines', 'unarchived_by', '`unarchived_by` CHAR(36) NULL AFTER `unarchived_at`');
CALL kld_add_index_if_missing('medicines', 'idx_medicines_archive', 'KEY `idx_medicines_archive` (`archived_at`, `is_active`)');
CALL kld_add_fk_if_missing('medicines', 'fk_medicines_archived_by', 'FOREIGN KEY (`archived_by`) REFERENCES `users`(`id`) ON DELETE SET NULL');
CALL kld_add_fk_if_missing('medicines', 'fk_medicines_unarchived_by', 'FOREIGN KEY (`unarchived_by`) REFERENCES `users`(`id`) ON DELETE SET NULL');

CREATE TABLE IF NOT EXISTS archive_events (
  id CHAR(36) NOT NULL,
  entity_type ENUM('PATIENT','MEDICINE') NOT NULL,
  entity_id CHAR(36) NOT NULL,
  action ENUM('ARCHIVE','UNARCHIVE') NOT NULL,
  reason VARCHAR(1000) NULL,
  actor_user_id CHAR(36) NOT NULL,
  metadata_json LONGTEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_archive_events_entity (entity_type, entity_id, created_at),
  KEY idx_archive_events_actor (actor_user_id, created_at),
  CONSTRAINT fk_archive_events_actor FOREIGN KEY (actor_user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- Generic idempotency records for high-consequence submissions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS api_idempotency_keys (
  id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  scope VARCHAR(80) NOT NULL,
  idempotency_key VARCHAR(120) NOT NULL,
  resource_type VARCHAR(80) NULL,
  resource_id CHAR(36) NULL,
  response_json LONGTEXT NULL,
  expires_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_api_idempotency_user_scope_key (user_id, scope, idempotency_key),
  KEY idx_api_idempotency_expiry (expires_at),
  CONSTRAINT fk_api_idempotency_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

INSERT INTO system_settings (setting_key, setting_value, value_type, group_name)
VALUES ('system_version','1.2.0','STRING','SYSTEM')
ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value), updated_at=NOW();

INSERT INTO schema_migrations (version, description)
VALUES (
  '002_upgrade_v1_2_0',
  'Landing galleries, policy acknowledgment, archives, and duplicate-submission safeguards'
)
ON DUPLICATE KEY UPDATE description=VALUES(description), applied_at=CURRENT_TIMESTAMP;

DROP PROCEDURE IF EXISTS kld_add_column_if_missing;
DROP PROCEDURE IF EXISTS kld_add_index_if_missing;
DROP PROCEDURE IF EXISTS kld_add_fk_if_missing;

SET FOREIGN_KEY_CHECKS = 1;
