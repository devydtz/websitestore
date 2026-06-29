import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { AlertCircle, CheckCircle2, Clock3, Copy, PackageCheck, Printer, RefreshCw, XCircle } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { cacheOrder, readCachedOrder } from "@/lib/order-cache";
import { getOrder, safeOrderItems, type Order, type OrderStatus, type OrderStatusHistory } from "@/lib/supabase";

export const Route = createFileRoute("/order/$orderId")({
  head: () => ({
    meta: [
      { title: "Order Status - Lunaris Craft" },
      { name: "description", content: "Track your Lunaris Craft order status." },
      { property: "og:title", content: "Order Status - Lunaris Craft" },
      { property: "og:description", content: "Track your Lunaris Craft order status." },
    ],
  }),
  component: OrderStatusPage,
});

const statusMeta: Record<OrderStatus, { label: string; copy: string; cls: string; Icon: typeof Clock3 }> = {
  pending: {
    label: "Pending Verification",
    copy: "Your order was submitted. We are checking the GCash payment details.",
    cls: "border-amber-400/30 bg-amber-400/10 text-amber-300",
    Icon: Clock3,
  },
  confirmed: {
    label: "Confirmed",
    copy: "Payment is confirmed. Your rewards are queued for in-game delivery.",
    cls: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
    Icon: CheckCircle2,
  },
  delivered: {
    label: "Delivered",
    copy: "Your order has been delivered in-game. Thank you for supporting Lunaris Craft.",
    cls: "border-[#007DFF]/30 bg-[#007DFF]/10 text-[#7dbbff]",
    Icon: PackageCheck,
  },
  rejected: {
    label: "Rejected",
    copy: "This order was rejected. Check the admin note below or contact support.",
    cls: "border-red-400/30 bg-red-400/10 text-red-300",
    Icon: XCircle,
  },
};

