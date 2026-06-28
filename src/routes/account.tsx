import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent, type ReactNode } from "react";
import {
  User,
  Lock,
  LogOut,
  Gamepad2,
  Smartphone,
  ShoppingBag,
  Mail,
  Eye,
  EyeOff,
  UserPlus,
  ShieldCheck,
  Sparkles,
  ReceiptText,
  Tag,
  TrendingUp,
  Trophy,
  RefreshCw,
  BadgeCheck,
  BadgeAlert,
} from "lucide-react";
import { Starfield } from "@/components/Starfield";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { PageHero } from "@/components/PageHero";
import { useAccount, type Edition } from "@/lib/account";
import { getPasswordStrength, type PasswordStrength } from "@/lib/auth-utils";
import { SERVER_IP } from "@/lib/store-config";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Account - Lunaris Craft" },
      {
        name: "description",
        content: "Create your Lunaris Craft account or sign in to manage purchases and track your progress.",
      },
      { property: "og:title", content: "Account - Lunaris Craft" },
      {
        property: "og:description",
        content: "Create your Lunaris Craft account or sign in to manage purchases and track your progress.",
      },
    ],
  }),
  component: AccountPage,
});

type AuthMode = "signup" | "signin";

const strengthMeta: Record<PasswordStrength, { label: string; width: string; color: string }> = {
  weak: { label: "Weak", width: "w-1/4", color: "bg-destructive" },
  fair: { label: "Fair", width: "w-2/4", color: "bg-orange-400" },
  good: { label: "Good", width: "w-3/4", color: "bg-yellow-400" },
  strong: { label: "Strong", width: "w-full", color: "bg-emerald-400" },
};

