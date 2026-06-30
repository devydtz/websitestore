import { supabaseAdmin } from "./supabaseAdmin.js";

export async function storeMessage(conversationId: string, role: "user" | "assistant" | "system" | "tool", content: string, metadata = {}) {
  if (!supabaseAdmin) return;
  await supabaseAdmin.from("assistant_messages").insert({ conversation_id: conversationId, role, content, metadata });
  await supabaseAdmin.from("assistant_conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);
}

export async function ensureConversation(adminId: string, conversationId?: string) {
  if (!supabaseAdmin) throw new Error("Supabase service role is not configured.");
  if (conversationId) return conversationId;
  const { data, error } = await supabaseAdmin
    .from("assistant_conversations")
    .insert({ admin_id: adminId, title: "New assistant chat" })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}
