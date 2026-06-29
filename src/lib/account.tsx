import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { userKey, validateEmail, validatePassword, validateUsername } from "@/lib/auth-utils";
import { getAccountProfile, getSupabaseBrowserClient, upsertAccountProfile } from "@/lib/supabase";

export type Edition = "java" | "bedrock";

export type PurchaseRecord = {
  id: string;
  date: string;
  items: { id: string; name: string; price: string }[];
  total: string;
  method?: "gcash";
  promoCode?: string;
  discount?: string;
};

export type Account = {
  username: string;
  edition: Edition;
  email: string;
  displayName: string;
  avatarUrl: string;
  bodyUrl: string;
  history: PurchaseRecord[];
  emailVerified: boolean;
  disabled: boolean;
};

type StoredUser = {
  username: string;
  edition: Edition;
  email: string;
  history: PurchaseRecord[];
  createdAt: string;
  emailVerified?: boolean;
  disabled?: boolean;
};

type AccountCtx = {
  account: Account | null;
  signUp: (input: {
    username: string;
    edition: Edition;
    email: string;
    password: string;
    confirmPassword: string;
  }) => Promise<{ ok: true; message?: string } | { ok: false; error: string }>;
  signIn: (input: { email: string; password: string }) => Promise<{ ok: true } | { ok: false; error: string }>;
  signOut: () => Promise<void>;
  recordPurchase: (purchase: PurchaseRecord) => void;
  refreshVerification: () => Promise<{ ok: true } | { ok: false; error: string }>;
  requestPasswordReset: (email: string) => Promise<{ ok: true; message: string } | { ok: false; error: string }>;
  updatePassword: (password: string, confirmPassword: string) => Promise<{ ok: true; message: string } | { ok: false; error: string }>;
};

const Ctx = createContext<AccountCtx | null>(null);
const USERS_KEY = "lunaris.users.v2";

function sanitizeHistory(history: unknown): PurchaseRecord[] {
  if (!Array.isArray(history)) return [];
  return history
    .filter((purchase): purchase is PurchaseRecord => {
      if (!purchase || typeof purchase !== "object") return false;
      const p = purchase as Partial<PurchaseRecord>;
      return typeof p.id === "string" && typeof p.date === "string" && typeof p.total === "string";
    })
    .map((purchase) => ({
      id: purchase.id,
      date: purchase.date,
      total: purchase.total,
      method: purchase.method === "gcash" ? "gcash" : undefined,
      promoCode: typeof purchase.promoCode === "string" ? purchase.promoCode : undefined,
      discount: typeof purchase.discount === "string" ? purchase.discount : undefined,
      items: Array.isArray(purchase.items)
        ? purchase.items.filter(
            (item): item is { id: string; name: string; price: string } =>
              Boolean(item) &&
              typeof item.id === "string" &&
              typeof item.name === "string" &&
              typeof item.price === "string",
          )
        : [],
    }));
}

function buildAccount(user: StoredUser): Account {
  const clean = user.username.trim().replace(/^\.+/, "");
  const displayName = user.edition === "bedrock" ? `.${clean}` : clean;
  const avatarUrl =
    user.edition === "java"
      ? `https://mc-heads.net/avatar/${encodeURIComponent(clean)}/96`
      : "https://mc-heads.net/avatar/MHF_Steve/96";
  const bodyUrl =
    user.edition === "java"
      ? `https://mc-heads.net/body/${encodeURIComponent(clean)}/256`
      : "https://mc-heads.net/body/MHF_Steve/256";
  return {
    username: clean,
    edition: user.edition,
    email: user.email,
    displayName,
    avatarUrl,
    bodyUrl,
    history: sanitizeHistory(user.history),
    emailVerified: Boolean(user.emailVerified),
    disabled: Boolean(user.disabled),
  };
}

function displayToCents(value: string): number {
  const amount = Number(value.replace(/[^0-9.]/g, ""));
  return Math.round((Number.isFinite(amount) ? amount : 0) * 100);
}

