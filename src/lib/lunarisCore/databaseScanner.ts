import {
  listAccounts,
  listOrders,
  listPromoCodes,
  listStoreProducts,
  type StoreProductRow,
} from "@/lib/supabase";

function summarizeProducts(products: StoreProductRow[]) {
  const byCategory = (category: StoreProductRow["category"]) => products.filter((product) => product.category === category);
  return {
    ranks: byCategory("rank"),
    keys: byCategory("key"),
    bundles: byCategory("bundle"),
  };
}

export async function scanDatabase(message: string) {
  const text = message.toLowerCase();
  const wantsProducts = /rank|key|bundle|product|crate|cosmetic/.test(text);
  const wantsPromos = /promo|discount|coupon/.test(text);
  const wantsAccounts = /account|player|user/.test(text);
  const wantsOrders = /order|request|delivery|revenue/.test(text);

  const sections: string[] = [];

  if (wantsOrders || (!wantsProducts && !wantsPromos && !wantsAccounts)) {
    const res = await listOrders();
    sections.push(
      res.ok
        ? `Orders: ${res.orders.length} loaded. Pending: ${res.orders.filter((order) => order.status === "pending").length}. Confirmed: ${res.orders.filter((order) => order.status === "confirmed").length}. Delivered: ${res.orders.filter((order) => order.status === "delivered").length}. Rejected: ${res.orders.filter((order) => order.status === "rejected").length}.`
        : `Orders: ${res.error}`,
    );
  }

  if (wantsAccounts) {
    const res = await listAccounts();
    sections.push(
      res.ok
        ? `Accounts: ${res.accounts.length} loaded. Verified: ${res.accounts.filter((account) => account.email_verified).length}. Disabled: ${res.accounts.filter((account) => account.disabled).length}.`
        : `Accounts: ${res.error}`,
    );
  }

  if (wantsPromos) {
    const res = await listPromoCodes();
    sections.push(
      res.ok
        ? `Promos: ${res.promos.length} loaded. Active: ${res.promos.filter((promo) => promo.active).length}. Codes: ${res.promos.map((promo) => promo.code).join(", ") || "none"}.`
        : `Promos: ${res.error}`,
    );
  }

  if (wantsProducts) {
    const res = await listStoreProducts();
    if (res.ok) {
      const products = summarizeProducts(res.products);
      sections.push(
        `Products: ${res.products.length} loaded. Ranks: ${products.ranks.length}. Keys: ${products.keys.length}. Bundles: ${products.bundles.length}. Active: ${res.products.filter((product) => product.active).length}.`,
      );
      if (products.ranks.length) sections.push(`Ranks: ${products.ranks.map((rank) => `${rank.name} (${rank.price_display})`).join(", ")}`);
      if (products.keys.length) sections.push(`Keys: ${products.keys.map((key) => key.name).join(", ")}`);
      if (products.bundles.length) sections.push(`Bundles: ${products.bundles.map((bundle) => bundle.name).join(", ")}`);
    } else {
      sections.push(`Products: ${res.error}`);
    }
  }

  return sections.join("\n");
}
