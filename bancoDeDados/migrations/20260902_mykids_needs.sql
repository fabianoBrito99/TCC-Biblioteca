ALTER TABLE mykids_children
  ADD COLUMN has_autism TINYINT(1) NOT NULL DEFAULT 0 AFTER gender,
  ADD COLUMN autism_type VARCHAR(120) NULL AFTER has_autism,
  ADD COLUMN has_food_restriction TINYINT(1) NOT NULL DEFAULT 0 AFTER autism_type;

ALTER TABLE mykids_checkins
  ADD COLUMN child_has_autism_snapshot TINYINT(1) NOT NULL DEFAULT 0 AFTER child_birth_date_snapshot,
  ADD COLUMN child_autism_type_snapshot VARCHAR(120) NULL AFTER child_has_autism_snapshot,
  ADD COLUMN child_has_food_restriction_snapshot TINYINT(1) NOT NULL DEFAULT 0 AFTER child_autism_type_snapshot;
