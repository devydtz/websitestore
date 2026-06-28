CREATE TABLE IF NOT EXISTS orders (
  id text PRIMARY KEY,
  username text NOT NULL,
  edition text NOT NULL,
  email text NOT NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_cents integer NOT NULL,
  total_display text NOT NULL,
  method text NOT NULL DEFAULT 'gcash',
  gcash_number text,
  gcash_name text,
  reference_no text,
  promo_code text,
  discount_cents integer DEFAULT 0,
  discount_display text DEFAULT 'PHP 0',
  subtotal_cents integer,
  subtotal_display text,
  status text NOT NULL DEFAULT 'pending',
  admin_note text,
  delivered_at timestamptz,
  delivery_log jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_orders" ON orders;
CREATE POLICY "anon_select_orders" ON orders FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_orders" ON orders;
CREATE POLICY "anon_insert_orders" ON orders FOR INSERT
  TO anon, authenticated WITH CHECK (true);

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS promo_code text,
  ADD COLUMN IF NOT EXISTS discount_cents integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_display text DEFAULT 'PHP 0',
  ADD COLUMN IF NOT EXISTS subtotal_cents integer,
  ADD COLUMN IF NOT EXISTS subtotal_display text;

UPDATE orders
SET
  discount_cents = COALESCE(discount_cents, 0),
  discount_display = COALESCE(discount_display, 'PHP 0'),
  subtotal_cents = COALESCE(subtotal_cents, total_cents),
  subtotal_display = COALESCE(subtotal_display, total_display);

DROP POLICY IF EXISTS "anon_update_orders" ON orders;
CREATE POLICY "anon_update_orders" ON orders FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

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

CREATE TABLE IF NOT EXISTS deleted_accounts (
  id text PRIMARY KEY,
  deleted_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE deleted_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_accounts" ON accounts;
CREATE POLICY "anon_select_accounts" ON accounts FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_accounts" ON accounts;
CREATE POLICY "anon_insert_accounts" ON accounts FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_accounts" ON accounts;
CREATE POLICY "anon_update_accounts" ON accounts FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_accounts" ON accounts;
CREATE POLICY "anon_delete_accounts" ON accounts FOR DELETE
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_deleted_accounts" ON deleted_accounts;
CREATE POLICY "anon_select_deleted_accounts" ON deleted_accounts FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_deleted_accounts" ON deleted_accounts;
CREATE POLICY "anon_insert_deleted_accounts" ON deleted_accounts FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_deleted_accounts" ON deleted_accounts;
CREATE POLICY "anon_update_deleted_accounts" ON deleted_accounts FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_deleted_accounts" ON deleted_accounts;
CREATE POLICY "anon_delete_deleted_accounts" ON deleted_accounts FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS accounts_email_idx ON accounts (email);
CREATE INDEX IF NOT EXISTS accounts_created_at_idx ON accounts (created_at DESC);
