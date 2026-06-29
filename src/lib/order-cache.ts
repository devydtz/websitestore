import type { Order } from "@/lib/supabase";

const PREFIX = "lunaris.order.";

export function cacheOrder(order: Order) {
  try {
    sessionStorage.setItem(`${PREFIX}${order.id}`, JSON.stringify(order));
  } catch {}
}

export function readCachedOrder(orderId: string): Order | null {
  try {
    const raw = sessionStorage.getItem(`${PREFIX}${orderId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Order>;
    if (!parsed || parsed.id !== orderId || typeof parsed.status !== "string") return null;
    return parsed as Order;
  } catch {
    return null;
  }
}
