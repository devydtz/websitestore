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
