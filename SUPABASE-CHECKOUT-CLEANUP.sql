-- Lunaris Craft checkout repair script.
-- Safe to run more than once. It keeps existing orders/accounts.

CREATE TABLE IF NOT EXISTS orders (
  id text PRIMARY KEY,
  username text NOT NULL,
  edition text NOT NULL,
  email text NOT NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_cents integer NOT NULL DEFAULT 0,
  total_display text NOT NULL DEFAULT 'PHP 0',
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
  status_history jsonb NOT NULL DEFAULT '[]'::jsonb,
  receipt_issued_at timestamptz,
  delivered_at timestamptz,
  delivery_log jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS gcash_name text,
  ADD COLUMN IF NOT EXISTS reference_no text,
  ADD COLUMN IF NOT EXISTS promo_code text,
  ADD COLUMN IF NOT EXISTS discount_cents integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_display text DEFAULT 'PHP 0',
  ADD COLUMN IF NOT EXISTS subtotal_cents integer,
  ADD COLUMN IF NOT EXISTS subtotal_display text,
  ADD COLUMN IF NOT EXISTS admin_note text,
  ADD COLUMN IF NOT EXISTS status_history jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS receipt_issued_at timestamptz,
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
  ADD COLUMN IF NOT EXISTS delivery_log jsonb DEFAULT '[]'::jsonb;

ALTER TABLE orders
  ALTER COLUMN items SET DEFAULT '[]'::jsonb,
  ALTER COLUMN method SET DEFAULT 'gcash',
  ALTER COLUMN status SET DEFAULT 'pending',
  ALTER COLUMN discount_cents SET DEFAULT 0,
  ALTER COLUMN discount_display SET DEFAULT 'PHP 0',
  ALTER COLUMN status_history SET DEFAULT '[]'::jsonb,
  ALTER COLUMN delivery_log SET DEFAULT '[]'::jsonb;

UPDATE orders
SET
  items = COALESCE(items, '[]'::jsonb),
  total_cents = COALESCE(total_cents, 0),
  total_display = COALESCE(total_display, 'PHP 0'),
  method = COALESCE(method, 'gcash'),
  status = COALESCE(status, 'pending'),
  discount_cents = COALESCE(discount_cents, 0),
  discount_display = COALESCE(discount_display, 'PHP 0'),
  subtotal_cents = COALESCE(subtotal_cents, total_cents),
  subtotal_display = COALESCE(subtotal_display, total_display),
  status_history = CASE
    WHEN status_history IS NULL OR status_history = '[]'::jsonb THEN jsonb_build_array(
      jsonb_build_object('status', 'submitted', 'label', 'Order submitted', 'at', COALESCE(created_at, now())),
      jsonb_build_object('status', COALESCE(status, 'pending'), 'label', 'Current status: ' || COALESCE(status, 'pending'), 'at', COALESCE(created_at, now()))
    )
    ELSE status_history
  END,
  receipt_issued_at = COALESCE(receipt_issued_at, created_at, now()),
  delivery_log = COALESCE(delivery_log, '[]'::jsonb)
WHERE true;

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_orders" ON orders;
CREATE POLICY "anon_select_orders" ON orders FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_orders" ON orders;
CREATE POLICY "anon_insert_orders" ON orders FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_orders" ON orders;
CREATE POLICY "anon_update_orders" ON orders FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_reference_no_key;
DROP INDEX IF EXISTS orders_reference_no_key;
DROP INDEX IF EXISTS orders_reference_no_unique_idx;

CREATE INDEX IF NOT EXISTS orders_reference_no_idx
  ON orders (reference_no)
  WHERE reference_no IS NOT NULL AND length(reference_no) > 0;
CREATE INDEX IF NOT EXISTS orders_email_idx ON orders (email);
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders (status);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders (created_at DESC);

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

ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS disabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS history_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_spent_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_spent_display text NOT NULL DEFAULT 'PHP 0',
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz NOT NULL DEFAULT now();

UPDATE accounts
SET
  display_name = COALESCE(display_name, username),
  email_verified = COALESCE(email_verified, false),
  disabled = COALESCE(disabled, false),
  history_count = COALESCE(history_count, 0),
  total_spent_cents = COALESCE(total_spent_cents, 0),
  total_spent_display = COALESCE(total_spent_display, 'PHP 0'),
  last_seen_at = COALESCE(last_seen_at, created_at, now())
WHERE true;

CREATE TABLE IF NOT EXISTS deleted_accounts (
  id text PRIMARY KEY,
  deleted_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE deleted_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_accounts" ON accounts;
CREATE POLICY "anon_select_accounts" ON accounts FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_accounts" ON accounts;
CREATE POLICY "anon_insert_accounts" ON accounts FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_accounts" ON accounts;
CREATE POLICY "anon_update_accounts" ON accounts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_accounts" ON accounts;
CREATE POLICY "anon_delete_accounts" ON accounts FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_deleted_accounts" ON deleted_accounts;
CREATE POLICY "anon_select_deleted_accounts" ON deleted_accounts FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_deleted_accounts" ON deleted_accounts;
CREATE POLICY "anon_insert_deleted_accounts" ON deleted_accounts FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_deleted_accounts" ON deleted_accounts;
CREATE POLICY "anon_update_deleted_accounts" ON deleted_accounts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_deleted_accounts" ON deleted_accounts;
CREATE POLICY "anon_delete_deleted_accounts" ON deleted_accounts FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS accounts_email_idx ON accounts (email);
CREATE INDEX IF NOT EXISTS accounts_created_at_idx ON accounts (created_at DESC);

CREATE TABLE IF NOT EXISTS promo_codes (
  code text PRIMARY KEY,
  label text NOT NULL,
  description text,
  kind text NOT NULL CHECK (kind IN ('percent', 'fixed')),
  amount integer NOT NULL,
  min_subtotal_cents integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  max_uses integer,
  used_count integer NOT NULL DEFAULT 0,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_promo_codes" ON promo_codes;
CREATE POLICY "anon_select_promo_codes" ON promo_codes FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_promo_codes" ON promo_codes;
CREATE POLICY "anon_insert_promo_codes" ON promo_codes FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_promo_codes" ON promo_codes;
CREATE POLICY "anon_update_promo_codes" ON promo_codes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_promo_codes" ON promo_codes;
CREATE POLICY "anon_delete_promo_codes" ON promo_codes FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS promo_codes_active_idx ON promo_codes (active);

NOTIFY pgrst, 'reload schema';
