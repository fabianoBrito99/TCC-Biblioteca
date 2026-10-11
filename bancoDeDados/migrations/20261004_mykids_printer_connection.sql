ALTER TABLE mykids_printer_settings
  ADD COLUMN detected_printer_name VARCHAR(160) NULL AFTER printer_name,
  ADD COLUMN printer_online TINYINT(1) NOT NULL DEFAULT 0 AFTER bridge_last_seen_at,
  ADD COLUMN printer_last_error VARCHAR(500) NULL AFTER printer_online,
  ADD COLUMN bridge_version VARCHAR(30) NULL AFTER printer_last_error;
