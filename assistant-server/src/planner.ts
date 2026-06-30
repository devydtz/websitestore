export type PlanKind =
  | "code question"
  | "database question"
  | "admin data question"
  | "deployment/build error"
  | "UI/design request"
  | "file search"
  | "ranks/keys/bundles scan"
  | "proposed edit"
  | "command request"
  | "explain_only";

export function classifyRequest(message: string): PlanKind {
  const text = message.toLowerCase();
  if (/\b(run|terminal|command|build|install|test)\b/.test(text)) return "command request";
  if (/\b(diff|edit|change|fix|update|create file|patch)\b/.test(text)) return "proposed edit";
  if (/\b(build|vite|cloudflare|deploy|dependency|npm|pnpm)\b/.test(text)) return "deployment/build error";
  if (/\b(sql|schema|table|supabase|database|rls)\b/.test(text)) return "database question";
  if (/\b(rank|key|bundle|crate|cosmetic)\b/.test(text)) return "ranks/keys/bundles scan";
  if (/\b(file|where|component|route|code)\b/.test(text)) return "file search";
  if (/\b(ui|design|mobile|button|page|layout)\b/.test(text)) return "UI/design request";
  if (/\b(request|order|admin|log)\b/.test(text)) return "admin data question";
  return "explain_only";
}
