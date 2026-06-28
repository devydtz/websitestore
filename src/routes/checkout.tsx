import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  Lock,
  ShoppingBag,
  ArrowLeft,
  CheckCircle2,
  User as UserIcon,
  AlertCircle,
  Copy,
  Check,
  Clock3,
  FileText,
  ReceiptText,
  ShieldCheck,
} from "lucide-react";
import { Starfield } from "@/components/Starfield";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { useCart, lineTotalDisplay } from "@/lib/cart";
import { useAccount } from "@/lib/account";
import { createOrder } from "@/lib/supabase";
import {
  formatMobileNumber,
  STORE_GCASH_DISPLAY,
  STORE_GCASH_NAME,
  STORE_GCASH_NUMBER,
} from "@/lib/store-config";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout - Lunaris Craft" },
      { name: "description", content: "Pay securely with GCash. Items deliver in-game within minutes." },
      { property: "og:title", content: "Checkout - Lunaris Craft" },
      { property: "og:description", content: "Pay securely with GCash. Items deliver in-game within minutes." },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { items, totalDisplay, clear } = useCart();
  const { account, recordPurchase } = useAccount();
  const navigate = useNavigate();

  const [gcashNumber, setGcashNumber] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [submittedTotal, setSubmittedTotal] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const gcashDigits = gcashNumber.replace(/\D/g, "");
  const referenceDigits = referenceNo.replace(/\D/g, "");
  const paymentReady =
    Boolean(account) &&
    /^09\d{9}$/.test(gcashDigits) &&
    referenceDigits.length >= 10 &&
    confirmed;

  const copyNumber = async () => {
    try {
      await navigator.clipboard.writeText(STORE_GCASH_NUMBER);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!account) {
      setError("Please sign in or create an account before checking out.");
      return;
    }

    const digits = gcashNumber.replace(/\D/g, "");
    if (!/^09\d{9}$/.test(digits)) {
      setError("Enter a valid GCash mobile number (09XX XXX XXXX).");
      return;
    }
    if (referenceNo.replace(/\D/g, "").length < 10) {
      setError("Enter your GCash reference number (at least 10 digits).");
      return;
    }
    if (!confirmed) {
      setError("Please confirm you have sent the exact amount via GCash.");
      return;
    }

    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1200));
    const orderId = "LC-" + Math.random().toString(36).slice(2, 8).toUpperCase();

    const orderItems = items.map((i) => ({
      id: i.id,
      name: i.name,
      price: lineTotalDisplay(i.priceCents, i.qty),
      qty: i.qty,
    }));

    const supa = await createOrder({
      id: orderId,
      username: account.username,
      edition: account.edition,
      email: account.email,
      items: orderItems,
      total_cents: items.reduce((sum, i) => sum + i.priceCents * i.qty, 0),
      total_display: totalDisplay,
      method: "gcash",
      gcash_number: formatMobileNumber(gcashNumber),
      reference_no: referenceNo.trim(),
    });

    if (!supa.ok) {
      setError(`Could not submit order: ${supa.error}. Please try again.`);
      setSubmitting(false);
      return;
    }

    recordPurchase({
      id: orderId,
      date: new Date().toISOString(),
      items: items.map((i) => ({
        id: i.id,
        name: `${i.name} ×${i.qty}`,
        price: lineTotalDisplay(i.priceCents, i.qty),
      })),
      total: totalDisplay,
      method: "gcash",
    });
    setSubmittedTotal(totalDisplay);
    setDone(orderId);
    clear();
    setSubmitting(false);
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <Starfield />
      <div className="relative z-10">
        <Navbar />

        {done ? (
          <section className="px-6 py-24">
            <div className="pixel-card mx-auto max-w-lg rounded-2xl p-10 text-center animate-fade-in">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#007DFF]/15 text-[#007DFF] ring-1 ring-[#007DFF]/40">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h1 className="mt-5 font-display text-5xl">Order Submitted</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Order <span className="font-mono text-foreground">#{done}</span> is awaiting payment
                verification by our team. Once your GCash payment is confirmed, your rewards will be delivered in-game.
              </p>
              <div className="mt-6 rounded-2xl border border-border/60 bg-background/40 p-4 text-left">
                <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <ReceiptText className="h-4 w-4 text-accent" />
                  Receipt Snapshot
                </div>
                <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <div className="flex justify-between gap-3">
                    <span>Order ID</span>
                    <span className="font-mono text-foreground">#{done}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span>Status</span>
                    <span className="font-semibold text-amber-400">Pending Verification</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span>Total</span>
                    <span className="font-bold text-foreground">{submittedTotal ?? totalDisplay}</span>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link
                  to="/account"
                  className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-accent"
                >
                  View Account
                </Link>
                <button
                  onClick={() => navigate({ to: "/" })}
                  className="rounded-full border border-border bg-card/60 px-5 py-2.5 text-sm font-semibold text-foreground transition hover:border-accent"
                >
                  Back to Home
                </button>
              </div>
            </div>
          </section>
        ) : items.length === 0 ? (
          <section className="px-6 py-24 text-center">
            <div className="pixel-card mx-auto max-w-md rounded-2xl p-10">
              <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground" />
              <h1 className="mt-4 font-display text-4xl">Your cart is empty</h1>
              <p className="mt-2 text-sm text-muted-foreground">Add a rank, key, or bundle before checking out.</p>
              <Link
                to="/ranks"
                className="mt-6 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-accent"
              >
                Browse Ranks
              </Link>
            </div>
          </section>
        ) : (
          <section className="mx-auto max-w-6xl px-6 pb-24 pt-10">
            <Link
              to="/"
              className="mb-6 inline-flex items-center gap-1 text-xs text-muted-foreground transition hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Continue shopping
            </Link>
            <h1 className="font-display text-5xl">Checkout</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Pay in Philippine Peso (₱) via GCash. Fast, secure, and local.
            </p>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <CheckoutStep
                icon={<UserIcon className="h-4 w-4" />}
                title="1. Account"
                copy={account ? `${account.displayName} is selected` : "Sign in before paying"}
                active={Boolean(account)}
              />
              <CheckoutStep
                icon={<FileText className="h-4 w-4" />}
                title="2. Payment Details"
                copy={paymentReady ? "Ready to submit" : "Enter GCash receipt info"}
                active={paymentReady}
              />
              <CheckoutStep
                icon={<ShieldCheck className="h-4 w-4" />}
                title="3. Admin Verify"
                copy="We confirm, then deliver in-game"
                active={false}
              />
            </div>

            {!account && (
              <div className="mt-6 flex items-start gap-3 rounded-2xl border border-accent/30 bg-accent/5 px-5 py-4">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Account required</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Create an account first, then come back to complete your GCash payment.
                  </p>
                  <Link
                    to="/account"
                    className="mt-3 inline-flex rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition hover:bg-accent"
                  >
                    Sign Up / Sign In
                  </Link>
                </div>
              </div>
            )}

            <form onSubmit={onSubmit} className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
              <div className="space-y-6">
                {account && (
                  <div className="pixel-card rounded-2xl p-6">
                    <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
                      <UserIcon className="h-5 w-5 text-accent" /> Delivery Account
                    </h2>
                    <div className="flex items-center gap-4 rounded-xl border border-border/60 bg-background/40 p-4">
                      <img
                        src={account.avatarUrl}
                        alt=""
                        className="h-12 w-12 rounded-full ring-2 ring-accent/40"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = "https://mc-heads.net/avatar/MHF_Steve/64";
                        }}
                      />
                      <div>
                        <p className="font-semibold text-foreground">{account.displayName}</p>
                        <p className="text-xs text-muted-foreground">
                          {account.edition === "bedrock" ? "Bedrock" : "Java"} · {account.email}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="overflow-hidden rounded-2xl border border-[#007DFF]/30 bg-gradient-to-br from-[#007DFF]/10 via-card to-card">
                  <div className="border-b border-[#007DFF]/20 bg-[#007DFF]/10 px-6 py-4">
                    <div className="flex items-center gap-3">
                      <GcashLogo />
                      <div>
                        <h2 className="text-lg font-bold text-foreground">Pay with GCash</h2>
                        <p className="text-xs text-muted-foreground">Send the exact total to our merchant number</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-5 p-6">
                    <div className="rounded-xl border border-[#007DFF]/25 bg-background/50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        Send payment to
                      </p>
                      <p className="mt-1 text-sm font-medium text-foreground">{STORE_GCASH_NAME}</p>
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <p className="font-mono text-2xl font-bold tracking-wide text-[#007DFF]">
                          {STORE_GCASH_DISPLAY}
                        </p>
                        <button
                          type="button"
                          onClick={copyNumber}
                          className="inline-flex items-center gap-1.5 rounded-full border border-[#007DFF]/30 bg-[#007DFF]/10 px-3 py-1.5 text-xs font-semibold text-[#007DFF] transition hover:bg-[#007DFF]/20"
                        >
                          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                          {copied ? "Copied" : "Copy"}
                        </button>
                      </div>
                      <p className="mt-3 text-lg font-bold text-foreground">
                        Amount: <span className="text-[#007DFF]">{totalDisplay}</span>
                      </p>
                    </div>

                    <ol className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex gap-2">
                        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#007DFF]/15 text-[10px] font-bold text-[#007DFF]">
                          1
                        </span>
                        Open GCash and tap <span className="font-semibold text-foreground">Send Money</span>.
                      </li>
                      <li className="flex gap-2">
                        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#007DFF]/15 text-[10px] font-bold text-[#007DFF]">
                          2
                        </span>
                        Enter our number and send exactly <span className="font-semibold text-foreground">{totalDisplay}</span>.
                      </li>
                      <li className="flex gap-2">
                        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#007DFF]/15 text-[10px] font-bold text-[#007DFF]">
                          3
                        </span>
                        Fill in your details below and submit your reference number.
                      </li>
                    </ol>

                    <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      Your GCash Number
                    </label>
                    <input
                      value={gcashNumber}
                      onChange={(e) => setGcashNumber(formatMobileNumber(e.target.value))}
                      placeholder="09XX XXX XXXX"
                      inputMode="numeric"
                      disabled={!account}
                      className="w-full rounded-xl border border-border bg-background/60 px-4 py-3 font-mono text-sm tracking-wider focus:border-[#007DFF] focus:outline-none disabled:opacity-50"
                    />

                    <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      GCash Reference Number
                    </label>
                    <input
                      value={referenceNo}
                      onChange={(e) => setReferenceNo(e.target.value.replace(/\D/g, "").slice(0, 13))}
                      placeholder="13-digit reference from your receipt"
                      inputMode="numeric"
                      disabled={!account}
                      className="w-full rounded-xl border border-border bg-background/60 px-4 py-3 font-mono text-sm tracking-wider focus:border-[#007DFF] focus:outline-none disabled:opacity-50"
                    />

                    <div className="grid gap-2 rounded-xl border border-border/60 bg-background/30 p-4 text-xs text-muted-foreground sm:grid-cols-2">
                      <VerificationCheck ok={Boolean(account)} label="Account selected" />
                      <VerificationCheck ok={/^09\d{9}$/.test(gcashDigits)} label="Valid GCash number" />
                      <VerificationCheck ok={referenceDigits.length >= 10} label="Reference number entered" />
                      <VerificationCheck ok={confirmed} label="Payment confirmation checked" />
                    </div>

                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/60 bg-background/30 p-4">
                      <input
                        type="checkbox"
                        checked={confirmed}
                        onChange={(e) => setConfirmed(e.target.checked)}
                        disabled={!account}
                        className="mt-1 h-4 w-4 rounded border-border accent-[#007DFF]"
                      />
                      <span className="text-sm text-muted-foreground">
                        I confirm I have sent <span className="font-semibold text-foreground">{totalDisplay}</span> via
                        GCash to <span className="font-mono text-foreground">{STORE_GCASH_DISPLAY}</span>.
                      </span>
                    </label>

                    <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <Lock className="h-3 w-3" /> Payments are verified manually. Keep your GCash receipt until your
                      order is delivered.
                    </p>
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive ring-1 ring-destructive/30">
                    {error}
                  </div>
                )}
              </div>

              <aside className="pixel-card sticky top-20 h-fit rounded-2xl p-6">
                <h2 className="mb-4 text-lg font-bold">Order Summary</h2>
                <ul className="space-y-3">
                  {items.map((i) => (
                    <li key={i.id} className="flex items-start justify-between gap-3 text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground">{i.name}</p>
                        <p className="text-xs text-muted-foreground">Qty {i.qty}</p>
                      </div>
                      <span className="font-bold text-foreground">{lineTotalDisplay(i.priceCents, i.qty)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-5 border-t border-border/60 pt-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Subtotal</span>
                    <span>{totalDisplay}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-sm text-muted-foreground">
                    <span>Payment method</span>
                    <span className="font-semibold text-[#007DFF]">GCash</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-sm text-muted-foreground">
                    <span>Currency</span>
                    <span>PHP (₱)</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-base font-bold">
                    <span>Total</span>
                    <span className="text-xl">{totalDisplay}</span>
                  </div>
                </div>
                <div className="mt-5 rounded-2xl border border-border/60 bg-background/35 p-4">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <Clock3 className="h-4 w-4 text-accent" />
                    What happens next
                  </h3>
                  <ol className="mt-3 space-y-2 text-xs text-muted-foreground">
                    <li>1. Submit your GCash reference number.</li>
                    <li>2. Admin verifies the payment in the panel.</li>
                    <li>3. Your rank is delivered in-game after approval.</li>
                  </ol>
                </div>
                <button
                  type="submit"
                  disabled={submitting || !paymentReady}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#007DFF] px-5 py-3 text-sm font-semibold text-white shadow-[0_0_30px_-5px_rgba(0,125,255,0.5)] transition hover:bg-[#0066d6] disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Submitting order...
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4" />
                      {paymentReady ? "Confirm GCash Payment" : "Complete Details"}
                    </>
                  )}
                </button>
                <p className="mt-3 text-center text-[11px] text-muted-foreground">
                  Items deliver in-game within minutes after verification.
                </p>
              </aside>
            </form>
          </section>
        )}

        <SiteFooter />
      </div>
    </div>
  );
}

function CheckoutStep({ icon, title, copy, active }: { icon: ReactNode; title: string; copy: string; active: boolean }) {
  return (
    <div
      className={`rounded-2xl border px-4 py-3 ${
        active
          ? "border-accent/40 bg-accent/10 text-foreground"
          : "border-border/60 bg-card/45 text-muted-foreground"
      }`}
    >
      <div className="flex items-center gap-2 text-sm font-bold">
        <span className={active ? "text-accent" : "text-muted-foreground"}>{icon}</span>
        {title}
      </div>
      <p className="mt-1 text-xs">{copy}</p>
    </div>
  );
}

function VerificationCheck({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-2 ${ok ? "text-emerald-400" : "text-muted-foreground"}`}>
      {ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock3 className="h-3.5 w-3.5" />}
      <span>{label}</span>
    </div>
  );
}

function GcashLogo() {
  return (
    <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#007DFF] text-sm font-black text-white shadow-lg">
      G
    </div>
  );
}