function AccountPage() {
  const { account, signUp, signIn, signOut, refreshVerification } = useAccount();
  const [mode, setMode] = useState<AuthMode>("signup");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [edition, setEdition] = useState<Edition>("java");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshingVerification, setRefreshingVerification] = useState(false);

  const strength = getPasswordStrength(password);
  const strengthInfo = strengthMeta[strength];
  const profileStats = account ? getProfileStats(account.history) : null;

  const resetForm = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError(null);
    setPassword("");
    setConfirmPassword("");
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result =
      mode === "signup"
        ? await signUp({ username, edition, email, password, confirmPassword })
        : await signIn({ username, edition, password });

    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
  };

  const refreshEmailStatus = async () => {
    setRefreshingVerification(true);
    setError(null);
    const result = await refreshVerification();
    if (!result.ok) setError(result.error);
    setRefreshingVerification(false);
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <Starfield />
      <div className="relative z-10">
        <Navbar />
        <PageHero
          eyebrow={account ? "Welcome Back" : "Your Profile"}
          title={account ? account.displayName : "Account"}
          description={
            account
              ? `Signed in as a ${account.edition === "bedrock" ? "Bedrock" : "Java"} player. Track purchases and claim rewards here.`
              : "Create an account with your Minecraft username and password, then sign in anytime to view orders and rewards."
          }
        />
        {!account ? (
          <section className="px-6 pb-24">
            <form onSubmit={submit} className="pixel-card mx-auto max-w-md rounded-2xl p-8 animate-fade-in">
              <div className="mb-6 flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-accent ring-1 ring-accent/30">
                  {mode === "signup" ? <UserPlus className="h-5 w-5" /> : <User className="h-5 w-5" />}
                </div>
                <div>
                  <h2 className="text-lg font-bold">{mode === "signup" ? "Create Account" : "Sign In"}</h2>
                  <p className="text-xs text-muted-foreground">
                    {mode === "signup"
                      ? "Sign up first. You'll need an account before checkout."
                      : "Welcome back. Enter your credentials to continue."}
                  </p>
                </div>
              </div>

              <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl border border-border bg-background/40 p-1">
                <button
                  type="button"
                  onClick={() => resetForm("signup")}
                  className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                    mode === "signup"
                      ? "bg-primary text-primary-foreground shadow-[0_0_20px_-8px_oklch(0.85_0.13_295/0.6)]"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Sign Up
                </button>
                <button
                  type="button"
                  onClick={() => resetForm("signin")}
                  className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                    mode === "signin"
                      ? "bg-primary text-primary-foreground shadow-[0_0_20px_-8px_oklch(0.85_0.13_295/0.6)]"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Sign In
                </button>
              </div>

              <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Edition
              </label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(["java", "bedrock"] as const).map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEdition(e)}
                    className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                      edition === e
                        ? "border-accent bg-accent/10 text-accent shadow-[0_0_20px_-8px_oklch(0.78_0.13_295/0.8)]"
                        : "border-border bg-background/40 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {e === "java" ? <Gamepad2 className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />}
                    {e === "java" ? "Java" : "Bedrock"}
                  </button>
                ))}
              </div>

              {mode === "signup" && (
                <>
                  <label className="mt-5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Email
                  </label>
                  <div className="mt-2 flex items-stretch overflow-hidden rounded-xl border border-border bg-background/60 focus-within:border-accent">
                    <span className="grid place-items-center px-3 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@email.com"
                      autoComplete="email"
                      className="flex-1 bg-transparent px-2 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
                    />
                  </div>
                </>
              )}

              <label className="mt-5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Minecraft Username
              </label>
              <div className="mt-2 flex items-stretch overflow-hidden rounded-xl border border-border bg-background/60 focus-within:border-accent">
                {edition === "bedrock" && (
                  <span className="grid place-items-center bg-accent/10 px-3 text-sm font-bold text-accent">.</span>
                )}
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={edition === "bedrock" ? "Devydtz" : "Steve"}
                  autoComplete="username"
                  className="flex-1 bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
                />
              </div>
              {edition === "bedrock" && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Bedrock players appear in-game with a leading dot, e.g.{" "}
                  <span className="font-mono text-foreground">.Devydtz</span>.
                </p>
              )}

              <label className="mt-5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Password
              </label>
              <div className="mt-2 flex items-stretch overflow-hidden rounded-xl border border-border bg-background/60 focus-within:border-accent">
                <span className="grid place-items-center px-3 text-muted-foreground">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  className="flex-1 bg-transparent px-2 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="grid place-items-center px-3 text-muted-foreground transition hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {mode === "signup" && password.length > 0 && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">Password strength</span>
                    <span className="font-semibold text-foreground">{strengthInfo.label}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${strengthInfo.width} ${strengthInfo.color}`}
                    />
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Use 8+ characters with letters and numbers for a secure account.
                  </p>
                </div>
              )}

              {mode === "signup" && (
                <>
                  <label className="mt-5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Confirm Password
                  </label>
                  <div className="mt-2 flex items-stretch overflow-hidden rounded-xl border border-border bg-background/60 focus-within:border-accent">
                    <span className="grid place-items-center px-3 text-muted-foreground">
                      <ShieldCheck className="h-4 w-4" />
                    </span>
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat your password"
                      autoComplete="new-password"
                      className="flex-1 bg-transparent px-2 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                      className="grid place-items-center px-3 text-muted-foreground transition hover:text-foreground"
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </>
              )}

              {error && (
                <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive ring-1 ring-destructive/30">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[0_0_30px_-5px_oklch(0.85_0.13_295/0.6)] transition hover:bg-accent hover:scale-[1.01] disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
                    {mode === "signup" ? "Creating account…" : "Signing in…"}
                  </>
                ) : mode === "signup" ? (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Create Account
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    Sign In
                  </>
                )}
              </button>

              <p className="mt-4 text-center text-xs text-muted-foreground">
                {mode === "signup" ? (
                  <>
                    Already have an account?{" "}
                    <button type="button" onClick={() => resetForm("signin")} className="font-semibold text-accent hover:underline">
                      Sign in
                    </button>
                  </>
                ) : (
                  <>
                    New here?{" "}
                    <button type="button" onClick={() => resetForm("signup")} className="font-semibold text-accent hover:underline">
                      Create an account
                    </button>
                  </>
                )}
              </p>

              <p className="mt-3 text-center text-[11px] text-muted-foreground">
                You must have joined <span className="font-mono text-foreground">{SERVER_IP}</span> at least once.
              </p>
            </form>
          </section>
        ) : (
          <section className="px-6 pb-24">
            <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_2fr]">
              <div className="pixel-card rounded-2xl p-6 text-center animate-fade-in">
                <div className="mx-auto mb-4 grid h-72 w-full place-items-center overflow-hidden rounded-xl bg-background/60">
                  <img
                    src={account.bodyUrl}
                    alt={`${account.displayName} skin`}
                    className="h-64 w-auto select-none [image-rendering:pixelated]"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "https://mc-heads.net/body/MHF_Steve/256";
                    }}
                  />
                </div>
                <h2 className="font-display text-3xl text-foreground">{account.displayName}</h2>
                <p className="text-xs uppercase tracking-widest text-accent">
                  {account.edition === "bedrock" ? "Bedrock Edition" : "Java Edition"}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">{account.email}</p>
                <div
                  className={`mt-4 rounded-xl border px-4 py-3 text-left ${
                    account.emailVerified
                      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                      : "border-amber-400/30 bg-amber-400/10 text-amber-300"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {account.emailVerified ? (
                      <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0" />
                    ) : (
                      <BadgeAlert className="mt-0.5 h-4 w-4 shrink-0" />
                    )}
                    <div>
                      <p className="text-xs font-bold">
                        {account.emailVerified ? "Email verified" : "Email not verified"}
                      </p>
                      <p className="mt-1 text-[11px] opacity-90">
                        {account.emailVerified
                          ? "Checkout is unlocked for this account."
                          : "Ask an admin to verify this account before checkout."}
                      </p>
                    </div>
                  </div>
                  {!account.emailVerified && (
                    <button
                      type="button"
                      onClick={refreshEmailStatus}
                      disabled={refreshingVerification}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-amber-300/30 bg-background/30 px-3 py-1.5 text-[11px] font-semibold transition hover:bg-background/50 disabled:opacity-50"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${refreshingVerification ? "animate-spin" : ""}`} />
                      Refresh Status
                    </button>
                  )}
                </div>
                <div className="mt-5 grid gap-3 text-left">
                  <MiniProfileStat label="Best Rank" value={profileStats?.ownedRank ?? "None yet"} />
                  <MiniProfileStat label="Favorite Category" value={profileStats?.favoriteCategory ?? "None yet"} />
                  <MiniProfileStat label="Latest Order" value={profileStats?.latestOrder ?? "No orders"} mono />
                </div>
                <button
                  onClick={signOut}
                  className="mt-5 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-2 text-xs font-semibold text-muted-foreground transition hover:border-destructive hover:text-destructive"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign Out
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <ProfileStatCard icon={<ReceiptText className="h-5 w-5" />} label="Orders" value={profileStats?.orderCount ?? 0} />
                  <ProfileStatCard icon={<TrendingUp className="h-5 w-5" />} label="Total Spent" value={profileStats?.totalSpent ?? "PHP 0"} />
                  <ProfileStatCard icon={<TagIcon />} label="Promo Saved" value={profileStats?.promoSaved ?? "PHP 0"} />
                  <ProfileStatCard icon={<Trophy className="h-5 w-5" />} label="Rank Level" value={profileStats?.ownedRank ?? "Starter"} />
                </div>

                <div className="pixel-card rounded-2xl p-6 animate-fade-in">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-accent ring-1 ring-accent/30">
                      <ShoppingBag className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Purchase History</h3>
                      <p className="text-xs text-muted-foreground">Track orders, promos, and rewards from your profile.</p>
                    </div>
                  </div>
                  {account.history.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
                      No purchases yet.{" "}
                      <Link to="/ranks" className="font-semibold text-accent hover:underline">
                        Browse the store
                      </Link>{" "}
                      to get started.
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {account.history.map((p) => (
                        <li key={p.id} className="rounded-xl border border-border/60 bg-background/40 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-xs font-mono text-muted-foreground">#{p.id}</p>
                              <p className="text-xs text-muted-foreground">{new Date(p.date).toLocaleString("en-PH")}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-lg font-bold text-foreground">{p.total}</span>
                              <div className="mt-1 flex flex-wrap justify-end gap-1.5">
                                {p.method === "gcash" && (
                                  <span className="rounded-full bg-[#007DFF]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#007DFF]">
                                    GCash
                                  </span>
                                )}
                                {p.promoCode && (
                                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                                    Promo Applied
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <ul className="mt-3 space-y-1 text-sm text-foreground/85">
                            {p.items.map((i) => (
                              <li key={i.id} className="flex justify-between gap-3">
                                <span>{i.name}</span>
                                <span className="text-muted-foreground">{i.price}</span>
                              </li>
                            ))}
                          </ul>
                          {p.discount && displayToCents(p.discount) > 0 && (
                            <p className="mt-2 text-xs text-emerald-400">Saved {p.discount} with promo.</p>
                          )}
                          <Link
                            to="/order/$orderId"
                            params={{ orderId: p.id }}
                            className="mt-3 inline-flex rounded-full border border-border bg-card/60 px-4 py-2 text-xs font-semibold text-foreground transition hover:border-accent hover:text-accent"
                          >
                            Track Order
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
        <SiteFooter />
      </div>
    </div>
  );
}

function MiniProfileStat({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/40 px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={`${mono ? "font-mono" : ""} mt-1 text-sm font-bold text-foreground`}>{value}</p>
    </div>
  );
}

function ProfileStatCard({ icon, label, value }: { icon: ReactNode; label: string; value: string | number }) {
  return (
    <div className="pixel-card rounded-2xl p-5">
      <div className="inline-flex rounded-xl bg-primary/10 p-2.5 text-accent ring-1 ring-accent/20">{icon}</div>
      <div className="mt-3 truncate text-xl font-bold text-foreground">{value}</div>
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

function TagIcon() {
  return <Tag className="h-5 w-5" />;
}

function getProfileStats(history: Array<{ id: string; date: string; items: { id: string; name: string; price: string }[]; total: string; discount?: string }>) {
  const orderCount = history.length;
  const totalSpentCents = history.reduce((sum, purchase) => sum + displayToCents(purchase.total), 0);
  const promoSavedCents = history.reduce((sum, purchase) => sum + displayToCents(purchase.discount ?? "PHP 0"), 0);
  const rankOrder = ["Crescent", "Nebula", "Solstice", "Celestial", "Monarch"];
  const ownedRank =
    [...history]
      .flatMap((purchase) => purchase.items)
      .map((item) => rankOrder.find((rank) => item.name.toLowerCase().includes(rank.toLowerCase())))
      .filter(Boolean)
      .sort((a, b) => rankOrder.indexOf(b as string) - rankOrder.indexOf(a as string))[0] ?? "Starter";
  const categoryCounts = history.reduce<Record<string, number>>((counts, purchase) => {
    purchase.items.forEach((item) => {
      const category = item.id.startsWith("rank") ? "Ranks" : item.id.startsWith("key") ? "Keys" : "Bundles";
      counts[category] = (counts[category] ?? 0) + 1;
    });
    return counts;
  }, {});
  const favoriteCategory =
    Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "None yet";

  return {
    orderCount,
    totalSpent: centsToPhp(totalSpentCents),
    promoSaved: centsToPhp(promoSavedCents),
    ownedRank,
    favoriteCategory,
    latestOrder: history[0]?.id ?? "No orders",
  };
}

function displayToCents(value: string): number {
  const amount = Number(value.replace(/[^0-9.]/g, ""));
  return Math.round((Number.isFinite(amount) ? amount : 0) * 100);
}

function centsToPhp(cents: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}
