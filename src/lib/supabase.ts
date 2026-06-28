import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const missingSupabaseConfigMessage =
  "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Cloudflare Pages.";

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
        "https://thkwtfflaydoqfokptnv.supabase.co",
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

function getSupabase() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return { ok: false as const, error: missingSupabaseConfigMessage };
  }

  const urls = getSupabaseUrls();
  return { ok: true as const, urls };
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
      lastError = `${url}: ${error.message}`;
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
      const profile = {
        username: account.username,
        edition: account.edition,
        email: account.email,
        display_name: account.displayName,
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
      if (error) lastError = `${url}: ${error.message}`;

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
      lastError = `${url}: ${insertRes.error.message}`;
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
      lastError = `${url}: ${error.message}`;
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
      lastError = `${url}: ${error.message}`;
    } catch (error) {
      lastError = networkError(error, [url]);
    }
  }

  return { ok: false, error: lastError || networkError("No Supabase URL responded", supabase.urls) };
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
      lastError = error ? `${url}: ${error.message}` : "Account not found.";
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
      lastError = `${url}: ${error.message}`;
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
      lastError = `${url}: ${error.message}`;
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
        lastError = `${url}: ${error.message}`;
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
        lastError = `${url}: ${error.message}`;
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
