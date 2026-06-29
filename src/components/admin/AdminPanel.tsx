import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  ShieldCheck,
  Lock,
  LogOut,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Package,
  Search,
  DollarSign,
  Users,
  Eye,
  X,
  ExternalLink,
  AlertCircle,
  Loader2,
  Gamepad2,
  FileText,
  BadgeCheck,
  BadgeAlert,
  Ban,
  Trash2,
  UserPlus,
  Percent,
  KeyRound,
  Save,
  CalendarDays,
} from "lucide-react";
import { Starfield } from "@/components/Starfield";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import {
  listAccounts,
  listOrders,
  adminAction,
  createAdminAccount,
  saveAdminNote,
  setAccountFlags,
  deleteAccount,
  listPromoCodes,
  savePromoCode,
  deletePromoCode,
  listStoreProducts,
  saveStoreProduct,
  deleteStoreProduct,
  safeOrderItems,
  syncAccountsFromOrders,
  type Order,
  type OrderStatus,
  type PromoCodeRow,
  type StoreProductRow,
  type StoreAccount,
} from "@/lib/supabase";

const ADMIN_TOKEN_KEY = "lunaris.admin.token.v1";
const DEFAULT_ADMIN_PASSWORD = "lunaris-admin-2024";

type Tab = "all" | OrderStatus;

export function AdminPanel() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(ADMIN_TOKEN_KEY));
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoggingIn(true);
    setTimeout(() => {
      if (password === DEFAULT_ADMIN_PASSWORD) {
        localStorage.setItem(ADMIN_TOKEN_KEY, password);
        setToken(password);
        setPassword("");
      } else {
        setLoginError("Incorrect admin password.");
      }
      setLoggingIn(false);
    }, 500);
  };

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    setToken(null);
  };

  if (!token) {
    return (
      <>
        <Starfield />
        <Navbar />
        <LoginScreen
          password={password}
          setPassword={setPassword}
          loginError={loginError}
          loggingIn={loggingIn}
          onSubmit={handleLogin}
        />
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <Starfield />
      <Navbar />
      <AdminDashboard token={token} onLogout={handleLogout} />
      <SiteFooter />
    </>
  );
}

function LoginScreen({
  password,
  setPassword,
  loginError,
  loggingIn,
  onSubmit,
}: {
  password: string;
  setPassword: (v: string) => void;
  loginError: string | null;
  loggingIn: boolean;
  onSubmit: (e: FormEvent) => void;
}) {
  return (
    <section className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center px-6 py-20">
      <div className="pixel-card w-full max-w-md rounded-3xl p-8 md:p-10">
        <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-accent/15 ring-1 ring-accent/30">
          <Lock className="h-7 w-7 text-accent" />
        </div>
        <h1 className="text-center font-display text-3xl">Admin Access</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Restricted area. Enter the admin password to manage orders and deliveries.
        </p>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Admin Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              placeholder="Enter password"
              className="w-full rounded-xl border border-border bg-card/60 px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </div>
          {loginError && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {loginError}
            </div>
          )}
          <button
            type="submit"
            disabled={loggingIn || !password}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-accent disabled:opacity-50"
          >
            {loggingIn ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            {loggingIn ? "Verifying..." : "Enter Admin Panel"}
          </button>
        </form>
      </div>
    </section>
  );
}

