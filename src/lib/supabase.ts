import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const missingSupabaseConfigMessage =
  "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Cloudflare Pages.";

let browserClient: ReturnType<typeof createClient> | null = null;

function normalizeSupabaseUrl(url: string) {
  return url
    .trim()
    .replace(/\/rest\/v1\/?$/, "")
    .replace(/\/$/, "");
}

function getSupabaseUrls() {
  return Array.from(
    new Set(
      [
        supabaseUrl,
        "https://thkwftflaydoqfokptnv.supabase.co",
      ]
        .filter(Boolean)
        .map(normalizeSupabaseUrl),
    ),
  );
}

function networkError(error: unknown, urls: string[]) {
  const message = error instanceof Error ? error.message : String(error);
  return `Could not reach Supabase (${message}). Tried: ${urls.join(", ")}. Check VITE_SUPABASE_URL and redeploy Cloudflare.`;
}

function databaseSetupError(table: string) {
  return `Database setup needed: missing '${table}' table. Open Supabase SQL Editor, paste SUPABASE-ADMIN-FIX.sql, run it, then refresh this page.`;
}

function formatSupabaseError(url: string, message: string) {
  if (/Could not find the table 'public\.(orders|accounts|deleted_accounts)'/i.test(message)) {
    const table = message.match(/public\.(orders|accounts|deleted_accounts)/i)?.[1] ?? "orders";
    return databaseSetupError(table);
  }
  return `${url}: ${message}`;
}

function getSupabase() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return { ok: false as const, error: missingSupabaseConfigMessage };
  }

  const urls = getSupabaseUrls();
  return { ok: true as const, urls };
}

export function getSupabaseBrowserClient() {
  const supabase = getSupabase();
  if (!supabase.ok) return { ok: false as const, error: supabase.error };

  if (!browserClient) {
    browserClient = createClient(supabase.urls[0], supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
      },
    });
  }

  return { ok: true as const, client: browserClient };
}

export type OrderStatus = "pending" | "confirmed" | "rejected" | "delivered";

export type StoreAccount = {
  id: string;
  username: string;
  edition: "java" | "bedrock";
  email: string;
  display_name: string;
  email_verified: boolean;
  disabled: boolean;
  history_count: number;
  total_spent_cents: number;
  total_spent_display: string;
  created_at: string;
  last_seen_at: string;
};

export type OrderItem = {
  id: string;
  name: string;
  price: string;
  qty: number;
};

export type Order = {
  id: string;
  username: string;
  edition: "java" | "bedrock";
  email: string;
  items: OrderItem[];
  total_cents: number;
  total_display: string;
  method: string;
  gcash_number: string | null;
  gcash_name: string | null;
  reference_no: string | null;
  promo_code: string | null;
  discount_cents: number | null;
  discount_display: string | null;
  subtotal_cents: number | null;
  subtotal_display: string | null;
  status: OrderStatus;
  admin_note: string | null;
  delivered_at: string | null;
  delivery_log: { command: string; ok: boolean; response?: string }[] | null;
  created_at: string;
};

export type NewOrder = {
  id: string;
  username: string;
  edition: "java" | "bedrock";
  email: string;
  items: OrderItem[];
  total_cents: number;
  total_display: string;
  method: string;
  gcash_number: string;
  reference_no: string;
  promo_code: string | null;
  discount_cents: number;
  discount_display: string;
  subtotal_cents: number;
  subtotal_display: string;
};

export async function createOrder(order: NewOrder): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = getSupabase();
  if (!supabase.ok) return { ok: false, error: supabase.error };

  let lastError = "";
  for (const url of supabase.urls) {
    try {
      const client = createClient(url, supabaseAnonKey);
      const { error } = await client.from("orders").insert({
        id: order.id,
        username: order.username,
        edition: order.edition,
        email: order.email,
        items: order.items,
        total_cents: order.total_cents,
        total_display: order.total_display,
        method: order.method,
        gcash_number: order.gcash_number,
        gcash_name: null,
        reference_no: order.reference_no,
        promo_code: order.promo_code,
        discount_cents: order.discount_cents,
        discount_display: order.discount_display,
        subtotal_cents: order.subtotal_cents,
        subtotal_display: order.subtotal_display,
        status: "pending",
      });
      if (!error) return { ok: true };
      lastError = formatSupabaseError(url, error.message);
    } catch (error) {
      lastError = networkError(error, [url]);
    }
  }

  return { ok: false, error: lastError || networkError("No Supabase URL responded", supabase.urls) };
}

