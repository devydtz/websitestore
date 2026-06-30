export type LunarisIntent =
  | "website_project_question"
  | "code_question"
  | "database_question"
  | "admin_data_question"
  | "file_search"
  | "route_search"
  | "config_search"
  | "build_error"
  | "deployment_error"
  | "current_time"
  | "current_date"
  | "calculator"
  | "general_question"
  | "web_research"
  | "unknown";

export function detectIntent(message: string): LunarisIntent {
  const text = message.toLowerCase();
  if (/\b(time|clock|what time)\b/.test(text)) return "current_time";
  if (/\b(date|today|tomorrow|yesterday|day of week)\b/.test(text)) return "current_date";
  if (/^[\d\s+\-*/().,%]+$/.test(text) || /\b(calculate|percent|percentage|total|minus|plus)\b/.test(text)) return "calculator";
  if (/\b(research|latest|search web|look up|internet)\b/.test(text)) return "web_research";
  if (/\b(route|url|page|where is)\b/.test(text)) return "route_search";
  if (/\b(config|vite|cloudflare|wrangler|package|env)\b/.test(text)) return "config_search";
  if (/\b(build failed|build error|npm|pnpm|vite error|typescript)\b/.test(text)) return "build_error";
  if (/\b(deploy|deployment|cloudflare|pages)\b/.test(text)) return "deployment_error";
  if (/\b(database|supabase|sql|table|schema|rls)\b/.test(text)) return "database_question";
  if (/\b(order|orders|account|player|promo|admin|logs|delivery)\b/.test(text)) return "admin_data_question";
  if (/\b(file|component|function|code|source)\b/.test(text)) return "file_search";
  if (/\b(rank|ranks|key|keys|bundle|bundles|crate|crates|cosmetic)\b/.test(text)) return "website_project_question";
  if (text.trim()) return "general_question";
  return "unknown";
}
