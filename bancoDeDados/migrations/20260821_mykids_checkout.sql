ALTER TABLE mykids_checkins
  ADD COLUMN arrival_number INT UNSIGNED NULL AFTER room_name_snapshot,
  ADD COLUMN checked_out_at TIMESTAMP NULL AFTER arrival_number,
  ADD INDEX idx_mykids_checkins_active_day (created_at, checked_out_at);
