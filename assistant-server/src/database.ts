import { supabaseAdmin } from "./supabaseAdmin.js";

export const scanTables = ["ranks", "crates", "crate_keys", "bundles", "cosmetics", "requests", "admin_profiles", "admin_logs"] as const;

export async function scanTable(table: (typeof scanTables)[number], limit = 50) {
  if (!supabaseAdmin) throw new Error("Supabase service role is not configured.");
  const { data, error } = await supabaseAdmin.from(table).select("*").limit(limit).order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function analyzeDatabase() {
  const results: Record<string, unknown[]> = {};
  for (const table of scanTables) {
    results[table] = await scanTable(table, 10);
  }
  return results;
}
