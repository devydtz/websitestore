CREATE TABLE IF NOT EXISTS accounts (
  id text PRIMARY KEY,
  username text NOT NULL,
  edition text NOT NULL,
  email text NOT NULL,
  display_name text NOT NULL,
  email_verified boolean NOT NULL DEFAULT false,
  disabled boolean NOT NULL DEFAULT false,
  history_count integer NOT NULL DEFAULT 0,
  total_spent_cents integer NOT NULL DEFAULT 0,
  total_spent_display text NOT NULL DEFAULT 'PHP 0',
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_accounts" ON accounts;
CREATE POLICY "anon_select_accounts" ON accounts FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_accounts" ON accounts;
CREATE POLICY "anon_insert_accounts" ON accounts FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_accounts" ON accounts;
CREATE POLICY "anon_update_accounts" ON accounts FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS accounts_email_idx ON accounts (email);
CREATE INDEX IF NOT EXISTS accounts_created_at_idx ON accounts (created_at DESC);
