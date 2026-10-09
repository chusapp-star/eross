-- TEST ONLY. In a real CRM this inbox belongs to the CRM's isolated database.
CREATE TABLE IF NOT EXISTS eross_crm_qa_received (
 event_id uuid PRIMARY KEY,
 company_id uuid NOT NULL,
 event_type text NOT NULL,
 payload jsonb NOT NULL,
 received_at timestamptz NOT NULL DEFAULT now()
);
