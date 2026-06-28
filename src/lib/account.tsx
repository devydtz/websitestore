import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  generateSalt,
  hashPassword,
  userKey,
  validatePassword,
  validateUsername,
} from "@/lib/auth-utils";
import { getAccountProfile, upsertAccountProfile } from "@/lib/supabase";

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
  passwordHash: string;
  salt: string;
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
  }) => Promise<{ ok: true } | { ok: false; error: string }>;
  signIn: (input: {
    username: string;
    edition: Edition;
    password: string;
  }) => Promise<{ ok: true } | { ok: false; error: string }>;
  signOut: () => void;
  recordPurchase: (purchase: PurchaseRecord) => void;
  refreshVerification: () => Promise<{ ok: true } | { ok: false; error: string }>;
};

const Ctx = createContext<AccountCtx | null>(null);
const USERS_KEY = "lunaris.users.v2";
const SESSION_KEY = "lunaris.session.v2";

function buildAccount(user: StoredUser): Account {
  const clean = user.username.trim().replace(/^\.+/, "");
  const displayName = user.edition === "bedrock" ? `.${clean}` : clean;
  const avatarUrl =
    user.edition === "java"
      ? `https://mc-heads.net/avatar/${encodeURIComponent(clean)}/96`
      : `https://mc-heads.net/avatar/MHF_Steve/96`;
  const bodyUrl =
    user.edition === "java"
      ? `https://mc-heads.net/body/${encodeURIComponent(clean)}/256`
      : `https://mc-heads.net/body/MHF_Steve/256`;
  return {
    username: clean,
    edition: user.edition,
    email: user.email,
    displayName,
    avatarUrl,
    bodyUrl,
    history: user.history,
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

async function syncAccount(user: StoredUser) {
  const built = buildAccount(user);
  const totals = accountTotals(user.history);
  await upsertAccountProfile({
    username: built.username,
    edition: built.edition,
    email: built.email,
    displayName: built.displayName,
    emailVerified: built.emailVerified,
    historyCount: user.history.length,
    totalSpentCents: totals.totalSpentCents,
    totalSpentDisplay: totals.totalSpentDisplay,
  });
}

function readUsers(): Record<string, StoredUser> {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, StoredUser>;
  } catch {
    return {};
  }
}

function writeUsers(users: Record<string, StoredUser>) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function readSession(): { username: string; edition: Edition } | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as { username: string; edition: Edition };
  } catch {
    return null;
  }
}

function writeSession(username: string, edition: Edition) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ username, edition }));
}

export function AccountProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null);

  useEffect(() => {
    const session = readSession();
    if (!session) return;
    const users = readUsers();
    const user = users[userKey(session.username, session.edition)];
    if (user) setAccount(buildAccount(user));
    else localStorage.removeItem(SESSION_KEY);
  }, []);

  const value = useMemo<AccountCtx>(
    () => ({
      account,
      signUp: async ({ username, edition, email, password, confirmPassword }) => {
        const nameErr = validateUsername(username);
        if (nameErr) return { ok: false, error: nameErr };
        if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
          return { ok: false, error: "Enter a valid email address." };
        }
        const passErr = validatePassword(password);
        if (passErr) return { ok: false, error: passErr };
        if (password !== confirmPassword) {
          return { ok: false, error: "Passwords do not match." };
        }

        const clean = username.trim().replace(/^\.+/, "");
        const key = userKey(clean, edition);
        const users = readUsers();
        if (users[key]) {
          return { ok: false, error: "An account with this username already exists for this edition." };
        }

        const salt = generateSalt();
        const passwordHash = await hashPassword(password, salt);
        const stored: StoredUser = {
          username: clean,
          edition,
          email: email.trim(),
          passwordHash,
          salt,
          history: [],
          createdAt: new Date().toISOString(),
          emailVerified: false,
          disabled: false,
        };
        users[key] = stored;
        writeUsers(users);
        writeSession(clean, edition);
        setAccount(buildAccount(stored));
        void syncAccount(stored);
        return { ok: true };
      },
      signIn: async ({ username, edition, password }) => {
        const nameErr = validateUsername(username);
        if (nameErr) return { ok: false, error: nameErr };
        if (!password) return { ok: false, error: "Enter your password." };

        const clean = username.trim().replace(/^\.+/, "");
        const key = userKey(clean, edition);
        const users = readUsers();
        const user = users[key];
        if (!user) {
          return { ok: false, error: "No account found. Create one first. Sign up takes less than a minute." };
        }

        const hash = await hashPassword(password, user.salt);
        if (hash !== user.passwordHash) {
          return { ok: false, error: "Incorrect password. Try again or create a new account." };
        }

        const profile = await getAccountProfile(clean, edition);
        if (profile.ok && profile.account) {
          user.emailVerified = profile.account.email_verified;
          user.disabled = profile.account.disabled;
          users[key] = user;
          writeUsers(users);
        }

        if (user.disabled) {
          return { ok: false, error: "This account is disabled. Contact support if this is a mistake." };
        }

        writeSession(clean, edition);
        setAccount(buildAccount(user));
        void syncAccount(user);
        return { ok: true };
      },
      signOut: () => {
        setAccount(null);
        localStorage.removeItem(SESSION_KEY);
      },
      recordPurchase: (purchase) => {
        const session = readSession();
        if (!session) return;

        const users = readUsers();
        const key = userKey(session.username, session.edition);
        const user = users[key];
        if (!user) return;

        const history = [purchase, ...user.history].slice(0, 25);
        users[key] = { ...user, history };
        writeUsers(users);
        setAccount(buildAccount(users[key]));
        void syncAccount(users[key]);
      },
      refreshVerification: async () => {
        const session = readSession();
        if (!session) return { ok: false, error: "Sign in first." };

        const users = readUsers();
        const key = userKey(session.username, session.edition);
        const user = users[key];
        if (!user) return { ok: false, error: "Account not found." };

        const profile = await getAccountProfile(user.username, user.edition);
        if (!profile.ok) return { ok: false, error: profile.error };
        if (!profile.account) return { ok: false, error: "Account is not in the admin registry yet." };

        users[key] = {
          ...user,
          emailVerified: profile.account.email_verified,
          disabled: profile.account.disabled,
        };
        writeUsers(users);
        setAccount(buildAccount(users[key]));
        return { ok: true };
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