export async function upsertAccountProfile(account: {
  username: string;
  edition: "java" | "bedrock";
  email: string;
  displayName: string;
  emailVerified: boolean;
  historyCount: number;
  totalSpentCents: number;
  totalSpentDisplay: string;
}): Promise<{ ok: true; account: StoreAccount | null } | { ok: false; error: string }> {
  const supabase = getSupabase();
  if (!supabase.ok) return { ok: false, error: supabase.error };

  const id = `${account.edition}:${account.username.toLowerCase()}`;
  let lastError = "";
  for (const url of supabase.urls) {
    try {
      const client = createClient(url, supabaseAnonKey);
      const deleted = await client.from("deleted_accounts").select("id").eq("id", id).maybeSingle();
      if (!deleted.error && deleted.data) return { ok: true, account: null };

      const profile = {
        username: account.username,
        edition: account.edition,
        email: account.email,
        display_name: account.displayName,
        ...(account.emailVerified ? { email_verified: true } : {}),
        history_count: account.historyCount,
        total_spent_cents: account.totalSpentCents,
        total_spent_display: account.totalSpentDisplay,
        last_seen_at: new Date().toISOString(),
      };

      const { data, error } = await client
        .from("accounts")
        .update(profile)
        .eq("id", id)
        .select("*")
        .maybeSingle();
      if (!error && data) return { ok: true, account: data as StoreAccount };
      if (error) lastError = formatSupabaseError(url, error.message);

      const insertRes = await client
        .from("accounts")
        .insert({
          id,
          ...profile,
          email_verified: account.emailVerified,
          disabled: false,
        })
        .select("*")
        .maybeSingle();
      if (!insertRes.error) return { ok: true, account: insertRes.data as StoreAccount | null };
      lastError = formatSupabaseError(url, insertRes.error.message);
    } catch (error) {
      lastError = networkError(error, [url]);
    }
  }

  return { ok: false, error: lastError || networkError("No Supabase URL responded", supabase.urls) };
}

export async function getAccountProfile(
  username: string,
  edition: "java" | "bedrock",
): Promise<{ ok: true; account: StoreAccount | null } | { ok: false; error: string }> {
  const supabase = getSupabase();
  if (!supabase.ok) return { ok: false, error: supabase.error };

  const id = `${edition}:${username.toLowerCase()}`;
  let lastError = "";
  for (const url of supabase.urls) {
    try {
      const client = createClient(url, supabaseAnonKey);
      const { data, error } = await client.from("accounts").select("*").eq("id", id).maybeSingle();
      if (!error) return { ok: true, account: data as StoreAccount | null };
      lastError = formatSupabaseError(url, error.message);
    } catch (error) {
      lastError = networkError(error, [url]);
    }
  }

  return { ok: false, error: lastError || networkError("No Supabase URL responded", supabase.urls) };
}

export async function listAccounts(): Promise<{ ok: true; accounts: StoreAccount[] } | { ok: false; error: string }> {
  const supabase = getSupabase();
  if (!supabase.ok) return { ok: false, error: supabase.error };

  let lastError = "";
  for (const url of supabase.urls) {
    try {
      const client = createClient(url, supabaseAnonKey);
      const { data, error } = await client
        .from("accounts")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error) return { ok: true, accounts: (data ?? []) as StoreAccount[] };
      lastError = formatSupabaseError(url, error.message);
    } catch (error) {
      lastError = networkError(error, [url]);
    }
  }

  return { ok: false, error: lastError || networkError("No Supabase URL responded", supabase.urls) };
}

