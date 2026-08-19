CREATE TABLE IF NOT EXISTS mykids_rooms (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  age_range VARCHAR(80) NOT NULL,
  is_open TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_mykids_rooms_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mykids_guardians (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(160) NOT NULL,
  email VARCHAR(254) NULL,
  phone VARCHAR(30) NULL,
  status ENUM('visitante', 'familia') NOT NULL DEFAULT 'visitante',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_mykids_guardians_name (name),
  KEY idx_mykids_guardians_email (email),
  KEY idx_mykids_guardians_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mykids_children (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  guardian_id INT UNSIGNED NOT NULL,
  name VARCHAR(160) NOT NULL,
  birth_date DATE NULL,
  gender VARCHAR(30) NULL,
  notes TEXT NULL,
  room_id INT UNSIGNED NULL,
  checkins_count INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_mykids_children_guardian (guardian_id),
  KEY idx_mykids_children_room (room_id),
  CONSTRAINT fk_mykids_children_guardian FOREIGN KEY (guardian_id)
    REFERENCES mykids_guardians (id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_mykids_children_room FOREIGN KEY (room_id)
    REFERENCES mykids_rooms (id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mykids_checkins (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  public_code VARCHAR(64) NOT NULL,
  guardian_id INT UNSIGNED NOT NULL,
  child_id INT UNSIGNED NOT NULL,
  room_id INT UNSIGNED NOT NULL,
  child_name_snapshot VARCHAR(160) NOT NULL,
  guardian_name_snapshot VARCHAR(160) NOT NULL,
  guardian_email_snapshot VARCHAR(254) NULL,
  guardian_phone_snapshot VARCHAR(30) NULL,
  child_birth_date_snapshot DATE NULL,
  child_notes_snapshot TEXT NULL,
  room_name_snapshot VARCHAR(120) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_mykids_checkins_public_code (public_code),
  KEY idx_mykids_checkins_created_at (created_at),
  KEY idx_mykids_checkins_guardian (guardian_id),
  KEY idx_mykids_checkins_child (child_id),
  KEY idx_mykids_checkins_room (room_id),
  CONSTRAINT fk_mykids_checkins_guardian FOREIGN KEY (guardian_id)
    REFERENCES mykids_guardians (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_mykids_checkins_child FOREIGN KEY (child_id)
    REFERENCES mykids_children (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_mykids_checkins_room FOREIGN KEY (room_id)
    REFERENCES mykids_rooms (id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mykids_printer_settings (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  printer_name VARCHAR(160) NULL,
  bridge_url VARCHAR(500) NULL,
  label_width DECIMAL(8,2) NOT NULL DEFAULT 62,
  label_height DECIMAL(8,2) NOT NULL DEFAULT 29,
  is_active TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO mykids_rooms (name, age_range, is_open) VALUES
  ('Sala 02 a 05 anos', '2 a 5 anos', 1),
  ('Sala 06 a 08 anos', '6 a 8 anos', 1);

INSERT INTO mykids_printer_settings
  (id, printer_name, bridge_url, label_width, label_height, is_active)
VALUES (1, NULL, NULL, 62, 29, 0)
ON DUPLICATE KEY UPDATE id = id;
