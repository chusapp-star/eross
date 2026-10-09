-- Worker claims use a lease and unique message id; apply to isolated QA first.
ALTER TABLE agenda_integration_outbox
 ADD COLUMN IF NOT EXISTS leased_until timestamptz,
 ADD COLUMN IF NOT EXISTS lease_token uuid;
CREATE INDEX IF NOT EXISTS agenda_outbox_claim_idx
 ON agenda_integration_outbox(next_attempt_at,created_at)
 WHERE delivery_status IN ('pending','retry','processing');
