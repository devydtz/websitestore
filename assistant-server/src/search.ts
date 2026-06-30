import { supabaseAdmin } from "./supabaseAdmin.js";

export async function searchProject(query: string, limit = 12) {
  if (!supabaseAdmin) throw new Error("Supabase service role is not configured.");
  const { data, error } = await supabaseAdmin
    .from("assistant_project_chunks")
    .select("path, chunk_index, content")
    .textSearch("search_text", query, { type: "websearch" })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function searchData(query: string) {
  if (!supabaseAdmin) throw new Error("Supabase service role is not configured.");
  const like = `%${query}%`;
  const [requests, ranks, keys, bundles] = await Promise.all([
    supabaseAdmin.from("requests").select("*").or(`minecraft_username.ilike.${like},request_code.ilike.${like},item_name.ilike.${like}`).limit(20),
    supabaseAdmin.from("ranks").select("*").or(`name.ilike.${like},slug.ilike.${like}`).limit(20),
    supabaseAdmin.from("crate_keys").select("*").or(`name.ilike.${like},slug.ilike.${like}`).limit(20),
    supabaseAdmin.from("bundles").select("*").or(`name.ilike.${like},slug.ilike.${like}`).limit(20),
  ]);
  return { requests: requests.data ?? [], ranks: ranks.data ?? [], keys: keys.data ?? [], bundles: bundles.data ?? [] };
}
