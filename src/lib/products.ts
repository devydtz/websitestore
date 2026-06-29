import { Crown, KeyRound, Moon, Package, Shield, Sparkles, Star, type LucideIcon } from "lucide-react";
import type { Product } from "@/components/ProductGrid";
import { listStoreProducts, type StoreProductRow } from "@/lib/supabase";

export const LIVE_PRODUCT_IDS = new Set([
  "rank-crescent",
  "rank-nebula",
  "rank-solstice",
  "rank-celestial",
  "rank-monarch",
]);

export const LIVE_PRODUCT_DETAILS: Record<string, { name: string; price: string; priceCents: number }> = {
  "rank-crescent": { name: "Crescent", price: "PHP 99", priceCents: 9900 },
  "rank-nebula": { name: "Nebula", price: "PHP 199", priceCents: 19900 },
  "rank-solstice": { name: "Solstice", price: "PHP 299", priceCents: 29900 },
  "rank-celestial": { name: "Celestial", price: "PHP 399", priceCents: 39900 },
  "rank-monarch": { name: "Monarch", price: "PHP 499", priceCents: 49900 },
};

export function isLiveProduct(id: string) {
  return Boolean(id);
}

export function isLiveCategory(category: "rank" | "key" | "bundle") {
  return category === "rank" || category === "key" || category === "bundle";
}

export const fallbackRanks: Product[] = [
  {
    id: "rank-crescent",
    category: "rank",
    name: "Crescent",
    tagline: "Your first step into the Lunaris realm.",
    price: "PHP 99",
    Icon: Shield,
    perks: ["5,000 Claim Blocks", "2 PWarps (/pw create)", "5 Sethomes (/sethome)", "3 vaults (/pv)", "/workbench"],
  },
  {
    id: "rank-nebula",
    category: "rank",
    name: "Nebula",
    tagline: "A stronger start with extra comfort perks.",
    price: "PHP 199",
    Icon: Star,
    perks: ["7,500 Claim Blocks", "3 PWarps (/pw create)", "7 Sethomes (/sethome)", "5 vaults (/pv)", "/workbench"],
  },
  {
    id: "rank-solstice",
    category: "rank",
    name: "Solstice",
    tagline: "A balanced upgrade for active players.",
    price: "PHP 299",
    Icon: Moon,
    featured: true,
    perks: [
      "10,000 Claim Blocks",
      "5 PWarps (/pw create)",
      "8 Sethomes (/sethome)",
      "7 vaults (/pv)",
      "/cfly (claim fly)",
      "/workbench",
      "/anvil",
      "Cosmetic Key draw",
    ],
  },
  {
    id: "rank-celestial",
    category: "rank",
    name: "Celestial",
    tagline: "Premium perks for players who want to stand out.",
    price: "PHP 399",
    Icon: Sparkles,
    perks: [
      "15,000 Claim Blocks",
      "7 PWarps (/pw create)",
      "10 Sethomes (/sethome)",
      "10 vaults (/pv)",
      "/nick",
      "/cfly (claim fly)",
      "/workbench",
      "/anvil",
      "/glow",
      "/cc (change chat colors)",
      "/repair",
      "3 orders (/orders)",
      "2x Cosmetic Key draw",
    ],
  },
  {
    id: "rank-monarch",
    category: "rank",
    name: "Monarch",
    tagline: "The highest Lunaris rank package.",
    price: "PHP 499",
    Icon: Crown,
    perks: [
      "20,000 Claim Blocks",
      "10 PWarps (/pw create)",
      "15 Sethomes (/sethome)",
      "15 vaults (/pv)",
      "/nick",
      "/cfly (claim fly)",
      "/workbench",
      "/anvil",
      "/smithingtable",
      "/glow",
      "/cc (change chat colors)",
      "/repair",
      "5 orders (/orders)",
      "/resize (change player attribute size)",
      "/itemname (change item's name)",
      "3x Cosmetic Key Draw",
    ],
  },
];

export const fallbackKeys: Product[] = [
];

export const fallbackBundles: Product[] = [
];

function iconFor(category: Product["category"], featured: boolean): LucideIcon {
  if (category === "key") return KeyRound;
  if (category === "bundle") return Package;
  return featured ? Crown : Shield;
}

export function productFromRow(row: StoreProductRow): Product {
  return {
    id: row.id,
    category: row.category,
    name: row.name,
    tagline: row.tagline,
    price: row.price_display,
    Icon: iconFor(row.category, row.featured),
    perks: Array.isArray(row.perks) ? row.perks : [],
    featured: row.featured,
    comingSoon: row.coming_soon || !row.active,
  };
}

export async function loadProductsForCategory(category: Product["category"], fallback: Product[]) {
  const res = await listStoreProducts();
  if (!res.ok) return { products: fallback, error: res.error };
  const savedProducts = res.products.filter((product) => product.category === category).map(productFromRow);
  const merged = mergeProducts(fallback, savedProducts);
  return { products: merged, error: null };
}

export function mergeProducts(fallback: Product[], savedProducts: Product[]) {
  const savedIds = new Set(savedProducts.map((product) => product.id));
  return [...fallback.filter((product) => !savedIds.has(product.id)), ...savedProducts];
}

export function fallbackProductRows(): StoreProductRow[] {
  return fallbackRanks.map((product, index) => ({
    id: product.id,
    category: product.category,
    name: product.name,
    tagline: product.tagline,
    price_cents: LIVE_PRODUCT_DETAILS[product.id]?.priceCents ?? 0,
    price_display: product.price,
    perks: product.perks,
    active: true,
    coming_soon: false,
    featured: Boolean(product.featured),
    sort_order: (index + 1) * 10,
    created_at: "",
    updated_at: "",
  }));
}
