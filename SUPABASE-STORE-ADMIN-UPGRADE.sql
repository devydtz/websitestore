ALTER TABLE promo_codes
ADD COLUMN IF NOT EXISTS max_uses_per_user integer;

CREATE TABLE IF NOT EXISTS store_products (
  id text PRIMARY KEY,
  category text NOT NULL CHECK (category IN ('rank', 'key', 'bundle')),
  name text NOT NULL,
  tagline text NOT NULL DEFAULT '',
  price_cents integer NOT NULL DEFAULT 0 CHECK (price_cents >= 0),
  price_display text NOT NULL DEFAULT 'PHP 0',
  perks jsonb NOT NULL DEFAULT '[]'::jsonb,
  active boolean NOT NULL DEFAULT true,
  coming_soon boolean NOT NULL DEFAULT false,
  featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE store_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "store_products_read_all" ON store_products;
DROP POLICY IF EXISTS "store_products_insert_all" ON store_products;
DROP POLICY IF EXISTS "store_products_update_all" ON store_products;
DROP POLICY IF EXISTS "store_products_delete_all" ON store_products;

CREATE POLICY "store_products_read_all" ON store_products FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "store_products_insert_all" ON store_products FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "store_products_update_all" ON store_products FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "store_products_delete_all" ON store_products FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS store_products_category_sort_idx ON store_products (category, sort_order);

INSERT INTO store_products
  (id, category, name, tagline, price_cents, price_display, perks, active, coming_soon, featured, sort_order)
VALUES
  ('rank-crescent', 'rank', 'Crescent', 'Your first step into the Lunaris realm.', 9900, 'PHP 99',
   '["5,000 Claim Blocks","2 PWarps (/pw create)","5 Sethomes (/sethome)","3 vaults (/pv)","/workbench"]'::jsonb,
   true, false, false, 10),
  ('rank-nebula', 'rank', 'Nebula', 'A stronger start with extra comfort perks.', 19900, 'PHP 199',
   '["7,500 Claim Blocks","3 PWarps (/pw create)","7 Sethomes (/sethome)","5 vaults (/pv)","/workbench"]'::jsonb,
   true, false, false, 20),
  ('rank-solstice', 'rank', 'Solstice', 'A balanced upgrade for active players.', 29900, 'PHP 299',
   '["10,000 Claim Blocks","5 PWarps (/pw create)","8 Sethomes (/sethome)","7 vaults (/pv)","/cfly (claim fly)","/workbench","/anvil","Cosmetic Key draw"]'::jsonb,
   true, false, true, 30),
  ('rank-celestial', 'rank', 'Celestial', 'Premium perks for players who want to stand out.', 39900, 'PHP 399',
   '["15,000 Claim Blocks","7 PWarps (/pw create)","10 Sethomes (/sethome)","10 vaults (/pv)","/nick","/cfly (claim fly)","/workbench","/anvil","/glow","/cc (change chat colors)","/repair","3 orders (/orders)","2x Cosmetic Key draw"]'::jsonb,
   true, false, false, 40),
  ('rank-monarch', 'rank', 'Monarch', 'The highest Lunaris rank package.', 49900, 'PHP 499',
   '["20,000 Claim Blocks","10 PWarps (/pw create)","15 Sethomes (/sethome)","15 vaults (/pv)","/nick","/cfly (claim fly)","/workbench","/anvil","/smithingtable","/glow","/cc (change chat colors)","/repair","5 orders (/orders)","/resize (change player attribute size)","/itemname (change item name)","3x Cosmetic Key Draw"]'::jsonb,
   true, false, false, 50),
  ('keys-coming-soon', 'key', 'Crate Keys', 'Keys are coming soon. Details will be added once the rewards are finalized.', 0, 'PHP 0',
   '[]'::jsonb, false, true, false, 10),
  ('bundles-coming-soon', 'bundle', 'Bundles', 'Bundles are coming soon. Details will be added once the offers are finalized.', 0, 'PHP 0',
   '[]'::jsonb, false, true, false, 10)
ON CONFLICT (id) DO NOTHING;
