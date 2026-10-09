-- QA groundwork: credentials are separate from tenant memberships.
-- No passwords or hashes are seeded by this migration.
CREATE TABLE IF NOT EXISTS eross_identity_credentials (
 identity_id uuid PRIMARY KEY REFERENCES eross_identities(id) ON DELETE CASCADE,
 password_hash text NOT NULL,
 password_salt text NOT NULL,
 password_algorithm text NOT NULL DEFAULT 'scrypt-v1'
   CHECK (password_algorithm='scrypt-v1'),
 password_updated_at timestamptz NOT NULL DEFAULT now(),
 login_disabled boolean NOT NULL DEFAULT false
);
CREATE TABLE IF NOT EXISTS eross_identity_login_audit (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 identity_id uuid REFERENCES eross_identities(id) ON DELETE SET NULL,
 email_fingerprint text,
 success boolean NOT NULL,
 failure_reason text,
 occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS eross_identity_login_audit_recent
 ON eross_identity_login_audit(occurred_at DESC);