function AdminDashboard({ token, onLogout }: { token: string; onLogout: () => void }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [accounts, setAccounts] = useState<StoreAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Order | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [noteSaving, setNoteSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setAccountsLoading(true);
    setError(null);
    setAccountError(null);
    const res = await listOrders();
    if (res.ok) {
      setOrders(res.orders);
      if (res.orders.length > 0) {
        const syncRes = await syncAccountsFromOrders(res.orders);
        if (!syncRes.ok) setAccountError(syncRes.error);
      }
    } else {
      setError(res.error);
    }
    const accountRes = await listAccounts();
    if (accountRes.ok) setAccounts(accountRes.accounts);
    else setAccountError(accountRes.error);
    setLoading(false);
    setAccountsLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    let list = orders;
    if (tab !== "all") list = list.filter((o) => o.status === tab);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          o.username.toLowerCase().includes(q) ||
          o.email.toLowerCase().includes(q) ||
          (o.reference_no ?? "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [orders, tab, search]);

  const stats = useMemo(() => {
    const pending = orders.filter((o) => o.status === "pending").length;
    const confirmed = orders.filter((o) => o.status === "confirmed").length;
    const delivered = orders.filter((o) => o.status === "delivered").length;
    const revenue = orders
      .filter((o) => o.status === "delivered" || o.status === "confirmed")
      .reduce((sum, o) => sum + o.total_cents, 0);
    return { pending, confirmed, delivered, revenue, total: orders.length };
  }, [orders]);

  const doAction = async (order: Order, action: "confirm" | "reject") => {
    setActionLoading(order.id);
    setActionError(null);
    const res = await adminAction(order.id, action, token, note.trim() || undefined);
    if (res.ok) {
      setOrders((prev) => prev.map((o) => (o.id === res.order.id ? res.order : o)));
      setSelected(res.order);
      setNote("");
    } else {
      setActionError(res.error);
    }
    setActionLoading(null);
  };

  const refreshSelected = (order: Order) => {
    setSelected((prev) => (prev && prev.id === order.id ? order : prev));
  };

  const doSaveNote = async (order: Order) => {
    setNoteSaving(true);
    setActionError(null);
    const res = await saveAdminNote(order.id, token, note);
    if (res.ok) {
      setOrders((prev) => prev.map((o) => (o.id === res.order.id ? res.order : o)));
      setSelected(res.order);
      setNote(res.order.admin_note ?? "");
    } else {
      setActionError(res.error);
    }
    setNoteSaving(false);
  };

  const doAccountFlag = async (account: StoreAccount, flags: { email_verified?: boolean; disabled?: boolean }) => {
    setAccountError(null);
    const res = await setAccountFlags(account.id, token, flags);
    if (res.ok) {
      setAccounts((prev) => prev.map((a) => (a.id === res.account.id ? res.account : a)));
    } else {
      setAccountError(res.error);
    }
  };

  const doDeleteAccount = async (account: StoreAccount) => {
    const confirmed = window.confirm(
      `Delete ${account.display_name} from Manage Accounts? Their old browser login will not be erased, but this admin record will be removed.`,
    );
    if (!confirmed) return;

    setAccountError(null);
    const res = await deleteAccount(account.id, token);
    if (res.ok) {
      setAccounts((prev) => prev.filter((a) => a.id !== account.id));
    } else {
      setAccountError(res.error);
    }
  };

  const doCreateAccount = async (input: {
    username: string;
    edition: "java" | "bedrock";
    email: string;
    emailVerified: boolean;
  }) => {
    setAccountError(null);
    const res = await createAdminAccount(input, token);
    if (res.ok) {
      setAccounts((prev) => [res.account, ...prev.filter((a) => a.id !== res.account.id)]);
      return { ok: true as const };
    }
    setAccountError(res.error);
    return { ok: false as const, error: res.error };
  };

  return (
    <section className="mx-auto max-w-7xl px-4 pb-24 pt-8 md:px-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-accent" />
            <h1 className="font-display text-3xl md:text-4xl">Admin Panel</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage orders, confirm payments, and deliver rewards in-game.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-2 text-sm font-semibold text-foreground transition hover:border-accent disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={onLogout}
            className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-500/20"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={<Clock className="h-5 w-5" />} label="Pending" value={stats.pending} tone="warning" />
        <StatCard icon={<CheckCircle2 className="h-5 w-5" />} label="Confirmed" value={stats.confirmed} tone="success" />
        <StatCard icon={<Package className="h-5 w-5" />} label="Delivered" value={stats.delivered} tone="accent" />
        <StatCard
          icon={<DollarSign className="h-5 w-5" />}
          label="Revenue"
          value={formatCents(stats.revenue)}
          tone="primary"
        />
      </div>

      {error && (
        <div className="mt-6 flex items-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {error}
        </div>
      )}

      {actionError && (
        <div className="mt-6 flex items-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {actionError}
        </div>
      )}

      {/* Tabs + Search */}
      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {(["all", "pending", "confirmed", "delivered", "rejected"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold capitalize transition ${
                tab === t
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-card/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
              {t !== "all" && (
                <span className="ml-1.5 text-xs opacity-70">
                  {orders.filter((o) => o.status === t).length}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search orders, users, refs..."
            className="w-full rounded-full border border-border bg-card/60 py-2 pl-9 pr-4 text-sm text-foreground outline-none transition focus:border-accent"
          />
        </div>
      </div>

      {/* Orders table */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card/40">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <Package className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">No orders found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-background/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Order</th>
                  <th className="px-4 py-3 font-semibold">Player</th>
                  <th className="px-4 py-3 font-semibold">Items</th>
                  <th className="px-4 py-3 font-semibold">Total</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filtered.map((order) => (
                  <tr key={order.id} className="transition hover:bg-background/30">
                    <td className="px-4 py-3">
                      <div className="font-mono text-xs text-foreground">{order.id}</div>
                      <div className="text-xs text-muted-foreground">{order.reference_no || "N/A"}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <img
                          src={avatarFor(order)}
                          alt=""
                          className="h-7 w-7 rounded ring-1 ring-border"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = "https://mc-heads.net/avatar/MHF_Steve/64";
                          }}
                        />
                        <div>
                          <div className="font-semibold text-foreground">{displayName(order)}</div>
                          <div className="text-xs text-muted-foreground">{order.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="max-w-[180px] truncate text-xs text-muted-foreground">
                        {safeOrderItems(order.items).map((i) => `${i.name} x${i.qty}`).join(", ") || "No items"}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-foreground">{order.total_display}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString("en-PH", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelected(order);
                            setNote(order.admin_note ?? "");
                            setActionError(null);
                          }}
                          className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-card/60 text-muted-foreground transition hover:text-foreground"
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {order.status === "pending" && (
                          <>
                            <button
                              onClick={() => doAction(order, "confirm")}
                              disabled={actionLoading === order.id}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-400 transition hover:bg-emerald-500/25 disabled:opacity-50"
                            >
                              {actionLoading === order.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              )}
                              Confirm
                            </button>
                            <button
                              onClick={() => doAction(order, "reject")}
                              disabled={actionLoading === order.id}
                              className="inline-flex items-center gap-1 rounded-lg bg-red-500/15 px-3 py-1.5 text-xs font-semibold text-red-400 transition hover:bg-red-500/25 disabled:opacity-50"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AccountsManager
        accounts={accounts}
        loading={accountsLoading}
        error={accountError}
        onVerify={(account) => doAccountFlag(account, { email_verified: true })}
        onUnverify={(account) => doAccountFlag(account, { email_verified: false })}
        onToggleDisabled={(account) => doAccountFlag(account, { disabled: !account.disabled })}
        onDelete={doDeleteAccount}
        onCreate={doCreateAccount}
      />

      <PromoManager token={token} />

      <ProductManager token={token} />

      {/* Detail drawer */}
      {selected && (
        <OrderDrawer
          order={selected}
          onClose={() => setSelected(null)}
          onAction={doAction}
          actionLoading={actionLoading}
          actionError={actionError}
          note={note}
          setNote={setNote}
          noteSaving={noteSaving}
          onSaveNote={doSaveNote}
          onUpdate={refreshSelected}
        />
      )}
    </section>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  tone: "warning" | "success" | "accent" | "primary";
}) {
  const tones = {
    warning: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
    success: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
    accent: "bg-accent/10 text-accent ring-accent/20",
    primary: "bg-primary/10 text-primary ring-primary/20",
  };
  return (
    <div className="pixel-card rounded-2xl p-5">
      <div className={`inline-flex rounded-xl p-2.5 ring-1 ${tones[tone]}`}>{icon}</div>
      <div className="mt-3 text-2xl font-bold text-foreground">{value}</div>
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

function AccountsManager({
  accounts,
  loading,
  error,
  onVerify,
  onUnverify,
  onToggleDisabled,
  onDelete,
  onCreate,
}: {
  accounts: StoreAccount[];
  loading: boolean;
  error: string | null;
  onVerify: (account: StoreAccount) => void;
  onUnverify: (account: StoreAccount) => void;
  onToggleDisabled: (account: StoreAccount) => void;
  onDelete: (account: StoreAccount) => void;
  onCreate: (input: {
    username: string;
    edition: "java" | "bedrock";
    email: string;
    emailVerified: boolean;
  }) => Promise<{ ok: true } | { ok: false; error: string }>;
}) {
  const verified = accounts.filter((a) => a.email_verified).length;
  const disabled = accounts.filter((a) => a.disabled).length;
  const [username, setUsername] = useState("");
  const [edition, setEdition] = useState<"java" | "bedrock">("java");
  const [email, setEmail] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const submitAccount = async (e: FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    const res = await onCreate({ username, edition, email, emailVerified });
    if (res.ok) {
      setUsername("");
      setEmail("");
      setEmailVerified(false);
      setEdition("java");
    } else {
      setCreateError(res.error);
    }
    setCreating(false);
  };

  return (
    <section className="mt-10 rounded-2xl border border-border bg-card/40 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-accent ring-1 ring-accent/30">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Manage Accounts</h2>
            <p className="text-xs text-muted-foreground">
              Verify emails, block bad accounts, and review customer spending.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-border bg-background/40 px-3 py-1 text-muted-foreground">
            {accounts.length} total
          </span>
          <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-emerald-300">
            {verified} verified
          </span>
          <span className="rounded-full border border-red-400/30 bg-red-400/10 px-3 py-1 text-red-300">
            {disabled} disabled
          </span>
        </div>
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <form
        onSubmit={submitAccount}
        className="mt-5 grid gap-3 rounded-2xl border border-border/70 bg-background/30 p-4 lg:grid-cols-[1fr_150px_1.4fr_auto_auto]"
      >
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Username</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Minecraft name"
            className="mt-1 w-full rounded-xl border border-border bg-card/70 px-3 py-2 text-sm outline-none transition focus:border-accent"
          />
        </div>
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Edition</label>
          <select
            value={edition}
            onChange={(e) => setEdition(e.target.value as "java" | "bedrock")}
            className="mt-1 w-full rounded-xl border border-border bg-card/70 px-3 py-2 text-sm outline-none transition focus:border-accent"
          >
            <option value="java">Java</option>
            <option value="bedrock">Bedrock</option>
          </select>
        </div>
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="player@gmail.com"
            className="mt-1 w-full rounded-xl border border-border bg-card/70 px-3 py-2 text-sm outline-none transition focus:border-accent"
          />
        </div>
        <label className="flex items-center gap-2 self-end rounded-xl border border-border bg-card/50 px-3 py-2 text-xs font-semibold text-muted-foreground">
          <input
            type="checkbox"
            checked={emailVerified}
            onChange={(e) => setEmailVerified(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          Verified
        </label>
        <button
          type="submit"
          disabled={creating}
          className="inline-flex items-center justify-center gap-2 self-end rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-accent disabled:opacity-50"
        >
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          Add
        </button>
        {createError && (
          <div className="lg:col-span-5 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {createError}
          </div>
        )}
      </form>

      <div className="mt-5 overflow-hidden rounded-xl border border-border/70">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : accounts.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">No synced accounts yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-background/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Player</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Orders</th>
                  <th className="px-4 py-3 font-semibold">Spent</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {accounts.map((account) => (
                  <tr key={account.id} className="transition hover:bg-background/30">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground">{account.display_name}</div>
                      <div className="text-xs capitalize text-muted-foreground">{account.edition}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{account.email}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            account.email_verified
                              ? "bg-emerald-400/10 text-emerald-300"
                              : "bg-amber-400/10 text-amber-300"
                          }`}
                        >
                          {account.email_verified ? "Verified" : "Unverified"}
                        </span>
                        {account.disabled && (
                          <span className="rounded-full bg-red-400/10 px-2.5 py-1 text-xs font-semibold text-red-300">
                            Disabled
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-foreground">{account.history_count}</td>
                    <td className="px-4 py-3 font-semibold text-foreground">{account.total_spent_display}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-2">
                        {account.email_verified ? (
                          <button
                            onClick={() => onUnverify(account)}
                            className="inline-flex items-center gap-1 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-300 transition hover:bg-amber-400/20"
                          >
                            <BadgeAlert className="h-3.5 w-3.5" />
                            Unverify
                          </button>
                        ) : (
                          <button
                            onClick={() => onVerify(account)}
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-400/20"
                          >
                            <BadgeCheck className="h-3.5 w-3.5" />
                            Verify
                          </button>
                        )}
                        <button
                          onClick={() => onToggleDisabled(account)}
                          className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                            account.disabled
                              ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/20"
                              : "border-red-400/30 bg-red-400/10 text-red-300 hover:bg-red-400/20"
                          }`}
                        >
                          <Ban className="h-3.5 w-3.5" />
                          {account.disabled ? "Enable" : "Disable"}
                        </button>
                        <button
                          onClick={() => onDelete(account)}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-300 transition hover:bg-red-500/20"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const map: Record<OrderStatus, { label: string; cls: string; icon: ReactNode }> = {
    pending: {
      label: "Pending",
      cls: "bg-amber-500/15 text-amber-400 ring-amber-500/20",
      icon: <Clock className="h-3 w-3" />,
    },
    confirmed: {
      label: "Confirmed",
      cls: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/20",
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
    delivered: {
      label: "Delivered",
      cls: "bg-accent/15 text-accent ring-accent/20",
      icon: <Package className="h-3 w-3" />,
    },
    rejected: {
      label: "Rejected",
      cls: "bg-red-500/15 text-red-400 ring-red-500/20",
      icon: <XCircle className="h-3 w-3" />,
    },
  };
  const s = map[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${s.cls}`}
    >
      {s.icon}
      {s.label}
    </span>
  );
}

function PromoManager({ token }: { token: string }) {
  const [promos, setPromos] = useState<PromoCodeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<PromoCodeRow | null>(null);
  const [code, setCode] = useState("");
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("10");
  const [kind, setKind] = useState<"percent" | "fixed">("percent");
  const [minSpend, setMinSpend] = useState("0");
  const [maxUses, setMaxUses] = useState("");
  const [maxUsesPerUser, setMaxUsesPerUser] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [active, setActive] = useState(true);

  const resetPromoForm = () => {
    setEditing(null);
    setCode("");
    setLabel("");
    setDescription("");
    setAmount(kind === "percent" ? "10" : "50");
    setMinSpend("0");
    setMaxUses("");
    setMaxUsesPerUser("");
    setExpiresAt("");
    setActive(true);
  };

  const editPromo = (promo: PromoCodeRow) => {
    setEditing(promo);
    setCode(promo.code);
    setLabel(promo.label);
    setDescription(promo.description ?? "");
    setKind(promo.kind);
    setAmount(promo.kind === "percent" ? String(promo.amount) : String(promo.amount / 100));
    setMinSpend(String((promo.min_subtotal_cents ?? 0) / 100));
    setMaxUses(promo.max_uses ? String(promo.max_uses) : "");
    setMaxUsesPerUser(promo.max_uses_per_user ? String(promo.max_uses_per_user) : "");
    setExpiresAt(promo.expires_at ? promo.expires_at.slice(0, 16) : "");
    setActive(promo.active);
  };

  const loadPromos = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await listPromoCodes();
    if (res.ok) setPromos(res.promos);
    else setError(res.error);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadPromos();
  }, [loadPromos]);

  const submitPromo = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const cleanCode = code.trim().toUpperCase();
    const amountValue = Number(amount);
    const minValue = Math.max(0, Math.round(Number(minSpend || 0) * 100));
    if (!cleanCode || !Number.isFinite(amountValue) || amountValue <= 0) {
      setError("Enter a code and a valid discount amount.");
      setSaving(false);
      return;
    }

    const res = await savePromoCode(
      {
        code: cleanCode,
        label: label.trim() || cleanCode,
        description:
          description.trim() ||
          (kind === "percent" ? `${amountValue}% off checkout.` : `PHP ${amountValue} off checkout.`),
        kind,
        amount: kind === "percent" ? Math.round(amountValue) : Math.round(amountValue * 100),
        min_subtotal_cents: minValue,
        active,
        max_uses: maxUses ? Math.max(1, Math.floor(Number(maxUses))) : null,
        max_uses_per_user: maxUsesPerUser ? Math.max(1, Math.floor(Number(maxUsesPerUser))) : null,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      },
      token,
    );
    if (res.ok) {
      setPromos((prev) => [res.promo, ...prev.filter((promo) => promo.code !== res.promo.code)]);
      resetPromoForm();
    } else {
      setError(res.error);
    }
    setSaving(false);
  };

  const removePromo = async (promo: PromoCodeRow) => {
    if (!window.confirm(`Delete promo code ${promo.code}?`)) return;
    setError(null);
    const res = await deletePromoCode(promo.code, token);
    if (res.ok) setPromos((prev) => prev.filter((item) => item.code !== promo.code));
    else setError(res.error);
  };

  const togglePromo = async (promo: PromoCodeRow) => {
    setError(null);
    const res = await savePromoCode({ ...promo, active: !promo.active }, token);
    if (res.ok) setPromos((prev) => prev.map((item) => (item.code === res.promo.code ? res.promo : item)));
    else setError(res.error);
  };

  return (
    <section className="mt-10 rounded-2xl border border-border bg-card/40 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-accent/10 text-accent ring-1 ring-accent/30">
            <Percent className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Promo Codes</h2>
            <p className="text-xs text-muted-foreground">
              Create, expire, limit, disable, and delete checkout discounts.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={loadPromos}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-2 text-sm font-semibold text-foreground transition hover:border-accent disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh Promos
        </button>
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={submitPromo} className="mt-5 grid gap-3 rounded-2xl border border-border/70 bg-background/30 p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <Field label="Code">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="CODE"
              disabled={Boolean(editing)}
              className="w-full rounded-xl border border-border bg-card/70 px-3 py-2 font-mono text-sm uppercase outline-none transition focus:border-accent disabled:opacity-60"
            />
          </Field>
          <Field label="Label">
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Launch Discount"
              className="w-full rounded-xl border border-border bg-card/70 px-3 py-2 text-sm outline-none transition focus:border-accent"
            />
          </Field>
          <Field label="Discount Type">
            <select
              value={kind}
              onChange={(e) => {
                const next = e.target.value as "percent" | "fixed";
                setKind(next);
                setAmount(next === "percent" ? "10" : "50");
              }}
              className="w-full rounded-xl border border-border bg-card/70 px-3 py-2 text-sm outline-none transition focus:border-accent"
            >
              <option value="percent">Percent</option>
              <option value="fixed">PHP off</option>
            </select>
          </Field>
          <Field label={kind === "percent" ? "Percent" : "PHP Amount"}>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={kind === "percent" ? "10" : "50"}
              inputMode="decimal"
              className="w-full rounded-xl border border-border bg-card/70 px-3 py-2 text-sm outline-none transition focus:border-accent"
            />
          </Field>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <Field label="Min Spend PHP">
            <input
              value={minSpend}
              onChange={(e) => setMinSpend(e.target.value)}
              placeholder="0"
              inputMode="decimal"
              className="w-full rounded-xl border border-border bg-card/70 px-3 py-2 text-sm outline-none transition focus:border-accent"
            />
          </Field>
          <Field label="Max Total Uses">
            <input
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              placeholder="Unlimited"
              inputMode="numeric"
              className="w-full rounded-xl border border-border bg-card/70 px-3 py-2 text-sm outline-none transition focus:border-accent"
            />
          </Field>
          <Field label="Max Uses Per User">
            <input
              value={maxUsesPerUser}
              onChange={(e) => setMaxUsesPerUser(e.target.value)}
              placeholder="Unlimited"
              inputMode="numeric"
              className="w-full rounded-xl border border-border bg-card/70 px-3 py-2 text-sm outline-none transition focus:border-accent"
            />
          </Field>
          <Field label="Expires At">
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full rounded-xl border border-border bg-card/70 px-3 py-2 text-sm outline-none transition focus:border-accent"
            />
          </Field>
        </div>

        <Field label="Description">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Shown in admin and future promo displays."
            rows={2}
            className="w-full rounded-xl border border-border bg-card/70 px-3 py-2 text-sm outline-none transition focus:border-accent"
          />
        </Field>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            Active promo
          </label>
          <div className="flex gap-2">
            {editing && (
              <button
                type="button"
                onClick={resetPromoForm}
                className="rounded-xl border border-border bg-card/60 px-4 py-2 text-sm font-semibold text-foreground"
              >
                Cancel Edit
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-accent disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : editing ? "Save Promo" : "Add Promo"}
            </button>
          </div>
        </div>
      </form>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading promos...</div>
        ) : promos.length === 0 ? (
          <div className="text-sm text-muted-foreground">No promo codes yet.</div>
        ) : (
          promos.map((promo) => (
            <div key={promo.code} className="rounded-2xl border border-border/70 bg-background/30 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-sm font-bold text-foreground">{promo.code}</span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${promo.active ? "bg-emerald-400/10 text-emerald-300" : "bg-red-400/10 text-red-300"}`}>
                  {promo.active ? "Active" : "Off"}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{promo.description || promo.label}</p>
              <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                <p>Used {promo.used_count}{promo.max_uses ? ` / ${promo.max_uses}` : ""} times</p>
                <p>Per user: {promo.max_uses_per_user ?? "Unlimited"}</p>
                <p>Min spend: {formatCents(promo.min_subtotal_cents ?? 0)}</p>
                <p className="flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  Expires: {promo.expires_at ? new Date(promo.expires_at).toLocaleString("en-PH") : "Never"}
                </p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => editPromo(promo)}
                  className="rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-accent"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => togglePromo(promo)}
                  className="rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-accent"
                >
                  {promo.active ? "Disable" : "Enable"}
                </button>
                <button
                  type="button"
                  onClick={() => removePromo(promo)}
                  className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-300 transition hover:bg-red-500/20"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

const emptyProduct: Omit<StoreProductRow, "created_at" | "updated_at"> = {
  id: "",
  category: "rank",
  name: "",
  tagline: "",
  price_cents: 0,
  price_display: "PHP 0",
  perks: [],
  active: true,
  coming_soon: false,
  featured: false,
  sort_order: 0,
};

function ProductManager({ token }: { token: string }) {
  const [products, setProducts] = useState<StoreProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyProduct);
  const [pricePhp, setPricePhp] = useState("");
  const [perksText, setPerksText] = useState("");

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await listStoreProducts();
    if (res.ok) setProducts(res.products);
    else setError(res.error);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const resetProductForm = () => {
    setEditingId(null);
    setForm(emptyProduct);
    setPricePhp("");
    setPerksText("");
  };

  const editProduct = (product: StoreProductRow) => {
    setEditingId(product.id);
    setForm({
      id: product.id,
      category: product.category,
      name: product.name,
      tagline: product.tagline,
      price_cents: product.price_cents,
      price_display: product.price_display,
      perks: product.perks ?? [],
      active: product.active,
      coming_soon: product.coming_soon,
      featured: product.featured,
      sort_order: product.sort_order,
    });
    setPricePhp(String(product.price_cents / 100));
    setPerksText((product.perks ?? []).join("\n"));
  };

  const submitProduct = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const cleanId = form.id.trim().toLowerCase();
    const php = Math.max(0, Number(pricePhp || 0));
    if (!cleanId || !form.name.trim()) {
      setError("Product needs an ID and name.");
      setSaving(false);
      return;
    }
    if (!Number.isFinite(php)) {
      setError("Enter a valid PHP price.");
      setSaving(false);
      return;
    }

    const priceCents = Math.round(php * 100);
    const res = await saveStoreProduct(
      {
        ...form,
        id: cleanId,
        price_cents: priceCents,
        price_display: formatCents(priceCents),
        perks: perksText
          .split("\n")
          .map((perk) => perk.trim())
          .filter(Boolean),
      },
      token,
    );

    if (res.ok) {
      setProducts((prev) => [res.product, ...prev.filter((product) => product.id !== res.product.id)]);
      resetProductForm();
    } else {
      setError(res.error);
    }
    setSaving(false);
  };

  const removeProduct = async (product: StoreProductRow) => {
    if (!window.confirm(`Delete ${product.name}?`)) return;
    setError(null);
    const res = await deleteStoreProduct(product.id, token);
    if (res.ok) setProducts((prev) => prev.filter((item) => item.id !== product.id));
    else setError(res.error);
  };

  const byCategory = (category: StoreProductRow["category"]) =>
    products.filter((product) => product.category === category);

  return (
    <section className="mt-10 rounded-2xl border border-border bg-card/40 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-accent ring-1 ring-accent/30">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Store Products</h2>
            <p className="text-xs text-muted-foreground">
              Add and edit ranks, keys, and bundles from the admin panel.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={loadProducts}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-2 text-sm font-semibold text-foreground transition hover:border-accent disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh Products
        </button>
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={submitProduct} className="mt-5 grid gap-3 rounded-2xl border border-border/70 bg-background/30 p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <Field label="Product ID">
            <input
              value={form.id}
              onChange={(e) => setForm((prev) => ({ ...prev, id: e.target.value }))}
              placeholder="rank-example"
              disabled={Boolean(editingId)}
              className="w-full rounded-xl border border-border bg-card/70 px-3 py-2 font-mono text-sm outline-none transition focus:border-accent disabled:opacity-60"
            />
          </Field>
          <Field label="Category">
            <select
              value={form.category}
              onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value as StoreProductRow["category"] }))}
              className="w-full rounded-xl border border-border bg-card/70 px-3 py-2 text-sm outline-none transition focus:border-accent"
            >
              <option value="rank">Rank</option>
              <option value="key">Key</option>
              <option value="bundle">Bundle</option>
            </select>
          </Field>
          <Field label="Name">
            <input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Crescent"
              className="w-full rounded-xl border border-border bg-card/70 px-3 py-2 text-sm outline-none transition focus:border-accent"
            />
          </Field>
          <Field label="Price PHP">
            <input
              value={pricePhp}
              onChange={(e) => setPricePhp(e.target.value)}
              placeholder="99"
              inputMode="decimal"
              className="w-full rounded-xl border border-border bg-card/70 px-3 py-2 text-sm outline-none transition focus:border-accent"
            />
          </Field>
        </div>

        <div className="grid gap-3 md:grid-cols-[1.3fr_120px]">
          <Field label="Tagline">
            <input
              value={form.tagline}
              onChange={(e) => setForm((prev) => ({ ...prev, tagline: e.target.value }))}
              placeholder="Short product description"
              className="w-full rounded-xl border border-border bg-card/70 px-3 py-2 text-sm outline-none transition focus:border-accent"
            />
          </Field>
          <Field label="Sort Order">
            <input
              value={form.sort_order}
              onChange={(e) => setForm((prev) => ({ ...prev, sort_order: Math.floor(Number(e.target.value || 0)) }))}
              inputMode="numeric"
              className="w-full rounded-xl border border-border bg-card/70 px-3 py-2 text-sm outline-none transition focus:border-accent"
            />
          </Field>
        </div>

        <Field label="Perks / Contents">
          <textarea
            value={perksText}
            onChange={(e) => setPerksText(e.target.value)}
            placeholder="One perk per line"
            rows={5}
            className="w-full rounded-xl border border-border bg-card/70 px-3 py-2 text-sm outline-none transition focus:border-accent"
          />
        </Field>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm((prev) => ({ ...prev, active: e.target.checked }))}
              />
              Active
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.coming_soon}
                onChange={(e) => setForm((prev) => ({ ...prev, coming_soon: e.target.checked }))}
              />
              Coming soon
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm((prev) => ({ ...prev, featured: e.target.checked }))}
              />
              Most popular
            </label>
          </div>
          <div className="flex gap-2">
            {editingId && (
              <button
                type="button"
                onClick={resetProductForm}
                className="rounded-xl border border-border bg-card/60 px-4 py-2 text-sm font-semibold text-foreground"
              >
                Cancel Edit
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-accent disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : editingId ? "Save Product" : "Add Product"}
            </button>
          </div>
        </div>
      </form>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {(["rank", "key", "bundle"] as const).map((category) => (
          <div key={category} className="rounded-2xl border border-border/70 bg-background/30 p-4">
            <div className="mb-3 flex items-center gap-2">
              {category === "key" ? <KeyRound className="h-4 w-4 text-accent" /> : <Package className="h-4 w-4 text-accent" />}
              <h3 className="font-bold capitalize">{category}s</h3>
            </div>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : byCategory(category).length === 0 ? (
              <p className="text-sm text-muted-foreground">No {category}s yet.</p>
            ) : (
              <div className="space-y-3">
                {byCategory(category).map((product) => (
                  <div key={product.id} className="rounded-xl border border-border/60 bg-card/40 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-foreground">{product.name}</p>
                        <p className="font-mono text-[11px] text-muted-foreground">{product.id}</p>
                      </div>
                      <span className="text-sm font-bold text-foreground">{product.price_display}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <MiniPill active={product.active} label={product.active ? "Active" : "Off"} />
                      <MiniPill active={product.featured} label="Popular" />
                      <MiniPill active={product.coming_soon} label="Soon" />
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => editProduct(product)}
                        className="rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-accent"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => removeProduct(product)}
                        className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-300 transition hover:bg-red-500/20"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function MiniPill({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
        active ? "bg-accent/15 text-accent" : "bg-muted/40 text-muted-foreground"
      }`}
    >
      {label}
    </span>
  );
}

function OrderDrawer({
  order,
  onClose,
  onAction,
  actionLoading,
  actionError,
  note,
  setNote,
  noteSaving,
  onSaveNote,
}: {
  order: Order;
  onClose: () => void;
  onAction: (order: Order, action: "confirm" | "reject") => void;
  actionLoading: string | null;
  actionError: string | null;
  note: string;
  setNote: (v: string) => void;
  noteSaving: boolean;
  onSaveNote: (order: Order) => void;
  onUpdate: (order: Order) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative h-full w-full max-w-lg overflow-y-auto border-l border-border bg-background shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/95 px-6 py-4 backdrop-blur">
          <div>
            <h2 className="font-display text-xl">Order Details</h2>
            <p className="font-mono text-xs text-muted-foreground">#{order.id}</p>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground transition hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-6 px-6 py-6">
          {/* Status */}
          <div className="flex items-center gap-3">
            <StatusBadge status={order.status} />
            <span className="text-xs text-muted-foreground">
              {new Date(order.created_at).toLocaleString("en-PH")}
            </span>
          </div>

          {/* Player */}
          <div className="pixel-card rounded-2xl p-5">
            <div className="flex items-center gap-4">
              <img
                src={bodyFor(order)}
                alt=""
                className="h-24 w-auto"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "https://mc-heads.net/body/MHF_Steve/256";
                }}
              />
              <div>
                <div className="font-display text-lg text-foreground">{displayName(order)}</div>
                <div className="text-xs text-muted-foreground capitalize">{order.edition} edition</div>
                <div className="mt-1 text-sm text-muted-foreground">{order.email}</div>
                <a
                  href={`https://namemc.com/profile/${encodeURIComponent(order.username)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs text-accent hover:underline"
                >
                  View on NameMC <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Payment info */}
          <div className="pixel-card rounded-2xl p-5">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Payment Details
            </h3>
            <dl className="space-y-2 text-sm">
              <Row label="Method" value={order.method.toUpperCase()} />
              <Row label="GCash Number" value={order.gcash_number || "N/A"} />
              <Row label="Reference No." value={order.reference_no || "N/A"} mono />
              <Row label="Subtotal" value={order.subtotal_display || order.total_display} />
              {order.promo_code && <Row label="Promo Code" value={order.promo_code} mono />}
              {(order.discount_cents ?? 0) > 0 && order.discount_display && (
                <Row label="Discount" value={`-${order.discount_display}`} />
              )}
              <Row label="Total" value={order.total_display} bold />
            </dl>
          </div>

          {/* Items */}
          <div className="pixel-card rounded-2xl p-5">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Items
            </h3>
            <ul className="space-y-2">
              {safeOrderItems(order.items).map((item, i) => (
                <li key={i} className="flex items-center justify-between text-sm">
                  <span className="text-foreground">
                    {item.name} <span className="text-muted-foreground">×{item.qty}</span>
                  </span>
                  <span className="text-muted-foreground">{item.price}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Delivery log */}
          {order.delivery_log && order.delivery_log.length > 0 && (
            <div className="pixel-card rounded-2xl p-5">
              <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Gamepad2 className="h-4 w-4" /> In-Game Delivery Log
              </h3>
              <ul className="space-y-2">
                {order.delivery_log.map((log, i) => (
                  <li key={i} className="rounded-lg bg-background/50 px-3 py-2 font-mono text-xs">
                    <div className="flex items-center gap-2">
                      {log.ok ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-red-400" />
                      )}
                      <span className="text-foreground">{log.command}</span>
                    </div>
                    {log.response && (
                      <div className="mt-1 text-muted-foreground">→ {log.response}</div>
                    )}
                  </li>
                ))}
              </ul>
              {order.delivered_at && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Delivered at {new Date(order.delivered_at).toLocaleString("en-PH")}
                </p>
              )}
            </div>
          )}

          {/* Admin note */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Admin Note
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note (optional)..."
              rows={2}
              className="w-full rounded-xl border border-border bg-card/60 px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-accent"
            />
            <button
              type="button"
              onClick={() => onSaveNote(order)}
              disabled={noteSaving}
              className="mt-3 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-2 text-xs font-semibold text-accent transition hover:bg-accent/20 disabled:opacity-50"
            >
              {noteSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
              {noteSaving ? "Saving..." : "Save Note"}
            </button>
          </div>

          {actionError && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {actionError}
            </div>
          )}

          {/* Actions */}
          {order.status === "pending" && (
            <div className="flex gap-3">
              <button
                onClick={() => onAction(order, "confirm")}
                disabled={actionLoading === order.id}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-50"
              >
                {actionLoading === order.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Confirm & Deliver In-Game
              </button>
              <button
                onClick={() => onAction(order, "reject")}
                disabled={actionLoading === order.id}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-3 text-sm font-semibold text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
              >
                <XCircle className="h-4 w-4" />
                Reject
              </button>
            </div>
          )}

          {order.status !== "pending" && (
            <div className="rounded-xl border border-border bg-card/40 px-4 py-3 text-sm text-muted-foreground">
              This order has been {order.status}. No further actions available.
            </div>
          )}

          <p className="text-center text-xs text-muted-foreground">
            Confirmed orders are queued for in-game delivery after approval.
          </p>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
  bold,
}: {
  label: string;
  value: string;
  mono?: boolean;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={`${mono ? "font-mono" : ""} ${bold ? "font-bold text-foreground" : "text-foreground"}`}>
        {value}
      </dd>
    </div>
  );
}

function avatarFor(order: Order): string {
  return order.edition === "java"
    ? `https://mc-heads.net/avatar/${encodeURIComponent(order.username)}/64`
    : "https://mc-heads.net/avatar/MHF_Steve/64";
}

function bodyFor(order: Order): string {
  return order.edition === "java"
    ? `https://mc-heads.net/body/${encodeURIComponent(order.username)}/256`
    : "https://mc-heads.net/body/MHF_Steve/256";
}

function displayName(order: Order): string {
  return order.edition === "bedrock" ? `.${order.username}` : order.username;
}

function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
  }).format(cents / 100);
}
