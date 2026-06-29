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
  return LIVE_PRODUCT_IDS.has(id);
}

export function isLiveCategory(category: "rank" | "key" | "bundle") {
  return category === "rank";
}
