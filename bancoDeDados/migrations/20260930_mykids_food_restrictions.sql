ALTER TABLE mykids_children
  ADD COLUMN food_restriction_notes TEXT NULL AFTER has_food_restriction;

ALTER TABLE mykids_checkins
  ADD COLUMN child_food_restriction_notes_snapshot TEXT NULL
  AFTER child_has_food_restriction_snapshot;
