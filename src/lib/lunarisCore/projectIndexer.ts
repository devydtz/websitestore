export type ProjectEntry = {
  path: string;
  kind: string;
  summary: string;
  keywords: string[];
};

export const projectIndex: ProjectEntry[] = [
  {
    path: "src/components/admin/AdminPanel.tsx",
    kind: "admin",
    summary: "Main existing admin panel. Handles orders, accounts, account sync, promos, products, admin notes, and delivery actions.",
    keywords: ["admin", "orders", "accounts", "players", "promos", "products", "delivery", "manage accounts"],
  },
  {
    path: "src/lib/supabase.ts",
    kind: "backend-data",
    summary: "Frontend Supabase data layer for orders, accounts, promos, store products, admin actions, and account sync.",
    keywords: ["supabase", "database", "orders", "accounts", "promo_codes", "store_products", "admin-manage-order"],
  },
  {
    path: "src/routes/checkout.tsx",
    kind: "route",
    summary: "Checkout page. Creates orders, validates account/email state, GCash reference, and records purchases.",
    keywords: ["checkout", "gcash", "submit order", "cart", "payment"],
  },
  {
    path: "src/routes/account.tsx",
    kind: "route",
    summary: "Account page for sign up, sign in, email verification, profile, order history, and password reset.",
    keywords: ["account", "login", "signup", "email", "password reset", "profile"],
  },
  {
    path: "src/lib/products.ts",
    kind: "store",
    summary: "Product fallbacks and product loading/merge logic for ranks, keys, and bundles.",
    keywords: ["ranks", "keys", "bundles", "products", "prices", "perks"],
  },
  {
    path: "src/lib/promos.ts",
    kind: "store",
    summary: "Promo code calculation helpers and promo rule validation.",
    keywords: ["promo", "discount", "coupon", "percent", "fixed"],
  },
  {
    path: "src/lib/store-config.ts",
    kind: "config",
    summary: "Store-wide settings including Discord link, GCash details, server host, and port.",
    keywords: ["config", "gcash", "discord", "server ip", "port"],
  },
  {
    path: "src/routes/__root.tsx",
    kind: "route",
    summary: "Root app shell, cart drawer gate, route outlet, error handling, and app metadata.",
    keywords: ["root", "routes", "error", "cart", "metadata"],
  },
  {
    path: "package.json",
    kind: "config",
    summary: "Project scripts and dependencies for Vite, React, TanStack Router, Supabase, Tailwind, and build.",
    keywords: ["package", "build", "vite", "dependencies", "pnpm"],
  },
  {
    path: "public/_redirects",
    kind: "cloudflare",
    summary: "Cloudflare Pages routing rules for SPA/direct routes.",
    keywords: ["cloudflare", "redirects", "routing", "spa"],
  },
  {
    path: "public/_headers",
    kind: "cloudflare",
    summary: "Cloudflare Pages headers and cache settings.",
    keywords: ["cloudflare", "headers", "cache"],
  },
  {
    path: "supabase/functions/admin-manage-order/index.ts",
    kind: "backend",
    summary: "Supabase Edge Function for admin order management, account sync/delete, and RCON delivery if deployed.",
    keywords: ["function", "rcon", "delivery", "sync accounts", "delete account"],
  },
];
