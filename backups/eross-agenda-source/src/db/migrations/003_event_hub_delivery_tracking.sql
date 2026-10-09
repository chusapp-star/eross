-- EROSS Event Hub: delivery tracking, no outbound credentials stored in database.
ALTER TABLE agenda_integration_outbox
  ADD COLUMN IF NOT EXISTS delivery_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS attempt_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_attempt_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_error text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
CREATE UNIQUE INDEX IF NOT EXISTS agenda_outbox_event_destination_unique
  ON agenda_integration_outbox ((payload->>'event_id'),destination)
  WHERE payload ? 'event_id';
CREATE INDEX IF NOT EXISTS agenda_outbox_delivery_due
  ON agenda_integration_outbox (next_attempt_at,created_at)
  WHERE delivery_status IN ('pending','retry');
