-- KLD School EMR v1.2.0 post-migration verification
-- Read-only checks. Run after 002_upgrade_v1_2_0.sql.

USE kld_school_emr;

SELECT version, description, applied_at
FROM schema_migrations
WHERE version = '002_upgrade_v1_2_0';

SELECT setting_key, setting_value
FROM system_settings
WHERE setting_key = 'system_version';

SELECT table_name
FROM information_schema.tables
WHERE table_schema = DATABASE()
  AND table_name IN (
    'landing_content_media',
    'policy_documents',
    'policy_acceptances',
    'archive_events',
    'api_idempotency_keys'
  )
ORDER BY table_name;

SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = DATABASE()
  AND (
    (table_name = 'landing_content_items' AND column_name = 'publication_date') OR
    (table_name = 'patients' AND column_name IN (
      'pre_archive_status','archived_at','archived_by','archive_reason','unarchived_at','unarchived_by'
    )) OR
    (table_name = 'medicines' AND column_name IN (
      'pre_archive_is_active','archived_at','archived_by','archive_reason','unarchived_at','unarchived_by'
    ))
  )
ORDER BY table_name, column_name;

SELECT code
FROM permissions
WHERE code IN (
  'policies.manage',
  'archives.read',
  'patients.archive',
  'patients.unarchive',
  'medicines.archive',
  'medicines.unarchive'
)
ORDER BY code;

SELECT document_type, version, title, status, published_at
FROM policy_documents
WHERE status = 'PUBLISHED'
ORDER BY document_type;

SELECT
  (SELECT COUNT(*) FROM patients) AS patients_total,
  (SELECT COUNT(*) FROM patients WHERE archived_at IS NOT NULL) AS patients_archived,
  (SELECT COUNT(*) FROM medicines) AS medicines_total,
  (SELECT COUNT(*) FROM medicines WHERE archived_at IS NOT NULL) AS medicines_archived,
  (SELECT COUNT(*) FROM visits) AS visits_total,
  (SELECT COUNT(*) FROM consultations) AS consultations_total,
  (SELECT COUNT(*) FROM medicine_issuances) AS medicine_issuances_total;

-- Expected:
-- 1) schema_migrations contains 002_upgrade_v1_2_0.
-- 2) system_version is 1.2.0.
-- 3) all five new tables are returned.
-- 4) all archive/publication columns are returned.
-- 5) all six permissions are returned.
-- 6) one published Privacy Policy and one published Terms and Conditions version are returned.
-- 7) existing patient, visit, consultation, medicine, and issuance totals remain intact.
