ALTER TABLE mykids_checkins
  ADD COLUMN created_by_user_id INT NULL AFTER checked_out_at,
  ADD INDEX idx_mykids_checkins_created_by (created_by_user_id);

CREATE TABLE IF NOT EXISTS mykids_room_sessions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  room_id INT UNSIGNED NOT NULL,
  room_name_snapshot VARCHAR(120) NOT NULL,
  opened_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP NULL,
  auto_close_snoozed_until TIMESTAMP NULL,
  closed_automatically TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_mykids_room_sessions_room (room_id, opened_at),
  KEY idx_mykids_room_sessions_closed (closed_at),
  CONSTRAINT fk_mykids_room_sessions_room FOREIGN KEY (room_id)
    REFERENCES mykids_rooms (id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO mykids_room_sessions (room_id, room_name_snapshot, opened_at, closed_at)
SELECT c.room_id, MAX(c.room_name_snapshot), MIN(c.created_at), MAX(COALESCE(c.checked_out_at, c.created_at))
FROM mykids_checkins c
JOIN mykids_rooms r ON r.id = c.room_id
WHERE DATE(c.created_at) < CURDATE() OR r.is_open = 0
GROUP BY c.room_id, DATE(c.created_at);

INSERT INTO mykids_room_sessions (room_id, room_name_snapshot, opened_at)
SELECT c.room_id, MAX(c.room_name_snapshot), MIN(c.created_at)
FROM mykids_checkins c
JOIN mykids_rooms r ON r.id = c.room_id
WHERE DATE(c.created_at) = CURDATE() AND r.is_open = 1
GROUP BY c.room_id;
