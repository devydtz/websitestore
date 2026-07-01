import { listAccounts, listOrders, safeOrderItems, type Order, type StoreAccount } from "@/lib/supabase";

function php(cents: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format((Number.isFinite(cents) ? cents : 0) / 100);
}

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function extractOrderNeedle(message: string) {
  const id = message.match(/\b(?:LC-)?[A-Z0-9]{5,12}\b/i)?.[0];
  return id ? id.toUpperCase().replace(/^#/, "") : "";
}

function extractPlayerNeedle(message: string) {
  const withoutOrderIds = message.replace(/\b(?:LC-)?[A-Z0-9]{5,12}\b/gi, " ");
  const match = withoutOrderIds.match(/\b(?:player|user|username|account|for)\s+([a-z0-9_]{3,20})\b/i);
  if (match?.[1]) return match[1].toLowerCase();
  const words = withoutOrderIds
    .split(/\s+/)
    .map((word) => word.replace(/[^a-z0-9_]/gi, ""))
    .filter((word) => /^[a-z0-9_]{3,20}$/i.test(word));
  return words.find((word) => !/^(check|find|order|orders|player|profile|history|investigate|show|the|this|that|for|me)$/i.test(word))?.toLowerCase() || "";
}

function renderOrder(order: Order) {
  const items = safeOrderItems(order.items);
  const failed = (order.delivery_log || []).filter((entry) => entry.ok === false);
  return [
    `${order.id} - ${order.status}`,
    `Player: ${order.username} (${order.edition})`,
    `Email: ${order.email || "missing"}`,
    `Total: ${order.total_display || php(order.total_cents)}`,
    `Payment: ${order.method || "unknown"}${order.reference_no ? ` / ref ${order.reference_no}` : ""}`,
    items.length ? `Items: ${items.map((item) => `${item.name} x${item.qty}`).join(", ")}` : "Items: none recorded",
    order.promo_code ? `Promo: ${order.promo_code}` : "",
    order.admin_note ? `Admin note: ${order.admin_note}` : "",
    failed.length ? `Delivery issues: ${failed.length}` : "Delivery issues: 0",
    `Created: ${order.created_at || "unknown"}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function renderAccount(account: StoreAccount, orders: Order[]) {
  const playerOrders = orders.filter(
    (order) => order.username.toLowerCase() === account.username.toLowerCase() && order.edition === account.edition,
  );
  const spent = playerOrders.reduce((sum, order) => sum + (order.status !== "rejected" ? order.total_cents || 0 : 0), 0);
  const statusCounts = ["pending", "confirmed", "rejected", "delivered"]
    .map((status) => `${status}: ${playerOrders.filter((order) => order.status === status).length}`)
    .join(", ");
  return [
    `${account.display_name || account.username} (${account.edition})`,
    `Email: ${account.email || "missing"}`,
    `Verified: ${account.email_verified ? "yes" : "no"}`,
    `Disabled: ${account.disabled ? "yes" : "no"}`,
    `Orders found: ${playerOrders.length}`,
    `Order status: ${statusCounts}`,
    `Recorded spend: ${account.total_spent_display || php(account.total_spent_cents || spent)}`,
    `Calculated non-rejected spend: ${php(spent)}`,
    `Last seen: ${account.last_seen_at || "unknown"}`,
    playerOrders.length ? `Recent orders:\n${playerOrders.slice(0, 5).map((order) => `- ${order.id}: ${order.status}, ${order.total_display || php(order.total_cents)}`).join("\n")}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function orderInvestigatorTool(message: string) {
  const result = await listOrders();
  if (!result.ok) return `I tried to scan orders, but Supabase returned: ${result.error}`;

  const needle = extractOrderNeedle(message);
  const text = message.toLowerCase();
  const matches = needle
    ? result.orders.filter((order) => order.id.toUpperCase().includes(needle) || order.reference_no?.toUpperCase() === needle)
    : result.orders.filter((order) => [order.username, order.email, order.reference_no, order.id].some((value) => clean(value).toLowerCase() && text.includes(clean(value).toLowerCase())));

  if (!matches.length) {
    return [
      "I scanned the latest orders but did not find a matching order.",
      `Orders scanned: ${result.orders.length}`,
      "Send an order ID like LC-ABC123, a GCash reference, email, or Minecraft username.",
    ].join("\n");
  }

  return [`Found ${matches.length} matching order${matches.length === 1 ? "" : "s"}:`, ...matches.slice(0, 5).map(renderOrder)].join("\n\n");
}

export async function playerInvestigatorTool(message: string) {
  const [accountsResult, ordersResult] = await Promise.all([listAccounts(), listOrders()]);
  if (!accountsResult.ok) return `I tried to scan accounts, but Supabase returned: ${accountsResult.error}`;
  if (!ordersResult.ok) return `I tried to scan orders, but Supabase returned: ${ordersResult.error}`;

  const needle = extractPlayerNeedle(message);
  const accounts = accountsResult.accounts.filter((account) => {
    if (!needle) return false;
    return [account.username, account.display_name, account.email, account.id].some((value) => clean(value).toLowerCase().includes(needle));
  });

  if (!accounts.length) {
    return [
      "I scanned accounts but did not find that player.",
      `Accounts scanned: ${accountsResult.accounts.length}`,
      "Send the exact Minecraft username or email and I will check again.",
    ].join("\n");
  }

  return [`Found ${accounts.length} matching account${accounts.length === 1 ? "" : "s"}:`, ...accounts.slice(0, 5).map((account) => renderAccount(account, ordersResult.orders))].join("\n\n");
}
