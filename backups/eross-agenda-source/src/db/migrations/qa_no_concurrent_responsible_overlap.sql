-- QA migration only. Apply only to Neon QA branch after validating existing records.
-- Ensures concurrent requests cannot reserve overlapping buffer windows for one responsible.
-- Existing collision count must be zero before applying.
SELECT count(*) AS collisions
FROM agenda_appointments a
JOIN agenda_appointments b ON a.id < b.id AND a.company_id = b.company_id
 AND a.responsible_user_id = b.responsible_user_id
 AND tstzrange(a.reserved_starts_at,a.reserved_ends_at,'[)') && tstzrange(b.reserved_starts_at,b.reserved_ends_at,'[)')
WHERE a.responsible_user_id IS NOT NULL AND a.status <> 'cancelled' AND b.status <> 'cancelled';

-- Needs btree_gist for UUID equality (already used by the existing GiST index).
ALTER TABLE agenda_appointments
  ADD CONSTRAINT agenda_qa_no_concurrent_responsible_overlap
  EXCLUDE USING gist (
    company_id WITH =,
    responsible_user_id WITH =,
    tstzrange(reserved_starts_at,reserved_ends_at,'[)') WITH &&
  )
  WHERE (responsible_user_id IS NOT NULL AND status <> 'cancelled');
