ALTER TABLE mykids_printer_settings
  ADD COLUMN bridge_token VARCHAR(64) NULL AFTER bridge_url,
  ADD COLUMN bridge_last_seen_at TIMESTAMP NULL AFTER bridge_token;

CREATE TABLE IF NOT EXISTS mykids_print_jobs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  zpl MEDIUMTEXT NOT NULL,
  printer_name VARCHAR(160) NULL,
  status ENUM('pending', 'printing', 'printed', 'failed') NOT NULL DEFAULT 'pending',
  error_message VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  claimed_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  PRIMARY KEY (id),
  KEY idx_mykids_print_jobs_queue (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
