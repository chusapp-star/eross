-- First QA-only step toward tenant-aware identity.
-- Does not change legacy admin sessions or existing agenda users.
CREATE TABLE IF NOT EXISTS eross_identities (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 email text NOT NULL,
 display_name text NOT NULL,
 active boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(email)
);
CREATE TABLE IF NOT EXISTS eross_company_memberships (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 identity_id uuid NOT NULL REFERENCES eross_identities(id),
 company_id uuid NOT NULL REFERENCES agenda_companies(id),
 role text NOT NULL CHECK(role IN ('admin','supervisor','collaborator')),
 active boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(identity_id,company_id)
);
CREATE INDEX IF NOT EXISTS eross_company_memberships_company_idx ON eross_company_memberships(company_id) WHERE active;
