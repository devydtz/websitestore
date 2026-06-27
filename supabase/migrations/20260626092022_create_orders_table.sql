/*
# Create orders table for Lunaris Craft store

## Purpose
Persist GCash checkout orders so the store admin can review and confirm payments.
When an admin confirms a payment, an edge function delivers the purchased items
in-game on the Minecraft server.

## New Tables
- `orders`
  - `id` (text, primary key) — human-readable order id, e.g. "LC-AB12CD"
  - `username` (text, not null) — Minecraft username the purchase is for
  - `edition` (text, not null) — "java" or "bedrock"
  - `email` (text, not null) — buyer contact email
  - `items` (jsonb, not null) — array of { id, name, price, qty }
  - `total_cents` (integer, not null) — total in centavos (PHP)
  - `total_display` (text, not null) — formatted total, e.g. "₱249"
  - `method` (text, not null default 'gcash') — payment method
  - `gcash_number` (text) — buyer's GCash number
  - `gcash_name` (text) — name on GCash account
  - `reference_no` (text) — GCash reference number
  - `status` (text, not null default 'pending') — pending | confirmed | rejected | delivered
  - `admin_note` (text) — optional note from admin
  - `delivered_at` (timestamptz) — when items were delivered in-game
  - `delivery_log` (jsonb) — log of commands sent to the Minecraft server
  - `created_at` (timestamptz, default now())

## Security
- RLS enabled on `orders`.
- The store has no Supabase auth (it uses its own localStorage accounts), so the
  anon-key client must be able to INSERT new orders and SELECT orders.
- SELECT + INSERT open to anon/authenticated. UPDATE/DELETE have no anon policy,
  so only the service role (used by the edge function) can mutate order status.
*/

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

DROP POLICY IF EXISTS "anon_update_orders" ON orders;
CREATE POLICY "anon_update_orders" ON orders FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS orders_status_idx ON orders (status);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders (created_at DESC);
