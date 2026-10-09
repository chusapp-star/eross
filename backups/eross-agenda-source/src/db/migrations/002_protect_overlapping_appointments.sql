-- Apply after checking existing overlaps. Tested on isolated Neon QA branch 2026-10-09.
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE agenda_appointments
  ADD CONSTRAINT agenda_no_overlapping_active_responsible
  EXCLUDE USING gist (
    company_id WITH =,
    responsible_user_id WITH =,
    tstzrange(reserved_starts_at,reserved_ends_at,'[)') WITH &&
  ) WHERE (responsible_user_id IS NOT NULL AND status <> 'cancelled');