function accountTotals(history: PurchaseRecord[]) {
  const totalSpentCents = history.reduce((sum, purchase) => sum + displayToCents(purchase.total), 0);
  const totalSpentDisplay = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(totalSpentCents / 100);
  return { totalSpentCents, totalSpentDisplay };
}

function readUsers(): Record<string, StoredUser> {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, StoredUser>;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed).map(([key, user]) => [
        key,
        {
          ...user,
          history: sanitizeHistory(user?.history),
        },
      ]),
    );
  } catch {
    return {};
  }
}

function writeUsers(users: Record<string, StoredUser>) {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch {
    // Local storage can be blocked; keep the app usable without local account cache.
  }
}

function authRedirectUrl() {
  if (typeof window === "undefined") return undefined;
  return `${window.location.origin}/account`;
}

function userFromAuth(authUser: User): StoredUser | null {
  const username = String(authUser.user_metadata?.username ?? "").trim().replace(/^\.+/, "");
  const rawEdition = String(authUser.user_metadata?.edition ?? "java");
  const edition: Edition = rawEdition === "bedrock" ? "bedrock" : "java";
  const email = authUser.email?.trim() ?? "";
  if (!username || !email) return null;

  const users = readUsers();
  const key = userKey(username, edition);
  const existing = users[key];
  return {
    username,
    edition,
    email,
    history: existing?.history ?? [],
    createdAt: existing?.createdAt ?? authUser.created_at ?? new Date().toISOString(),
    emailVerified: Boolean(authUser.email_confirmed_at),
    disabled: existing?.disabled ?? false,
  };
}

async function syncAccount(user: StoredUser) {
  const built = buildAccount(user);
  const totals = accountTotals(user.history);
  const result = await upsertAccountProfile({
    username: built.username,
    edition: built.edition,
    email: built.email,
    displayName: built.displayName,
    emailVerified: built.emailVerified,
    historyCount: user.history.length,
    totalSpentCents: totals.totalSpentCents,
    totalSpentDisplay: totals.totalSpentDisplay,
  });
  if (!result.ok) console.warn(result.error);
}

async function applyAuthUser(authUser: User, setAccount: (account: Account | null) => void) {
  const user = userFromAuth(authUser);
  if (!user) {
    setAccount(null);
    return;
  }

  const profile = await getAccountProfile(user.username, user.edition);
  if (profile.ok && profile.account) {
    user.disabled = profile.account.disabled;
    user.emailVerified = Boolean(authUser.email_confirmed_at) || profile.account.email_verified;
  }

  const users = readUsers();
  users[userKey(user.username, user.edition)] = user;
  writeUsers(users);
  setAccount(buildAccount(user));
  void syncAccount(user).catch((error) => console.warn(error));
}

