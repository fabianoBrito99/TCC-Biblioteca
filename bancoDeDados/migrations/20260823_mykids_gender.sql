ALTER TABLE mykids_guardians
  ADD COLUMN gender CHAR(1) NULL AFTER phone;

UPDATE mykids_children SET gender = 'M'
WHERE gender = 'Masculino';

UPDATE mykids_children SET gender = 'F'
WHERE gender = 'Feminino';
