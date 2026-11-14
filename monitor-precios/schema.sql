CREATE TABLE IF NOT EXISTS snapshots (source text NOT NULL, captured_at text NOT NULL, items jsonb NOT NULL, PRIMARY KEY(source,captured_at));
CREATE TABLE IF NOT EXISTS refresh_lock (name text PRIMARY KEY, until_ms bigint NOT NULL);
CREATE TABLE IF NOT EXISTS accounts (email text PRIMARY KEY, credential text NOT NULL, role text NOT NULL DEFAULT 'client' CHECK(role IN ('admin','client')), active boolean NOT NULL DEFAULT true);
CREATE TABLE IF NOT EXISTS sessions (digest text PRIMARY KEY, email text NOT NULL REFERENCES accounts(email) ON DELETE CASCADE, expires_at timestamptz NOT NULL);
CREATE INDEX IF NOT EXISTS monitor_session_expiry ON sessions(expires_at);
CREATE TABLE IF NOT EXISTS auth_attempts (scope text PRIMARY KEY, started_at timestamptz NOT NULL, attempts integer NOT NULL);
