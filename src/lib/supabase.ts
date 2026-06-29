import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const missingSupabaseConfigMessage =
  "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Cloudflare Pages.";

let browserClient: ReturnType<typeof createClient> | null = null;
const dataClients = new Map<string, ReturnType<typeof createClient>>();

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

async function postWithAbort(url: string, payload: unknown, label: string, ms = 10000) {
  const controller = new AbortController();
  const timer = globalThis.setTimeout(() => controller.abort(new Error(`${label} timed out after ${ms / 1000}s`)), ms);
  try {
    const response = await globalThis.fetch(`${url}/rest/v1/orders`, {
      method: "POST",
      headers: {
        apikey: supabaseAnonKey,
        authorization: `Bearer ${supabaseAnonKey}`,
        "content-type": "application/json",
        prefer: "return=minimal",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (response.ok) return { ok: true as const };

    const text = await response.text().catch(() => "");
    let message = text || `HTTP ${response.status}`;
    try {
      const parsed = JSON.parse(text) as { message?: string; details?: string; hint?: string; code?: string };
      message = parsed.message || parsed.details || parsed.hint || parsed.code || message;
    } catch {
      // Keep the raw response text when Supabase does not return JSON.
    }
    return { ok: false as const, error: message };
  } finally {
    globalThis.clearTimeout(timer);
  }
}

async function getJsonWithAbort<T>(url: string, path: string, label: string, ms = 7000) {
  const controller = new AbortController();
  const timer = globalThis.setTimeout(() => controller.abort(new Error(`${label} timed out after ${ms / 1000}s`)), ms);
  try {
    const response = await globalThis.fetch(`${url}/rest/v1/${path}`, {
      headers: {
        apikey: supabaseAnonKey,
        authorization: `Bearer ${supabaseAnonKey}`,
        accept: "application/json",
      },
      signal: controller.signal,
    });

    if (response.ok) return { ok: true as const, data: (await response.json()) as T };

    const text = await response.text().catch(() => "");
    let message = text || `HTTP ${response.status}`;
    try {
      const parsed = JSON.parse(text) as { message?: string; details?: string; hint?: string; code?: string };
      message = parsed.message || parsed.details || parsed.hint || parsed.code || message;
    } catch {
      // Keep the raw response text when Supabase does not return JSON.
    }
    return { ok: false as const, error: message };
  } finally {
    globalThis.clearTimeout(timer);
  }
}

function withTimeout<T>(promise: PromiseLike<T>, label: string, ms = 15000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = globalThis.setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms);
    Promise.resolve(promise).then(
      (value) => {
        globalThis.clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        globalThis.clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function databaseSetupError(table: string) {
  return `Database setup needed: missing '${table}' table. Open Supabase SQL Editor, paste SUPABASE-ADMIN-FIX.sql, run it, then refresh this page.`;
}

function formatSupabaseError(url: string, message: string) {
  if (/Could not find the table 'public\.(orders|accounts|deleted_accounts|promo_codes|store_products)'/i.test(message)) {
    const table = message.match(/public\.(orders|accounts|deleted_accounts|promo_codes|store_products)/i)?.[1] ?? "orders";
    return databaseSetupError(table);
  }
  if (/schema cache/i.test(message) && /orders|accounts|promo_codes|deleted_accounts|store_products/i.test(message)) {
    return "Database schema cache is stale or missing columns. Run SUPABASE-ADMIN-FIX.sql again, then refresh the site.";
  }
  if (/duplicate key value/i.test(message) && /orders_reference_no_key/i.test(message)) {
    return "That GCash reference number was already used on another order. Check the number or contact support.";
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

function getSupabaseDataClient(url: string) {
  const key = normalizeSupabaseUrl(url);
  const existing = dataClients.get(key);
  if (existing) return existing;

  const client = createClient(key, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
      storageKey: `lunaris-data-${key.replace(/[^a-z0-9]/gi, "-")}`,
    },
  });
  dataClients.set(key, client);
  return client;
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

export function safeOrderItems(items: unknown): OrderItem[] {
  if (!Array.isArray(items)) return [];
  return items.filter((item): item is OrderItem => {
    if (!item || typeof item !== "object") return false;
    const candidate = item as Partial<OrderItem>;
    return (
      typeof candidate.id === "string" &&
      typeof candidate.name === "string" &&
      typeof candidate.price === "string" &&
      typeof candidate.qty === "number"
    );
  });
}

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
  status_history: OrderStatusHistory[] | null;
  receipt_issued_at: string | null;
  delivered_at: string | null;
  delivery_log: { command: string; ok: boolean; response?: string }[] | null;
  created_at: string;
};

export type OrderStatusHistory = {
  status: OrderStatus | "submitted";
  label: string;
  at: string;
  note?: string;
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

export type PromoCodeRow = {
  code: string;
  label: string;
  description: string | null;
  kind: "percent" | "fixed";
  amount: number;
  min_subtotal_cents: number;
  active: boolean;
  max_uses: number | null;
  max_uses_per_user: number | null;
  used_count: number;
  expires_at: string | null;
  created_at: string;
};

export type StoreProductRow = {
  id: string;
  category: "rank" | "key" | "bundle";
  name: string;
  tagline: string;
  price_cents: number;
  price_display: string;
  perks: string[];
  active: boolean;
  coming_soon: boolean;
  featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export async function createOrder(order: NewOrder): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = getSupabase();
  if (!supabase.ok) return { ok: false, error: supabase.error };

  let lastError = "";
  for (const url of supabase.urls) {
    try {
      const now = new Date().toISOString();
      const baseInsert = {
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
      };
      const minimalInsert = {
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
        status: "pending",
      };
      const timelineInsert = {
        status_history: [
          {
            status: "submitted",
            label: "Order submitted",
            at: now,
          },
          {
            status: "pending",
            label: "Waiting for payment verification",
            at: now,
          },
        ],
          receipt_issued_at: now,
        };
      let insertRes = await postWithAbort(url, { ...baseInsert, ...timelineInsert }, "Submitting order");
      if (!insertRes.ok && /status_history|receipt_issued_at|schema cache|column/i.test(insertRes.error)) {
        insertRes = await postWithAbort(url, baseInsert, "Submitting order without receipt timeline");
        if (!insertRes.ok && /schema cache|column/i.test(insertRes.error)) {
          insertRes = await postWithAbort(url, minimalInsert, "Submitting order with older database schema");
        }
      }
      if (insertRes.ok) return { ok: true };
      lastError = formatSupabaseError(url, insertRes.error);
    } catch (error) {
      lastError = networkError(error, [url]);
    }
  }

  return { ok: false, error: lastError || networkError("No Supabase URL responded", supabase.urls) };
}

export async function listCustomerOrders(
  email: string,
): Promise<{ ok: true; orders: Order[] } | { ok: false; error: string }> {
  const supabase = getSupabase();
  if (!supabase.ok) return { ok: false, error: supabase.error };

  let lastError = "";
  for (const url of supabase.urls) {
    try {
      const client = getSupabaseDataClient(url);
      const { data, error } = await withTimeout(
        client
          .from("orders")
          .select("*")
          .eq("email", email)
          .order("created_at", { ascending: false }),
        "Loading customer orders",
      );
      if (!error) return { ok: true, orders: (data ?? []) as Order[] };
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
      const client = getSupabaseDataClient(url);
      const deleted = await withTimeout(
        client.from("deleted_accounts").select("id").eq("id", id).maybeSingle(),
        "Checking account status",
      );
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

      const { data, error } = await withTimeout(
        client
          .from("accounts")
          .update(profile)
          .eq("id", id)
          .select("*")
          .maybeSingle(),
        "Updating account profile",
      );
      if (!error && data) return { ok: true, account: data as StoreAccount };
      if (error) lastError = formatSupabaseError(url, error.message);

      const insertRes = await withTimeout(
        client
          .from("accounts")
          .insert({
            id,
            ...profile,
            email_verified: account.emailVerified,
            disabled: false,
          })
          .select("*")
          .maybeSingle(),
        "Creating account profile",
      );
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
      const client = getSupabaseDataClient(url);
      const { data, error } = await withTimeout(
        client.from("accounts").select("*").eq("id", id).maybeSingle(),
        "Loading account profile",
      );
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
      const client = getSupabaseDataClient(url);
      const { data, error } = await withTimeout(
        client
          .from("accounts")
          .select("*")
          .order("created_at", { ascending: false }),
        "Loading accounts",
      );
      if (!error) return { ok: true, accounts: (data ?? []) as StoreAccount[] };
      lastError = formatSupabaseError(url, error.message);
    } catch (error) {
      lastError = networkError(error, [url]);
    }
  }

  return { ok: false, error: lastError || networkError("No Supabase URL responded", supabase.urls) };
}

async function callAdminFunction<T>(
  body: Record<string, unknown>,
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  const supabase = getSupabase();
  if (!supabase.ok) return { ok: false, error: supabase.error };

  let lastError = "";
  for (const url of supabase.urls) {
    try {
      const response = await fetch(`${url}/functions/v1/admin-manage-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseAnonKey}`,
          Apikey: supabaseAnonKey,
        },
        body: JSON.stringify(body),
      });
      const payload = (await response.json().catch(() => null)) as (T & { error?: string }) | null;
      if (!response.ok) {
        lastError = payload?.error || `Admin function failed with HTTP ${response.status}`;
        continue;
      }
      return { ok: true, data: payload as T };
    } catch (error) {
      lastError = networkError(error, [`${url}/functions/v1/admin-manage-order`]);
    }
  }

  return { ok: false, error: lastError || "Admin function did not respond." };
}

export async function syncAccountsFromAuthUsers(
  adminToken: string,
): Promise<{ ok: true; synced: number } | { ok: false; error: string }> {
  if (adminToken !== "lunaris-admin-2024") return { ok: false, error: "Incorrect admin password." };
  const res = await callAdminFunction<{ synced: number }>({ action: "sync-accounts", adminToken });
  if (!res.ok) return res;
  return { ok: true, synced: Number(res.data.synced ?? 0) };
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
      const client = getSupabaseDataClient(url);
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
      const client = getSupabaseDataClient(url);
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
      const client = getSupabaseDataClient(url);
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

  const fullDelete = await callAdminFunction<{ deleted: boolean }>({
    action: "delete-account",
    orderId: id,
    adminToken,
  });
  if (fullDelete.ok) return { ok: true };

  let lastError = "";
  for (const url of supabase.urls) {
    try {
      const client = getSupabaseDataClient(url);
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
  const select = [
    "id",
    "username",
    "edition",
    "email",
    "items",
    "total_cents",
    "total_display",
    "method",
    "gcash_number",
    "gcash_name",
    "reference_no",
    "promo_code",
    "discount_cents",
    "discount_display",
    "subtotal_cents",
    "subtotal_display",
    "status",
    "admin_note",
    "status_history",
    "receipt_issued_at",
    "delivered_at",
    "delivery_log",
    "created_at",
  ].join(",");
  const path = `orders?select=${select}&id=eq.${encodeURIComponent(orderId)}&limit=1`;

  for (const url of supabase.urls) {
    try {
      const result = await getJsonWithAbort<Order[]>(url, path, "Loading order", 5000);
      if (result.ok) return { ok: true, order: result.data[0] ?? null };
      lastError = formatSupabaseError(url, result.error);
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
      const client = getSupabaseDataClient(url);
      const { data, error } = await withTimeout(
        client
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(200),
        "Loading admin orders",
        10000,
      );
      if (!error) return { ok: true, orders: (data ?? []) as Order[] };
      lastError = formatSupabaseError(url, error.message);
    } catch (error) {
      lastError = networkError(error, [url]);
    }
  }

  return { ok: false, error: lastError || networkError("No Supabase URL responded", supabase.urls) };
}

export async function listPromoCodes(): Promise<{ ok: true; promos: PromoCodeRow[] } | { ok: false; error: string }> {
  const supabase = getSupabase();
  if (!supabase.ok) return { ok: false, error: supabase.error };

  let lastError = "";
  for (const url of supabase.urls) {
    try {
      const client = getSupabaseDataClient(url);
      const { data, error } = await withTimeout(
        client
          .from("promo_codes")
          .select("*")
          .order("created_at", { ascending: false }),
        "Loading promo codes",
      );
      if (!error) return { ok: true, promos: (data ?? []) as PromoCodeRow[] };
      lastError = formatSupabaseError(url, error.message);
    } catch (error) {
      lastError = networkError(error, [url]);
    }
  }

  return { ok: false, error: lastError || networkError("No Supabase URL responded", supabase.urls) };
}

export async function getPromoCode(
  code: string,
): Promise<{ ok: true; promo: PromoCodeRow | null } | { ok: false; error: string }> {
  const supabase = getSupabase();
  if (!supabase.ok) return { ok: false, error: supabase.error };

  let lastError = "";
  for (const url of supabase.urls) {
    try {
      const client = getSupabaseDataClient(url);
      const { data, error } = await withTimeout(
        client
          .from("promo_codes")
          .select("*")
          .eq("code", code.trim().toUpperCase())
          .eq("active", true)
          .maybeSingle(),
        "Checking promo code",
        8000,
      );
      if (!error) return { ok: true, promo: data as PromoCodeRow | null };
      lastError = formatSupabaseError(url, error.message);
    } catch (error) {
      lastError = networkError(error, [url]);
    }
  }

  return { ok: false, error: lastError || networkError("No Supabase URL responded", supabase.urls) };
}

export async function savePromoCode(
  promo: Omit<PromoCodeRow, "created_at" | "used_count"> & { used_count?: number },
  adminToken: string,
): Promise<{ ok: true; promo: PromoCodeRow } | { ok: false; error: string }> {
  const supabase = getSupabase();
  if (!supabase.ok) return { ok: false, error: supabase.error };
  if (adminToken !== "lunaris-admin-2024") return { ok: false, error: "Incorrect admin password." };

  let lastError = "";
  for (const url of supabase.urls) {
    try {
      const client = getSupabaseDataClient(url);
      const { data, error } = await client
        .from("promo_codes")
        .upsert(
          {
            ...promo,
            code: promo.code.trim().toUpperCase(),
            label: promo.label.trim(),
            description: promo.description?.trim() || null,
            max_uses_per_user: promo.max_uses_per_user ?? null,
            used_count: promo.used_count ?? 0,
          },
          { onConflict: "code" },
        )
        .select("*")
        .maybeSingle();
      if (!error && data) return { ok: true, promo: data as PromoCodeRow };
      lastError = error ? formatSupabaseError(url, error.message) : "Promo code was not saved.";
    } catch (error) {
      lastError = networkError(error, [url]);
    }
  }

  return { ok: false, error: lastError || networkError("No Supabase URL responded", supabase.urls) };
}

export async function deletePromoCode(
  code: string,
  adminToken: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = getSupabase();
  if (!supabase.ok) return { ok: false, error: supabase.error };
  if (adminToken !== "lunaris-admin-2024") return { ok: false, error: "Incorrect admin password." };

  let lastError = "";
  for (const url of supabase.urls) {
    try {
      const client = getSupabaseDataClient(url);
      const { error } = await client.from("promo_codes").delete().eq("code", code.trim().toUpperCase());
      if (!error) return { ok: true };
      lastError = formatSupabaseError(url, error.message);
    } catch (error) {
      lastError = networkError(error, [url]);
    }
  }

  return { ok: false, error: lastError || networkError("No Supabase URL responded", supabase.urls) };
}

export async function listStoreProducts(): Promise<
  { ok: true; products: StoreProductRow[] } | { ok: false; error: string }
> {
  const supabase = getSupabase();
  if (!supabase.ok) return { ok: false, error: supabase.error };

  let lastError = "";
  for (const url of supabase.urls) {
    try {
      const client = getSupabaseDataClient(url);
      const { data, error } = await withTimeout(
        client
          .from("store_products")
          .select("*")
          .order("category", { ascending: true })
          .order("sort_order", { ascending: true }),
        "Loading store products",
        10000,
      );
      if (!error) return { ok: true, products: (data ?? []) as StoreProductRow[] };
      lastError = formatSupabaseError(url, error.message);
    } catch (error) {
      lastError = networkError(error, [url]);
    }
  }

  return { ok: false, error: lastError || networkError("No Supabase URL responded", supabase.urls) };
}

export async function saveStoreProduct(
  product: Omit<StoreProductRow, "created_at" | "updated_at">,
  adminToken: string,
): Promise<{ ok: true; product: StoreProductRow } | { ok: false; error: string }> {
  const supabase = getSupabase();
  if (!supabase.ok) return { ok: false, error: supabase.error };
  if (adminToken !== "lunaris-admin-2024") return { ok: false, error: "Incorrect admin password." };

  let lastError = "";
  for (const url of supabase.urls) {
    try {
      const client = getSupabaseDataClient(url);
      const { data, error } = await client
        .from("store_products")
        .upsert(
          {
            ...product,
            id: product.id.trim().toLowerCase(),
            name: product.name.trim(),
            tagline: product.tagline.trim(),
            perks: Array.isArray(product.perks) ? product.perks : [],
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" },
        )
        .select("*")
        .maybeSingle();
      if (!error && data) return { ok: true, product: data as StoreProductRow };
      lastError = error ? formatSupabaseError(url, error.message) : "Product was not saved.";
    } catch (error) {
      lastError = networkError(error, [url]);
    }
  }

  return { ok: false, error: lastError || networkError("No Supabase URL responded", supabase.urls) };
}

export async function deleteStoreProduct(
  id: string,
  adminToken: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = getSupabase();
  if (!supabase.ok) return { ok: false, error: supabase.error };
  if (adminToken !== "lunaris-admin-2024") return { ok: false, error: "Incorrect admin password." };

  let lastError = "";
  for (const url of supabase.urls) {
    try {
      const client = getSupabaseDataClient(url);
      const { error } = await client.from("store_products").delete().eq("id", id.trim().toLowerCase());
      if (!error) return { ok: true };
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
      const client = getSupabaseDataClient(url);
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

  let functionError = "";
  for (const url of supabase.urls) {
    try {
      const response = await fetch(`${url}/functions/v1/admin-manage-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseAnonKey}`,
          Apikey: supabaseAnonKey,
        },
        body: JSON.stringify({ orderId, action, adminToken, note }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { order?: Order; error?: string; delivery?: { allOk: boolean; log: { ok: boolean; response?: string }[] } }
        | null;

      if (!response.ok) {
        functionError = payload?.error || `Delivery function failed with HTTP ${response.status}`;
        continue;
      }
      if (!payload?.order) {
        functionError = "Delivery function returned no order.";
        continue;
      }

      return { ok: true, order: payload.order };
    } catch (error) {
      functionError = networkError(error, [`${url}/functions/v1/admin-manage-order`]);
    }
  }

  if (action === "confirm") {
    return {
      ok: false,
      error:
        functionError ||
        "Could not reach the Minecraft delivery function. Check Supabase function secrets and deploy admin-manage-order.",
    };
  }

  const update =
    action === "reject"
      ? {
          status: "rejected" as const,
          admin_note: note ?? null,
          status_history: [
            {
              status: "rejected",
              label: "Order rejected",
              at: new Date().toISOString(),
              note,
            },
          ],
        }
      : {
          status: "confirmed" as const,
          admin_note: note ?? null,
          status_history: [
            {
              status: "confirmed",
              label: "Payment confirmed",
              at: new Date().toISOString(),
              note,
            },
          ],
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
      const client = getSupabaseDataClient(url);
      const existing = await client.from("orders").select("status_history").eq("id", orderId).maybeSingle();
      const nextHistory = [
        ...(((existing.data as { status_history?: OrderStatusHistory[] } | null)?.status_history ?? []) as OrderStatusHistory[]),
        ...update.status_history,
      ];
      const updateWithHistory = await client
        .from("orders")
        .update({ ...update, status_history: nextHistory })
        .eq("id", orderId)
        .eq("status", "pending")
        .select("*")
        .maybeSingle();
      let { data, error } = updateWithHistory;

      if (error && /status_history|schema cache|column/i.test(error.message)) {
        const oldSchemaUpdate =
          action === "reject"
            ? { status: update.status, admin_note: update.admin_note }
            : { status: update.status, admin_note: update.admin_note, delivery_log: update.delivery_log };
        const fallback = await client
          .from("orders")
          .update(oldSchemaUpdate)
          .eq("id", orderId)
          .eq("status", "pending")
          .select("*")
          .maybeSingle();
        data = fallback.data;
        error = fallback.error;
      }

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