export function AccountProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null);

  useEffect(() => {
    let unsubscribe = () => {};

    const timer = window.setTimeout(() => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase.ok) return;

      supabase.client.auth.getSession().then(({ data }) => {
        if (data.session?.user) void applyAuthUser(data.session.user, setAccount);
      }).catch((error) => console.warn(error));

      const { data } = supabase.client.auth.onAuthStateChange((_event, session) => {
        if (session?.user) void applyAuthUser(session.user, setAccount).catch((error) => console.warn(error));
        else setAccount(null);
      });

      unsubscribe = () => data.subscription.unsubscribe();
    }, 150);

    return () => {
      window.clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  const value = useMemo<AccountCtx>(
    () => ({
      account,
      signUp: async ({ username, edition, email, password, confirmPassword }) => {
        const supabase = getSupabaseBrowserClient();
        if (!supabase.ok) return { ok: false, error: supabase.error };

        const nameErr = validateUsername(username);
        if (nameErr) return { ok: false, error: nameErr };
        const emailErr = validateEmail(email);
        if (emailErr) return { ok: false, error: emailErr };
        const passErr = validatePassword(password);
        if (passErr) return { ok: false, error: passErr };
        if (password !== confirmPassword) return { ok: false, error: "Passwords do not match." };

        const clean = username.trim().replace(/^\.+/, "");
        const { data, error } = await supabase.client.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: authRedirectUrl(),
            data: { username: clean, edition },
          },
        });

        if (error) return { ok: false, error: error.message };

        const stored: StoredUser = {
          username: clean,
          edition,
          email: email.trim(),
          history: readUsers()[userKey(clean, edition)]?.history ?? [],
          createdAt: new Date().toISOString(),
          emailVerified: Boolean(data.user?.email_confirmed_at),
          disabled: false,
        };
        const users = readUsers();
        users[userKey(clean, edition)] = stored;
        writeUsers(users);
        void syncAccount(stored).catch((error) => console.warn(error));

        if (data.session?.user) {
          await applyAuthUser(data.session.user, setAccount);
        }

        return {
          ok: true,
          message: "Account created. Check your email and click the verification link before checkout.",
        };
      },
      signIn: async ({ email, password }) => {
        const supabase = getSupabaseBrowserClient();
        if (!supabase.ok) return { ok: false, error: supabase.error };

        const emailErr = validateEmail(email);
        if (emailErr) return { ok: false, error: emailErr };
        if (!password) return { ok: false, error: "Enter your password." };

        const { data, error } = await supabase.client.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) return { ok: false, error: error.message };
        if (data.user) await applyAuthUser(data.user, setAccount);

        const built = data.user ? userFromAuth(data.user) : null;
        const profile = built ? await getAccountProfile(built.username, built.edition) : null;
        if (profile?.ok && profile.account?.disabled) {
          await supabase.client.auth.signOut();
          setAccount(null);
          return { ok: false, error: "This account is disabled. Contact support if this is a mistake." };
        }

        return { ok: true };
      },
      signOut: async () => {
        const supabase = getSupabaseBrowserClient();
        if (supabase.ok) await supabase.client.auth.signOut();
        setAccount(null);
      },
      recordPurchase: (purchase) => {
        if (!account) return;

        const users = readUsers();
        const key = userKey(account.username, account.edition);
        const user = users[key];
        if (!user) return;

        const history = [purchase, ...user.history].slice(0, 25);
        users[key] = { ...user, history };
        writeUsers(users);
        setAccount(buildAccount(users[key]));
        void syncAccount(users[key]).catch((error) => console.warn(error));
      },
      refreshVerification: async () => {
        const supabase = getSupabaseBrowserClient();
        if (!supabase.ok) return { ok: false, error: supabase.error };

        const { data, error } = await supabase.client.auth.getUser();
        if (error) return { ok: false, error: error.message };
        if (!data.user) return { ok: false, error: "Sign in first." };

        await applyAuthUser(data.user, setAccount);
        return { ok: true };
      },
      requestPasswordReset: async (email) => {
        const supabase = getSupabaseBrowserClient();
        if (!supabase.ok) return { ok: false, error: supabase.error };

        const emailErr = validateEmail(email);
        if (emailErr) return { ok: false, error: emailErr };

        const { error } = await supabase.client.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: authRedirectUrl(),
        });
        if (error) return { ok: false, error: error.message };
        return { ok: true, message: "Password reset email sent. Open the link, then set your new password here." };
      },
      updatePassword: async (password, confirmPassword) => {
        const supabase = getSupabaseBrowserClient();
        if (!supabase.ok) return { ok: false, error: supabase.error };

        const passErr = validatePassword(password);
        if (passErr) return { ok: false, error: passErr };
        if (password !== confirmPassword) return { ok: false, error: "Passwords do not match." };

        const { error } = await supabase.client.auth.updateUser({ password });
        if (error) return { ok: false, error: error.message };
        return { ok: true, message: "Password updated. You can sign in with the new password now." };
      },
    }),
    [account],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAccount() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAccount must be used within AccountProvider");
  return ctx;
}
