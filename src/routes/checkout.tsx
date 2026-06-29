import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  Lock,
  Moon,
  ReceiptText,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { Starfield } from "@/components/Starfield";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { centsToDisplay, lineTotalDisplay, useCart } from "@/lib/cart";
import { useAccount } from "@/lib/account";
import { createOrder } from "@/lib/supabase";
import { isLiveProduct } from "@/lib/products";
import {
  formatMobileNumber,
  STORE_GCASH_DISPLAY,
  STORE_GCASH_NAME,
  STORE_GCASH_NUMBER,
  STORE_GCASH_QR,
} from "@/lib/store-config";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout - Lunaris Craft" },
      { name: "description", content: "Pay with GCash and submit your Lunaris Craft order." },
      { property: "og:title", content: "Checkout - Lunaris Craft" },
      { property: "og:description", content: "Pay with GCash and submit your Lunaris Craft order." },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { items, clear } = useCart();
  const { account, recordPurchase } = useAccount();
  const navigate = useNavigate();

  const [gcashNumber, setGcashNumber] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitStep, setSubmitStep] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const liveItems = useMemo(
    () =>
      items.filter(
        (item) =>
          item.category === "rank" &&
          isLiveProduct(item.id) &&
          Number.isFinite(item.priceCents) &&
          item.priceCents > 0 &&
          Number.isFinite(item.qty) &&
          item.qty > 0,
      ),
    [items],
  );

  const gcashDigits = gcashNumber.replace(/\D/g, "");
  const referenceDigits = referenceNo.replace(/\D/g, "");
  const subtotalCents = liveItems.reduce((sum, item) => sum + item.priceCents * item.qty, 0);
  const subtotalDisplay = centsToDisplay(subtotalCents);
  const totalDisplay = centsToDisplay(subtotalCents);
  const hasUnavailableItems = liveItems.length !== items.length;
  const canSubmit =
    Boolean(account) &&
    Boolean(account?.emailVerified) &&
    !account?.disabled &&
    liveItems.length > 0 &&
    !hasUnavailableItems &&
    subtotalCents > 0 &&
    /^09\d{9}$/.test(gcashDigits) &&
    referenceDigits.length >= 10 &&
    confirmed;

  const copyNumber = async () => {
    try {
      await navigator.clipboard.writeText(STORE_GCASH_NUMBER);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const submitOrder = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;

    setError(null);

    if (!account) {
      setError("Sign in before checking out.");
      return;
    }
    if (account.disabled) {
      setError("This account is disabled. Contact support before checking out.");
      return;
    }
    if (!account.emailVerified) {
      setError("Verify your email first, then refresh your account page.");
      return;
    }
    if (hasUnavailableItems || liveItems.length === 0) {
      setError("Remove old keys/bundles from your cart and add a live rank.");
      return;
    }
    if (!/^09\d{9}$/.test(gcashDigits)) {
      setError("Enter a valid GCash number that starts with 09.");
      return;
    }
    if (referenceDigits.length < 10) {
      setError("Enter your GCash reference number.");
      return;
    }
    if (!confirmed) {
      setError("Check the confirmation box before submitting.");
      return;
    }

    setSubmitting(true);
    setSubmitStep("Saving order...");
    let submitted = false;

    try {
      const orderId =
        "LC-" +
        (globalThis.crypto?.randomUUID?.().replace(/-/g, "").slice(0, 6) ??
          Math.random().toString(36).slice(2, 8)).toUpperCase();
      const orderItems = liveItems.map((item) => ({
        id: item.id,
        name: item.name,
        price: lineTotalDisplay(item.priceCents, item.qty),
        qty: item.qty,
      }));
      const purchaseItems = liveItems.map((item) => ({
        id: item.id,
        name: `${item.name} x${item.qty}`,
        price: lineTotalDisplay(item.priceCents, item.qty),
      }));

      const result = await createOrder({
        id: orderId,
        username: account.username,
        edition: account.edition,
        email: account.email,
        items: orderItems,
        total_cents: subtotalCents,
        total_display: totalDisplay,
        method: "gcash",
        gcash_number: formatMobileNumber(gcashNumber),
        reference_no: referenceDigits,
        promo_code: null,
        discount_cents: 0,
        discount_display: centsToDisplay(0),
        subtotal_cents: subtotalCents,
        subtotal_display: subtotalDisplay,
      });

      if (!result.ok) {
        setError(`Could not submit order: ${result.error}`);
        return;
      }

      setSubmitStep("Opening order tracker...");
      submitted = true;
      clear();
      window.setTimeout(() => {
        recordPurchase({
          id: orderId,
          date: new Date().toISOString(),
          items: purchaseItems,
          total: totalDisplay,
          method: "gcash",
          discount: centsToDisplay(0),
        });
      }, 0);
      void navigate({ to: "/order/$orderId", params: { orderId } });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(`Could not submit order: ${message}`);
    } finally {
      if (!submitted) {
        setSubmitting(false);
        setSubmitStep("");
      }
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <Starfield />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_50%_0%,rgba(189,167,255,0.22),transparent_58%)]" />
      <div className="relative z-10">
        <Navbar />

      {items.length === 0 ? (
        <section className="mx-auto max-w-lg px-6 py-24 text-center">
          <div className="pixel-card rounded-2xl p-8">
            <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground" />
            <h1 className="mt-4 font-display text-4xl">Your cart is empty</h1>
            <p className="mt-2 text-sm text-muted-foreground">Add a rank before checking out.</p>
            <Link
              to="/ranks"
              className="mt-6 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              Browse Ranks
            </Link>
          </div>
        </section>
      ) : (
        <section className="mx-auto max-w-6xl px-6 pb-20 pt-10">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Continue shopping
          </Link>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-accent">
                <Moon className="h-3.5 w-3.5" />
                Secure GCash Checkout
              </p>
              <h1 className="mt-4 font-display text-4xl md:text-5xl">Fast Checkout</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                Send the exact GCash amount, enter your receipt details, and the order tracker opens as soon as the
                order is saved.
              </p>
            </div>
            <div className="grid gap-2 rounded-3xl border border-border/70 bg-card/60 p-4 shadow-[0_0_40px_-24px_rgba(189,167,255,0.9)] backdrop-blur">
              <ProgressItem done={Boolean(account)} label="Account ready" />
              <ProgressItem done={/^09\d{9}$/.test(gcashDigits)} label="GCash number valid" />
              <ProgressItem done={referenceDigits.length >= 10} label="Reference entered" />
              <ProgressItem done={confirmed} label="Payment confirmed" />
            </div>
          </div>

          {!account && <Notice text="Sign in or create an account before checking out." />}
          {account && !account.emailVerified && <Notice text="Verify your email before checking out." />}
          {account?.disabled && <Notice text="This account is disabled. Contact support before checking out." danger />}
          {hasUnavailableItems && <Notice text="Your cart has unavailable items. Remove keys/bundles and add a live rank." danger />}
          {error && <Notice text={error} danger />}

          <form onSubmit={submitOrder} className="mt-8 grid gap-6 lg:grid-cols-[1.45fr_0.75fr]">
            <div className="space-y-5">
              {account && (
                <section className="pixel-card rounded-3xl p-5">
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    <ShieldCheck className="h-4 w-4 text-accent" />
                    Delivery Account
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <img
                      src={account.avatarUrl}
                      alt=""
                      className="h-11 w-11 rounded-xl border border-border"
                      onError={(event) => {
                        event.currentTarget.src = "https://mc-heads.net/avatar/MHF_Steve/64";
                      }}
                    />
                    <div>
                      <p className="font-semibold">{account.displayName}</p>
                      <p className="text-xs text-muted-foreground">{account.email}</p>
                    </div>
                  </div>
                </section>
              )}

              <section className="pixel-card rounded-3xl p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                      <CreditCard className="h-4 w-4 text-[#007DFF]" />
                      Pay To
                    </p>
                    <h2 className="mt-1 text-xl font-bold">{STORE_GCASH_NAME}</h2>
                    <p className="mt-1 font-mono text-lg text-[#007DFF]">{STORE_GCASH_DISPLAY}</p>
                  </div>
                  <button
                    type="button"
                    onClick={copyNumber}
                    className="inline-flex items-center gap-2 rounded-full border border-[#007DFF]/30 px-4 py-2 text-sm font-semibold text-[#007DFF]"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>

                <div className="mt-5 grid gap-5 md:grid-cols-[180px_1fr]">
                  <div className="rounded-2xl bg-white p-3">
                    <img src={STORE_GCASH_QR} alt="GCash QR code" className="aspect-square w-full rounded-xl object-cover" />
                  </div>
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-[#007DFF]/25 bg-[#007DFF]/10 px-4 py-3 shadow-[0_0_30px_-18px_rgba(0,125,255,0.9)]">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Send exactly</p>
                      <p className="mt-1 text-3xl font-black">{totalDisplay}</p>
                    </div>

                    <FieldLabel text="Your GCash Number" />
                    <input
                      value={gcashNumber}
                      onChange={(event) => setGcashNumber(formatMobileNumber(event.target.value))}
                      placeholder="09XX XXX XXXX"
                      inputMode="numeric"
                      disabled={!account}
                      className="w-full rounded-xl border border-border bg-background/70 px-4 py-3 font-mono text-sm outline-none focus:border-[#007DFF] disabled:opacity-50"
                    />

                    <FieldLabel text="GCash Reference Number" />
                    <input
                      value={referenceNo}
                      onChange={(event) => setReferenceNo(event.target.value.replace(/\D/g, "").slice(0, 13))}
                      placeholder="Reference number"
                      inputMode="numeric"
                      disabled={!account}
                      className="w-full rounded-xl border border-border bg-background/70 px-4 py-3 font-mono text-sm outline-none focus:border-[#007DFF] disabled:opacity-50"
                    />
                  </div>
                </div>

                <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-border/70 bg-background/40 p-4">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(event) => setConfirmed(event.target.checked)}
                    disabled={!account}
                    className="mt-1 h-4 w-4 accent-[#007DFF]"
                  />
                  <span className="text-sm text-muted-foreground">
                    I confirm I sent <span className="font-bold text-foreground">{totalDisplay}</span> to{" "}
                    <span className="font-mono text-foreground">{STORE_GCASH_DISPLAY}</span>.
                  </span>
                </label>
              </section>
            </div>

            <aside className="pixel-card h-fit rounded-3xl p-5 lg:sticky lg:top-24">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <ReceiptText className="h-5 w-5 text-accent" />
                Order Summary
              </h2>
              <ul className="mt-4 space-y-3">
                {liveItems.map((item) => (
                  <li key={item.id} className="flex justify-between gap-3 text-sm">
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-xs text-muted-foreground">Qty {item.qty}</p>
                    </div>
                    <span className="font-bold">{lineTotalDisplay(item.priceCents, item.qty)}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-5 space-y-2 border-t border-border/70 pt-4 text-sm">
                <SummaryLine label="Subtotal" value={subtotalDisplay} />
                <SummaryLine label="Payment" value="GCash" />
                <SummaryLine label="Total" value={totalDisplay} strong />
              </div>

              <div className="mt-5 rounded-2xl border border-accent/25 bg-accent/10 p-4 text-xs text-muted-foreground">
                <p className="flex items-center gap-2 font-bold text-foreground">
                  <Sparkles className="h-4 w-4 text-accent" />
                  Faster flow
                </p>
                <p className="mt-2">The tracker opens right after the order is saved. Account history syncs quietly after.</p>
              </div>

              <button
                type="submit"
                disabled={!canSubmit || submitting}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#007DFF] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#006bd6] disabled:cursor-not-allowed disabled:opacity-55"
              >
                {submitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    {submitStep || "Submitting..."}
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    Submit Order
                  </>
                )}
              </button>
            </aside>
          </form>
        </section>
      )}

      <SiteFooter />
      </div>
    </div>
  );
}

function ProgressItem({ done, label }: { done: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-3 rounded-2xl px-3 py-2 text-sm ${done ? "text-emerald-300" : "text-muted-foreground"}`}>
      <CheckCircle2 className={`h-4 w-4 ${done ? "text-emerald-300" : "text-muted-foreground/60"}`} />
      <span>{label}</span>
    </div>
  );
}

function Notice({ text, danger = false }: { text: string; danger?: boolean }) {
  return (
    <div
      className={`mt-5 flex items-start gap-3 rounded-2xl border px-5 py-4 text-sm ${
        danger
          ? "border-red-500/30 bg-red-500/10 text-red-300"
          : "border-accent/30 bg-accent/10 text-muted-foreground"
      }`}
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{text}</span>
    </div>
  );
}

function FieldLabel({ text }: { text: string }) {
  return <label className="block text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">{text}</label>;
}

function SummaryLine({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between gap-3 ${strong ? "text-base font-black text-foreground" : "text-muted-foreground"}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
