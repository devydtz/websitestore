import {
  listAccounts,
  listOrders,
  listPromoCodes,
  listStoreProducts,
  type Order,
  type OrderStatus,
  type PromoCodeRow,
  type StoreAccount,
  type StoreProductRow,
} from "@/lib/supabase";

type ReportSection = {
  title: string;
  lines: string[];
};

const statuses: OrderStatus[] = ["pending", "confirmed", "rejected", "delivered"];

function php(cents: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format((Number.isFinite(cents) ? cents : 0) / 100);
}

function percent(part: number, whole: number) {
  if (!whole) return "0%";
  return `${((part / whole) * 100).toFixed(1)}%`;
}

function countBy<T>(items: T[], getter: (item: T) => string | null | undefined) {
  const map = new Map<string, number>();
  for (const item of items) {
    const key = getter(item)?.trim() || "unknown";
    map.set(key, (map.get(key) || 0) + 1);
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

function duplicates<T>(items: T[], getter: (item: T) => string | null | undefined) {
  return countBy(items, getter).filter(([, count]) => count > 1);
}

function newestDate(items: { created_at?: string }[]) {
  const valid = items.map((item) => item.created_at).filter(Boolean).sort().reverse();
  return valid[0] || "none";
}

function oldestDate(items: { created_at?: string }[]) {
  const valid = items.map((item) => item.created_at).filter(Boolean).sort();
  return valid[0] || "none";
}

function compactList(values: string[], empty = "None found.") {
  return values.length ? values.slice(0, 8).join("\n") : empty;
}

function orderItemNames(order: Order) {
  return order.items.map((item) => item.name).filter(Boolean);
}

function analyzeOrders(orders: Order[]): ReportSection[] {
  const totalAmount = orders.reduce((sum, order) => sum + (order.total_cents || 0), 0);
  const statusCounts = Object.fromEntries(statuses.map((status) => [status, orders.filter((order) => order.status === status).length])) as Record<
    OrderStatus,
    number
  >;
  const itemCounts = countBy(
    orders.flatMap((order) => order.items.map((item) => ({ name: item.name, qty: item.qty || 1 }))),
    (item) => item.name,
  );
  const duplicateRefs = duplicates(
    orders.filter((order) => Boolean(order.reference_no)),
    (order) => order.reference_no,
  );
  const missingReference = orders.filter((order) => !order.reference_no && order.method?.toLowerCase() === "gcash");
  const zeroPaidOrders = orders.filter((order) => (order.total_cents || 0) <= 0 && order.items.length > 0);
  const rejectedNoNote = orders.filter((order) => order.status === "rejected" && !order.admin_note);
  const deliveredNoDate = orders.filter((order) => order.status === "delivered" && !order.delivered_at);
  const failedDelivery = orders.filter((order) => order.delivery_log?.some((entry) => entry.ok === false));
  const byEdition = countBy(orders, (order) => order.edition);
  const byMethod = countBy(orders, (order) => order.method);

  return [
    {
      title: "Order Summary",
      lines: [
        `Rows analyzed: ${orders.length}`,
        `Total recorded amount: ${php(totalAmount)}`,
        `Average order value: ${php(orders.length ? totalAmount / orders.length : 0)}`,
        `Date range: ${oldestDate(orders)} to ${newestDate(orders)}`,
      ],
    },
    {
      title: "Status Breakdown",
      lines: statuses.map((status) => `${status}: ${statusCounts[status]} (${percent(statusCounts[status], orders.length)})`),
    },
    {
      title: "Top Items",
      lines: itemCounts.length ? itemCounts.slice(0, 8).map(([name, count]) => `${name}: ${count}`) : ["No item data found."],
    },
    {
      title: "Segments",
      lines: [
        `Editions: ${byEdition.map(([name, count]) => `${name} ${count}`).join(", ") || "none"}`,
        `Payment methods: ${byMethod.map(([name, count]) => `${name} ${count}`).join(", ") || "none"}`,
      ],
    },
    {
      title: "Issues And Anomalies",
      lines: [
        `Duplicate payment references: ${duplicateRefs.length}`,
        `GCash orders missing reference: ${missingReference.length}`,
        `Orders with items but zero/invalid total: ${zeroPaidOrders.length}`,
        `Rejected orders without admin note: ${rejectedNoNote.length}`,
        `Delivered orders missing delivered_at: ${deliveredNoDate.length}`,
        `Orders with failed delivery log entries: ${failedDelivery.length}`,
      ],
    },
    {
      title: "Review Queue",
      lines: [
        ...orders
          .filter((order) => order.status === "pending" || order.status === "confirmed")
          .slice(0, 8)
          .map((order) => `${order.id}: ${order.status} - ${order.username} - ${order.total_display || php(order.total_cents)} - ${orderItemNames(order).join(", ") || "no items"}`),
      ],
    },
  ];
}

function analyzeAccounts(accounts: StoreAccount[]): ReportSection[] {
  const totalSpent = accounts.reduce((sum, account) => sum + (account.total_spent_cents || 0), 0);
  const duplicateEmails = duplicates(accounts, (account) => account.email?.toLowerCase());
  const duplicateNames = duplicates(accounts, (account) => `${account.edition}:${account.username?.toLowerCase()}`);
  const unverified = accounts.filter((account) => !account.email_verified);
  const disabled = accounts.filter((account) => account.disabled);

  return [
    {
      title: "Account Summary",
      lines: [
        `Rows analyzed: ${accounts.length}`,
        `Verified accounts: ${accounts.filter((account) => account.email_verified).length} (${percent(accounts.filter((account) => account.email_verified).length, accounts.length)})`,
        `Disabled accounts: ${disabled.length}`,
        `Total recorded spend: ${php(totalSpent)}`,
      ],
    },
    {
      title: "Account Quality Checks",
      lines: [
        `Unverified accounts: ${unverified.length}`,
        `Duplicate email candidates: ${duplicateEmails.length}`,
        `Duplicate username candidates: ${duplicateNames.length}`,
        `Missing emails: ${accounts.filter((account) => !account.email).length}`,
      ],
    },
    {
      title: "Highest Value Accounts",
      lines: accounts
        .slice()
        .sort((a, b) => (b.total_spent_cents || 0) - (a.total_spent_cents || 0))
        .slice(0, 8)
        .map((account) => `${account.display_name || account.username}: ${account.total_spent_display || php(account.total_spent_cents)}`),
    },
  ];
}

function analyzeProducts(products: StoreProductRow[]): ReportSection[] {
  const byCategory = countBy(products, (product) => product.category);
  const active = products.filter((product) => product.active);
  const comingSoon = products.filter((product) => product.coming_soon);
  const missingPrice = products.filter((product) => product.active && !product.coming_soon && (product.price_cents || 0) <= 0);
  const duplicateIds = duplicates(products, (product) => product.id);

  return [
    {
      title: "Product Summary",
      lines: [
        `Rows analyzed: ${products.length}`,
        `Active products: ${active.length}`,
        `Coming soon products: ${comingSoon.length}`,
        `Categories: ${byCategory.map(([name, count]) => `${name} ${count}`).join(", ") || "none"}`,
      ],
    },
    {
      title: "Product Quality Checks",
      lines: [
        `Active sellable products with missing/zero price: ${missingPrice.length}`,
        `Duplicate product IDs: ${duplicateIds.length}`,
        `Featured products: ${products.filter((product) => product.featured).length}`,
        `Disabled products: ${products.filter((product) => !product.active).length}`,
      ],
    },
    {
      title: "Products",
      lines: products.slice(0, 12).map((product) => `${product.category}: ${product.name} - ${product.price_display} - ${product.active ? "active" : "disabled"}${product.coming_soon ? " - coming soon" : ""}`),
    },
  ];
}

function analyzePromos(promos: PromoCodeRow[]): ReportSection[] {
  const now = Date.now();
  const active = promos.filter((promo) => promo.active);
  const expiredActive = promos.filter((promo) => promo.active && promo.expires_at && Date.parse(promo.expires_at) < now);
  const maxedOut = promos.filter((promo) => promo.max_uses !== null && promo.used_count >= promo.max_uses);

  return [
    {
      title: "Promo Summary",
      lines: [
        `Rows analyzed: ${promos.length}`,
        `Active promos: ${active.length}`,
        `Expired but still active: ${expiredActive.length}`,
        `Maxed-out promos: ${maxedOut.length}`,
      ],
    },
    {
      title: "Promo Codes",
      lines: promos.slice(0, 12).map((promo) => `${promo.code}: ${promo.kind} ${promo.amount} - used ${promo.used_count}${promo.max_uses ? `/${promo.max_uses}` : ""} - ${promo.active ? "active" : "disabled"}`),
    },
  ];
}

function renderReport(title: string, sections: ReportSection[], errors: string[] = []) {
  const body = sections
    .filter((section) => section.lines.length)
    .map((section) => `${section.title}\n${section.lines.map((line) => `- ${line}`).join("\n")}`)
    .join("\n\n");
  const recommendations = [
    "Review duplicate or missing payment references before confirming orders.",
    "Keep product IDs/slugs stable so old carts and orders do not break.",
    "Disable expired or maxed-out promo codes to avoid customer confusion.",
    "Use admin notes for rejected orders so future reviews have context.",
  ];

  return [
    title,
    `Generated: ${new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" }).format(new Date())}`,
    body || "No analyzable data was returned.",
    errors.length ? `Data Limitations\n${errors.map((error) => `- ${error}`).join("\n")}` : "",
    `Recommended Actions\n${recommendations.map((item) => `- ${item}`).join("\n")}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

export async function dataAnalysisTool(message: string) {
  const text = message.toLowerCase();
  const wantsOrders = /order|request|sale|revenue|payment|gcash|duplicate|anomal/.test(text);
  const wantsAccounts = /account|player|user|email|verified|disabled/.test(text);
  const wantsPromos = /promo|coupon|discount/.test(text);
  const wantsProducts = /product|rank|key|bundle|crate|cosmetic|item/.test(text);
  const wantsAll = /all|everything|report|analy[sz]e data|data analysis|dashboard/.test(text) || (!wantsOrders && !wantsAccounts && !wantsPromos && !wantsProducts);

  const sections: ReportSection[] = [];
  const errors: string[] = [];

  if (wantsAll || wantsOrders) {
    const result = await listOrders();
    if (result.ok) sections.push(...analyzeOrders(result.orders));
    else errors.push(`Orders: ${result.error}`);
  }

  if (wantsAll || wantsAccounts) {
    const result = await listAccounts();
    if (result.ok) sections.push(...analyzeAccounts(result.accounts));
    else errors.push(`Accounts: ${result.error}`);
  }

  if (wantsAll || wantsProducts) {
    const result = await listStoreProducts();
    if (result.ok) sections.push(...analyzeProducts(result.products));
    else errors.push(`Products: ${result.error}`);
  }

  if (wantsAll || wantsPromos) {
    const result = await listPromoCodes();
    if (result.ok) sections.push(...analyzePromos(result.promos));
    else errors.push(`Promos: ${result.error}`);
  }

  return renderReport("Lunaris Core Data Analysis Report", sections, errors);
}