function formatPhp(cents: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

function accountId(username: string, edition: "java" | "bedrock") {
  return `${edition}:${username.trim().replace(/^\.+/, "").toLowerCase()}`;
}

function displayName(username: string, edition: "java" | "bedrock") {
  const clean = username.trim().replace(/^\.+/, "");
  return edition === "bedrock" ? `.${clean}` : clean;
}

async function listDeletedAccountIds(): Promise<{ ok: true; ids: Set<string> } | { ok: false; error: string }> {
  const supabase = getSupabase();
  if (!supabase.ok) return { ok: false, error: supabase.error };

  let lastError = "";
  for (const url of supabase.urls) {
    try {
      const client = createClient(url, supabaseAnonKey);
      const { data, error } = await client.from("deleted_accounts").select("id");
      if (!error) return { ok: true, ids: new Set((data ?? []).map((row) => row.id as string)) };
      lastError = formatSupabaseError(url, error.message);
    } catch (error) {
      lastError = networkError(error, [url]);
    }
  }

  return { ok: false, error: lastError || networkError("No Supabase URL responded", supabase.urls) };
}

export async function syncAccountsFromOrders(
  orders: Order[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  const deleted = await listDeletedAccountIds();
  if (!deleted.ok) return deleted;

  const grouped = new Map<
    string,
    {
      username: string;
      edition: "java" | "bedrock";
      email: string;
      total: number;
      count: number;
    }
  >();

  for (const order of orders) {
    const id = accountId(order.username, order.edition);
    if (deleted.ids.has(id)) continue;

    const current = grouped.get(id);
    if (current) {
      current.total += order.total_cents || 0;
      current.count += 1;
    } else {
      grouped.set(id, {
        username: order.username.trim().replace(/^\.+/, ""),
        edition: order.edition,
        email: order.email,
        total: order.total_cents || 0,
        count: 1,
      });
    }
  }

  for (const account of grouped.values()) {
    const res = await upsertAccountProfile({
      username: account.username,
      edition: account.edition,
      email: account.email,
      displayName: displayName(account.username, account.edition),
      emailVerified: false,
      historyCount: account.count,
      totalSpentCents: account.total,
      totalSpentDisplay: formatPhp(account.total),
    });
    if (!res.ok) return res;
  }

  return { ok: true };
}

export async function setAccountFlags(
  id: string,
  adminToken: string,
  flags: { email_verified?: boolean; disabled?: boolean },
): Promise<{ ok: true; account: StoreAccount } | { ok: false; error: string }> {
  const supabase = getSupabase();
  if (!supabase.ok) return { ok: false, error: supabase.error };

  if (adminToken !== "lunaris-admin-2024") {
    return { ok: false, error: "Incorrect admin password." };
  }

  let lastError = "";
  for (const url of supabase.urls) {
    try {
      const client = createClient(url, supabaseAnonKey);
      const { data, error } = await client.from("accounts").update(flags).eq("id", id).select("*").maybeSingle();
      if (!error && data) return { ok: true, account: data as StoreAccount };
      lastError = error ? formatSupabaseError(url, error.message) : "Account not found.";
    } catch (error) {
      lastError = networkError(error, [url]);
    }
  }

  return { ok: false, error: lastError || networkError("No Supabase URL responded", supabase.urls) };
}

export async function createAdminAccount(
  account: {
    username: string;
    edition: "java" | "bedrock";
    email: string;
    emailVerified: boolean;
  },
  adminToken: string,
): Promise<{ ok: true; account: StoreAccount } | { ok: false; error: string }> {
  const supabase = getSupabase();
  if (!supabase.ok) return { ok: false, error: supabase.error };

  if (adminToken !== "lunaris-admin-2024") {
    return { ok: false, error: "Incorrect admin password." };
  }

  const clean = account.username.trim().replace(/^\.+/, "");
  if (!clean) return { ok: false, error: "Enter a Minecraft username." };
  if (!/^\S+@\S+\.\S+$/.test(account.email.trim())) {
    return { ok: false, error: "Enter a valid email address." };
  }

  const id = accountId(clean, account.edition);
  let lastError = "";
  for (const url of supabase.urls) {
    try {
      const client = createClient(url, supabaseAnonKey);
      const deleted = await client.from("deleted_accounts").delete().eq("id", id);
      if (deleted.error) {
        lastError = formatSupabaseError(url, deleted.error.message);
        continue;
      }

      const { data, error } = await client
        .from("accounts")
        .upsert(
          {
            id,
            username: clean,
            edition: account.edition,
            email: account.email.trim(),
            display_name: displayName(clean, account.edition),
            email_verified: account.emailVerified,
            disabled: false,
            history_count: 0,
            total_spent_cents: 0,
            total_spent_display: formatPhp(0),
            last_seen_at: new Date().toISOString(),
          },
          { onConflict: "id" },
        )
        .select("*")
        .maybeSingle();
      if (!error && data) return { ok: true, account: data as StoreAccount };
      lastError = error ? formatSupabaseError(url, error.message) : "Account was not created.";
    } catch (error) {
      lastError = networkError(error, [url]);
    }
  }

  return { ok: false, error: lastError || networkError("No Supabase URL responded", supabase.urls) };
}

export async function deleteAccount(
  id: string,
  adminToken: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = getSupabase();
  if (!supabase.ok) return { ok: false, error: supabase.error };

  if (adminToken !== "lunaris-admin-2024") {
    return { ok: false, error: "Incorrect admin password." };
  }

  let lastError = "";
  for (const url of supabase.urls) {
    try {
      const client = createClient(url, supabaseAnonKey);
      const tombstone = await client.from("deleted_accounts").upsert({ id, deleted_at: new Date().toISOString() });
      if (tombstone.error) {
        lastError = formatSupabaseError(url, tombstone.error.message);
        continue;
      }
      const { error } = await client.from("accounts").delete().eq("id", id);
      if (!error) return { ok: true };
      lastError = formatSupabaseError(url, error.message);
    } catch (error) {
      lastError = networkError(error, [url]);
    }
  }

  return { ok: false, error: lastError || networkError("No Supabase URL responded", supabase.urls) };
}

export async function getOrder(orderId: string): Promise<{ ok: true; order: Order | null } | { ok: false; error: string }> {
  const supabase = getSupabase();
  if (!supabase.ok) return { ok: false, error: supabase.error };

  let lastError = "";
  for (const url of supabase.urls) {
    try {
      const client = createClient(url, supabaseAnonKey);
      const { data, error } = await client.from("orders").select("*").eq("id", orderId).maybeSingle();
      if (!error) return { ok: true, order: data as Order | null };
      lastError = formatSupabaseError(url, error.message);
    } catch (error) {
      lastError = networkError(error, [url]);
    }
  }

  return { ok: false, error: lastError || networkError("No Supabase URL responded", supabase.urls) };
}

export async function listOrders(): Promise<{ ok: true; orders: Order[] } | { ok: false; error: string }> {
  const supabase = getSupabase();
  if (!supabase.ok) return { ok: false, error: supabase.error };

  let lastError = "";
  for (const url of supabase.urls) {
    try {
      const client = createClient(url, supabaseAnonKey);
      const { data, error } = await client
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error) return { ok: true, orders: (data ?? []) as Order[] };
      lastError = formatSupabaseError(url, error.message);
    } catch (error) {
      lastError = networkError(error, [url]);
    }
  }

  return { ok: false, error: lastError || networkError("No Supabase URL responded", supabase.urls) };
}

export type AdminAction = "confirm" | "reject";

export async function saveAdminNote(
  orderId: string,
  adminToken: string,
  note: string,
): Promise<{ ok: true; order: Order } | { ok: false; error: string }> {
  const supabase = getSupabase();
  if (!supabase.ok) return { ok: false, error: supabase.error };

  if (adminToken !== "lunaris-admin-2024") {
    return { ok: false, error: "Incorrect admin password." };
  }

  let lastError = "";
  for (const url of supabase.urls) {
    try {
      const client = createClient(url, supabaseAnonKey);
      const { data, error } = await client
        .from("orders")
        .update({ admin_note: note.trim() || null })
        .eq("id", orderId)
        .select("*")
        .maybeSingle();

      if (error) {
        lastError = formatSupabaseError(url, error.message);
        continue;
      }
      if (!data) {
        lastError = "Order not found. Refresh the admin panel.";
        continue;
      }

      return { ok: true, order: data as Order };
    } catch (error) {
      lastError = networkError(error, [url]);
    }
  }

  return { ok: false, error: lastError || networkError("No Supabase URL responded", supabase.urls) };
}

export async function adminAction(
  orderId: string,
  action: AdminAction,
  adminToken: string,
  note?: string,
): Promise<{ ok: true; order: Order } | { ok: false; error: string }> {
  const supabase = getSupabase();
  if (!supabase.ok) return { ok: false, error: supabase.error };

  if (adminToken !== "lunaris-admin-2024") {
    return { ok: false, error: "Incorrect admin password." };
  }

  const update =
    action === "reject"
      ? {
          status: "rejected" as const,
          admin_note: note ?? null,
        }
      : {
          status: "confirmed" as const,
          admin_note: note ?? null,
          delivery_log: [
            {
              command: "Manual delivery required",
              ok: false,
              response:
                "Payment confirmed. Deliver the purchased items in-game manually or connect delivery automation.",
            },
          ],
        };

  let lastError = "";
  for (const url of supabase.urls) {
    try {
      const client = createClient(url, supabaseAnonKey);
      const { data, error } = await client
        .from("orders")
        .update(update)
        .eq("id", orderId)
        .eq("status", "pending")
        .select("*")
        .maybeSingle();

      if (error) {
        lastError = formatSupabaseError(url, error.message);
        continue;
      }
      if (!data) {
        lastError = "Order not found or already processed. Refresh the admin panel.";
        continue;
      }

      return { ok: true, order: data as Order };
    } catch (error) {
      lastError = networkError(error, [url]);
    }
  }

  return { ok: false, error: lastError || networkError("No Supabase URL responded", supabase.urls) };
}
