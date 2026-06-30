export type LunarisIntent =
  | "greeting"
  | "capabilities"
  | "system_overview"
  | "coding_knowledge"
  | "minecraft_knowledge"
  | "minecraft_server_status"
  | "minecraft_command"
  | "security_knowledge"
  | "knowledge_question"
  | "data_analysis"
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
  if (/^(hi|hello|hey|yo|sup|wassup|good morning|good afternoon|good evening)\b/.test(text.trim())) return "greeting";
  if (/\b(what can you do|help me|help|capabilities|commands|what do you know|who are you)\b/.test(text)) return "capabilities";
  if (/\b(all knowledge|everything|world knowledge|nothing is impossible|know everything)\b/.test(text)) return "knowledge_question";
  if (/\b(analy[sz]e|analysis|report|metrics|duplicate|anomaly|trend|summary|revenue|breakdown|missing values|data)\b/.test(text)) return "data_analysis";
  if (/\b(explain the project|explain this site|whole system|architecture|how does this work|know everything|overview)\b/.test(text)) return "system_overview";
  if (/\b(run|execute|send)\s+(minecraft\s+|server\s+|rcon\s+)?command\s*[:\-]/i.test(message) || /^\/[a-z0-9_:-]+/i.test(message.trim())) return "minecraft_command";
  if (/\b(players?\s+online|online\s+players?|how many players|server status|is the server online|server online|motd|minecraft status|who is online|player count)\b/.test(text)) return "minecraft_server_status";
  if (/\b(minecraft|paper|purpur|spigot|bukkit|plugin|luckperms|permission|rcon|geyser|floodgate|bedrock|java edition|crate|rank command|server)\b/.test(text)) return "minecraft_knowledge";
  if (/\b(coding|programming|debug|algorithm|typescript|javascript|react|vite|frontend|backend|api|function|component)\b/.test(text)) return "coding_knowledge";
  if (/\b(security|secret|token|password|api key|service role|rcon password|private)\b/.test(text)) return "security_knowledge";
  if (/\b(time|clock|what time)\b/.test(text)) return "current_time";
  if (/\b(date|today|tomorrow|yesterday|day of week)\b/.test(text)) return "current_date";
  if (/^[\d\s+\-*/().,%]+$/.test(text) || /\b(calculate|percent|percentage|total|minus|plus)\b/.test(text)) return "calculator";
  if (/\b(research|latest|current|search web|search for|look up|internet|find online|website)\b/.test(text)) return "web_research";
  if (/\b(route|url|page|where is)\b/.test(text)) return "route_search";
  if (/\b(config|vite|cloudflare|wrangler|package|env)\b/.test(text)) return "config_search";
  if (/\b(build failed|build error|npm|pnpm|vite error|typescript)\b/.test(text)) return "build_error";
  if (/\b(deploy|deployment|cloudflare|pages)\b/.test(text)) return "deployment_error";
  if (/\b(database|supabase|sql|table|schema|rls)\b/.test(text)) return "database_question";
  if (/\b(order|orders|account|player|promo|admin|logs|delivery)\b/.test(text)) return "admin_data_question";
  if (/\b(file|component|function|code|source|frontend|backend)\b/.test(text)) return "file_search";
  if (/\b(rank|ranks|key|keys|bundle|bundles|crate|crates|cosmetic)\b/.test(text)) return "website_project_question";
  if (text.trim()) return "general_question";
  return "unknown";
}