function OrderStatusPage() {
  const { orderId } = Route.useParams();
  const [order, setOrder] = useState<Order | null>(() => readCachedOrder(orderId));
  const [loading, setLoading] = useState(() => !readCachedOrder(orderId));
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadOrder = useCallback(async (cachedOrder?: Order | null) => {
    const hasCachedOrder = Boolean(cachedOrder);
    setLoading(!hasCachedOrder);
    setRefreshing(hasCachedOrder);
    setError(null);
    const result = await getOrder(orderId);
    if (!result.ok) {
      if (!hasCachedOrder) {
        setError(result.error);
        setOrder(null);
      }
    } else {
      setOrder(result.order);
      if (result.order) cacheOrder(result.order);
    }
    setLoading(false);
    setRefreshing(false);
  }, [orderId]);

  useEffect(() => {
    const cached = readCachedOrder(orderId);
    setOrder(cached);
    setLoading(!cached);
    setError(null);
    void loadOrder(cached);
  }, [loadOrder, orderId]);

  const copyOrderId = async () => {
    try {
      await navigator.clipboard.writeText(orderId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const meta = order ? statusMeta[order.status] : null;
  const StatusIcon = meta?.Icon ?? Clock3;
  const timeline = order ? buildTimeline(order) : [];

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <div className="static-starfield fixed inset-0 z-0" />
      <div className="relative z-10">
        <Navbar />
        <section className="mx-auto max-w-5xl px-6 py-16">
          <div className="mb-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Order Tracker</p>
            <h1 className="mt-3 font-display text-5xl md:text-6xl">Order Status</h1>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
              Track payment verification, admin review, and in-game delivery from one page.
            </p>
          </div>

          <div className="pixel-card rounded-3xl p-6 md:p-8">
            <div className="flex flex-col gap-4 border-b border-border/60 pb-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Order ID</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="font-mono text-2xl font-bold">#{orderId}</span>
                  <button
                    type="button"
                    onClick={copyOrderId}
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-background/40 px-3 py-1.5 text-xs text-muted-foreground transition hover:border-accent hover:text-accent"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => void loadOrder(order)}
                disabled={loading || refreshing}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card/60 px-5 py-2.5 text-sm font-semibold text-foreground transition hover:border-accent disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading || refreshing ? "animate-spin" : ""}`} />
                {refreshing ? "Refreshing" : "Refresh"}
              </button>
              {order && (
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-5 py-2.5 text-sm font-semibold text-accent transition hover:bg-accent/20"
                >
                  <Printer className="h-4 w-4" />
                  Print Receipt
                </button>
              )}
            </div>

            {loading ? (
              <div className="grid min-h-64 place-items-center">
                <div className="text-center text-muted-foreground">
                  <RefreshCw className="mx-auto h-8 w-8 animate-spin text-accent" />
                  <p className="mt-3 text-sm">Loading order...</p>
                </div>
              </div>
            ) : error ? (
              <StatusNotice
                icon={<AlertCircle className="h-6 w-6" />}
                title="Could not load order"
                copy={error}
                tone="error"
              />
            ) : !order || !meta ? (
              <StatusNotice
                icon={<AlertCircle className="h-6 w-6" />}
                title="Order not found"
                copy="Check the order ID and try again. If you just submitted it, wait a few seconds and refresh."
                tone="warning"
              />
            ) : (
              <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                <div>
                  <div className={`rounded-2xl border p-5 ${meta.cls}`}>
                    <div className="flex items-start gap-3">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/10">
                        <StatusIcon className="h-6 w-6" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">{meta.label}</h2>
                        <p className="mt-1 text-sm opacity-90">{meta.copy}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-4">
                    {(["pending", "confirmed", "delivered", "rejected"] as OrderStatus[]).map((status) => (
                      <StepPill key={status} label={status} active={order.status === status} />
                    ))}
                  </div>

                  <div className="mt-5 rounded-2xl border border-border/60 bg-background/35 p-5">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      Timeline
                    </p>
                    <div className="mt-4 space-y-4">
                      {timeline.map((step, index) => (
                        <div key={`${step.status}-${step.at}-${index}`} className="flex gap-3">
                          <div className="mt-1 h-3 w-3 rounded-full bg-accent shadow-[0_0_18px_rgba(189,167,255,0.8)]" />
                          <div>
                            <p className="text-sm font-semibold text-foreground">{step.label}</p>
                            <p className="text-xs text-muted-foreground">{new Date(step.at).toLocaleString("en-PH")}</p>
                            {step.note && <p className="mt-1 text-xs text-muted-foreground">{step.note}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {order.admin_note && (
                    <div className="mt-5 rounded-2xl border border-accent/25 bg-accent/10 p-5">
                      <p className="text-xs font-semibold uppercase tracking-widest text-accent">Admin Note</p>
                      <p className="mt-2 text-sm text-foreground">{order.admin_note}</p>
                    </div>
                  )}

                  <div className="mt-5 rounded-2xl border border-border/60 bg-background/35 p-5">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      What to do now
                    </p>
                    <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                      <li>Keep your GCash receipt until the order is fully delivered.</li>
                      <li>Refresh this page to check for updates after admin review.</li>
                      <li>If something looks wrong, contact support in Discord with your order ID.</li>
                    </ul>
                  </div>
                </div>

                <aside className="rounded-2xl border border-border/60 bg-background/35 p-5">
                  <h3 className="text-lg font-bold">Receipt</h3>
                  <dl className="mt-4 space-y-3 text-sm">
                    <InfoRow label="Minecraft" value={order.username} />
                    <InfoRow label="Edition" value={order.edition === "bedrock" ? "Bedrock" : "Java"} />
                    <InfoRow label="Email" value={order.email} />
                    <InfoRow label="Payment" value="GCash" />
                    <InfoRow label="GCash Number" value={order.gcash_number ?? "N/A"} mono />
                    <InfoRow label="Reference" value={order.reference_no ?? "N/A"} mono />
                    <InfoRow label="Subtotal" value={order.subtotal_display ?? order.total_display} />
                    {order.promo_code && <InfoRow label="Promo" value="Applied" />}
                    {(order.discount_cents ?? 0) > 0 && order.discount_display && (
                      <InfoRow label="Discount" value={`-${order.discount_display}`} />
                    )}
                    <InfoRow label="Total" value={order.total_display} bold />
                    {order.receipt_issued_at && (
                      <InfoRow label="Receipt Issued" value={new Date(order.receipt_issued_at).toLocaleString("en-PH")} />
                    )}
                  </dl>
                  <div className="mt-5 border-t border-border/60 pt-5">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Items</p>
                    <ul className="mt-3 space-y-2">
                      {safeOrderItems(order.items).map((item) => (
                        <li key={`${item.id}-${item.name}`} className="flex justify-between gap-3 text-sm">
                          <span className="text-foreground">{item.name} x{item.qty}</span>
                          <span className="font-semibold text-foreground">{item.price}</span>
                        </li>
                      ))}
                      {safeOrderItems(order.items).length === 0 && (
                        <li className="text-sm text-muted-foreground">No item details found.</li>
                      )}
                    </ul>
                  </div>
                </aside>
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/account"
              className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-accent"
            >
              View Account
            </Link>
            <Link
              to="/"
              className="rounded-full border border-border bg-card/60 px-5 py-2.5 text-sm font-semibold text-foreground transition hover:border-accent"
            >
              Back to Home
            </Link>
          </div>
        </section>
        <SiteFooter />
      </div>
    </div>
  );
}

function buildTimeline(order: Order): OrderStatusHistory[] {
  if (Array.isArray(order.status_history) && order.status_history.length) {
    return order.status_history.filter((step): step is OrderStatusHistory => {
      if (!step || typeof step !== "object") return false;
      return typeof step.label === "string" && typeof step.at === "string";
    });
  }

  const base: OrderStatusHistory[] = [
    {
      status: "submitted" as const,
      label: "Order submitted",
      at: order.created_at,
    },
  ];

  if (order.status !== "pending") {
    base.push({
      status: order.status,
      label: statusMeta[order.status].label,
      at: order.delivered_at ?? order.created_at,
    });
  } else {
    base.push({
      status: "pending",
      label: "Waiting for payment verification",
      at: order.created_at,
    });
  }

  return base;
}

function StepPill({ label, active }: { label: string; active: boolean }) {
  return (
    <div
      className={`rounded-full border px-3 py-2 text-center text-xs font-bold capitalize ${
        active ? "border-accent bg-accent/15 text-accent" : "border-border bg-card/40 text-muted-foreground"
      }`}
    >
      {label}
    </div>
  );
}

function InfoRow({ label, value, mono, bold }: { label: string; value: string; mono?: boolean; bold?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={`${mono ? "font-mono" : ""} ${bold ? "font-bold" : "font-semibold"} text-right text-foreground`}>
        {value}
      </dd>
    </div>
  );
}

function StatusNotice({ icon, title, copy, tone }: { icon: ReactNode; title: string; copy: string; tone: "error" | "warning" }) {
  const cls = tone === "error" ? "border-red-500/30 bg-red-500/10 text-red-300" : "border-amber-400/30 bg-amber-400/10 text-amber-300";
  return (
    <div className={`mt-6 rounded-2xl border p-6 ${cls}`}>
      <div className="flex items-start gap-3">
        {icon}
        <div>
          <h2 className="font-bold">{title}</h2>
          <p className="mt-1 text-sm opacity-90">{copy}</p>
        </div>
      </div>
    </div>
  );
}
