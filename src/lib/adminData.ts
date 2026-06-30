import { supabaseClient } from "@/lib/supabaseClient";

export type AdminRole = "owner" | "admin" | "staff" | "viewer";
export type StoreTable = "ranks" | "crates" | "crate_keys" | "bundles" | "cosmetics";
export type RequestStatus = "pending" | "under_review" | "confirmed" | "rejected" | "completed" | "cancelled";

export type AdminProfile = {
  id: string;
  display_name: string | null;
  role: AdminRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminLog = {
  id: string;
  admin_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type RequestRow = {
  id: string;
  request_code: string;
  minecraft_username: string;
  customer_name: string | null;
  contact: string | null;
  item_type: "rank" | "crate" | "key" | "bundle" | "cosmetic" | "other";
  item_id: string | null;
  item_name: string;
  amount: number | null;
  payment_method: string | null;
  payment_reference: string | null;
  payment_screenshot_url: string | null;
  status: RequestStatus;
  admin_note: string | null;
  handled_by: string | null;
  handled_at: string | null;
  created_at: string;
  updated_at: string;
};

export type StoreAdminRow = {
  id?: string;
  name: string;
  slug: string;
  description?: string | null;
  price?: number | null;
  currency?: string | null;
  color?: string | null;
  icon?: string | null;
  perks?: unknown[];
  commands?: unknown[];
  rewards?: unknown[];
  items?: unknown[];
  compare_at_price?: number | null;
  category?: string | null;
  preview_url?: string | null;
  crate_id?: string | null;
  sort_order?: number | null;
  is_active?: boolean | null;
  created_at?: string;
  updated_at?: string;
};

export async function getCurrentAdminProfile() {
  const { data: userData, error: userError } = await supabaseClient.auth.getUser();
  if (userError || !userData.user) return { ok: false as const, error: userError?.message || "Not signed in." };
  const { data, error } = await supabaseClient.from("admin_profiles").select("*").eq("id", userData.user.id).maybeSingle();
  if (error) return { ok: false as const, error: error.message };
  if (!data) return { ok: false as const, error: "No admin profile found for this user." };
  return { ok: true as const, profile: data as AdminProfile };
}

export async function listAdminRows<T>(table: string, order = "created_at") {
  const { data, error } = await supabaseClient.from(table).select("*").order(order, { ascending: false });
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const, rows: (data ?? []) as T[] };
}

export async function saveAdminRow<T extends { id?: string }>(table: string, row: T) {
  const query = row.id
    ? supabaseClient.from(table).update(row).eq("id", row.id).select("*").maybeSingle()
    : supabaseClient.from(table).insert(row).select("*").maybeSingle();
  const { data, error } = await query;
  if (error) return { ok: false as const, error: error.message };
  await insertAdminLog(row.id ? `update_${table}` : `create_${table}`, table, String((data as { id?: string } | null)?.id ?? row.id ?? ""), { row });
  return { ok: true as const, row: data as T };
}

export async function deleteAdminRow(table: string, id: string) {
  const { error } = await supabaseClient.from(table).delete().eq("id", id);
  if (error) return { ok: false as const, error: error.message };
  await insertAdminLog(`delete_${table}`, table, id, {});
  return { ok: true as const };
}

export async function updateRequest(id: string, patch: Partial<RequestRow>, action = "update_request") {
  const finalPatch = ["confirmed", "rejected", "completed"].includes(String(patch.status))
    ? { ...patch, handled_at: new Date().toISOString() }
    : patch;
  const { data, error } = await supabaseClient.from("requests").update(finalPatch).eq("id", id).select("*").maybeSingle();
  if (error) return { ok: false as const, error: error.message };
  await insertAdminLog(action, "requests", id, finalPatch);
  return { ok: true as const, request: data as RequestRow };
}

export async function insertAdminLog(action: string, targetType?: string, targetId?: string, metadata: Record<string, unknown> = {}) {
  const { data } = await supabaseClient.auth.getUser();
  await supabaseClient.from("admin_logs").insert({
    admin_id: data.user?.id ?? null,
    action,
    target_type: targetType ?? null,
    target_id: targetId ?? null,
    metadata,
  });
}

export async function dashboardStats() {
  const [requests, ranks, crates, keys, bundles, cosmetics, admins, logs] = await Promise.all([
    listAdminRows<RequestRow>("requests"),
    listAdminRows<StoreAdminRow>("ranks"),
    listAdminRows<StoreAdminRow>("crates"),
    listAdminRows<StoreAdminRow>("crate_keys"),
    listAdminRows<StoreAdminRow>("bundles"),
    listAdminRows<StoreAdminRow>("cosmetics"),
    listAdminRows<AdminProfile>("admin_profiles"),
    listAdminRows<AdminLog>("admin_logs"),
  ]);

  const safe = <T>(res: { ok: true; rows: T[] } | { ok: false; error: string }) => (res.ok ? res.rows : []);
  const requestRows = safe(requests);
  return {
    requests: requestRows,
    ranks: safe(ranks),
    crates: safe(crates),
    keys: safe(keys),
    bundles: safe(bundles),
    cosmetics: safe(cosmetics),
    admins: safe(admins),
    logs: safe(logs),
  };
}
