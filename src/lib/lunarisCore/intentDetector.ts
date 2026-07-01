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
  | "file_generation"
  | "image_generation"
  | "file_analysis"
  | "image_analysis"
  | "core_power_tool"
  | "core_health"
  | "order_investigator"
  | "player_investigator"
  | "connections"
  | "memory_preference"
  | "casual_chat"
  | "general_question"
  | "web_research"
  | "unknown";

export function detectIntent(message: string): LunarisIntent {
  const text = message.toLowerCase();
  const clean = text.trim();
  const isDefinitionQuestion =
    /\b(meaning of|definition of|define)\b/.test(text) ||
    /\bwhat does\b.+\bmean\b/.test(text) ||
    /\bwhat is meaning of\b/.test(text);
  if (/^(hi+|hii+|hello+|helo+|hey+|yo+|sup+|wassup+|wsp+|wsup+|gm+|gn|good morning|good afternoon|good evening)[\s!.?]*$/i.test(clean)) return "casual_chat";
  if (/^(wyd|how are you|you there|talk to me|what'?s up|whats up|what'?s happening|whats happening)[\s!.?]*$/i.test(clean)) return "casual_chat";
  if (/^(thanks|thank you|ty|nice|cool|good\s*boy|goodboy|lol|lmao|haha|bet|alr|alright|yup|nah|yes|no)[\s!.?]*$/i.test(clean)) return "casual_chat";
  if (/\b(what can you do|help me|help|capabilities|commands|what do you know|who are you)\b/.test(text)) return "capabilities";
  if (/\b(connect|connected|plugins?|integrations?|all data|everything connected|sync everything)\b/.test(text)) return "connections";
  if (/\b(core health|health check|system health|status check|is core working|check everything|scan problems|doctor)\b/.test(text)) return "core_health";
  if (/\b(order investigator|investigate order|check order|find order|order id|order #|lc-[a-z0-9]+)/i.test(message)) return "order_investigator";
  if (/\b(player investigator|investigate player|check player|find player|player profile|purchase history|rank history)\b/.test(text)) return "player_investigator";
  if (/\b(chatgpt upgrades|1-250|250 upgrades|two hundred fifty|1-100|one hundred|100 upgrades|server[-\s]?side memory|image library|file workspace|sql generator|rcon health|live player list|tps|order troubleshoot|checkout bug scanner|product builder|promo code builder|rank command builder|bundle builder|admin logs summary|website health scanner|cloudflare deploy checker|supabase schema scanner|duplicate checker|account investigator|auth helper|password reset|gcash checklist|admin report|knowledge upload|search project files|chat memory summary|saved prompt|fix plan|mobile admin|backup|rollback|audit|seo|analytics|notification|discord|webhook|roadmap)\b/.test(text)) return "core_power_tool";
  if (/\b(don'?t|do not|stop|never)\s+(repeat|copy|say the same|loop)\b|\bremember\b|\bcall me\b|\bmy name is\b|\bfrom now on\b/.test(text)) return "memory_preference";
  if (/\b(generate|create|make)\b.*\b(image|picture|photo|art|logo|icon|wallpaper|banner)\b/.test(text)) return "image_generation";
  if (/\b(generate|create|make|export|download)\b.*\b(file|document|markdown|md|txt|json|csv|html|report)\b/.test(text)) return "file_generation";
  if (/\b(read|analy[sz]e|inspect|explain|summarize)\b.*\b(uploaded\s+)?(files?|documents?|pdf|csv|json|txt|code|logs?)\b/.test(text)) return "file_analysis";
  if (/\b(read|analy[sz]e|inspect|explain|describe)\b.*\b(uploaded\s+)?(images?|pictures?|photos?|screenshots?)\b/.test(text)) return "image_analysis";
  if (isDefinitionQuestion) return "knowledge_question";
  if (/\b(all knowledge|everything|world knowledge|nothing is impossible|know everything)\b/.test(text)) return "knowledge_question";
  if (
    /\b(analy[sz]e|analysis|report|metrics|duplicate|anomaly|trend|summary|revenue|breakdown|missing values)\b/.test(text) &&
    /\b(data|database|orders?|accounts?|products?|promos?|revenue|sales|checkout|payment|gcash|table|rows?|admin|store)\b/.test(text)
  ) return "data_analysis";
  if (/\b(explain the project|explain this site|whole system|architecture|how does this work|know everything|overview)\b/.test(text)) return "system_overview";
  if (/\b(run|execute|send)\s+(minecraft\s+|server\s+|rcon\s+)?command\s*[:\-]/i.test(message) || /^\/[a-z0-9_:-]+/i.test(message.trim())) return "minecraft_command";
  if (/\b(players?\s+online|online\s+players?|how many players|server status|is the server online|server online|motd|minecraft status|who is online|player count)\b/.test(text)) return "minecraft_server_status";
  if (/\b(minecraft|paper|purpur|spigot|bukkit|plugin|luckperms|permission|rcon|geyser|floodgate|bedrock|java edition|crate|rank command|server)\b/.test(text)) return "minecraft_knowledge";
  if (/\b(coding|programming|debug|algorithm|typescript|javascript|react|vite|frontend|backend|api|function|component)\b/.test(text)) return "coding_knowledge";
  if (/\b(security|secret|token|password|api key|service role|rcon password|private)\b/.test(text)) return "security_knowledge";
  if (/\b(time|clock|what time)\b/.test(text)) return "current_time";
  if (/\b(date|today|tomorrow|yesterday|day of week)\b/.test(text)) return "current_date";
  if (/^[\d\s+\-*/().,%]+$/.test(text) || /\b(calculate|percent|percentage|total|minus|plus)\b/.test(text)) return "calculator";
  if (/\b(how many|count|total number|number of)\b.*\b(order|orders|request|requests|account|accounts|player|players|promo|promos|product|products|rank|ranks|bundle|bundles|key|keys|crate|crates|cosmetic|cosmetics)\b/.test(text)) return "data_analysis";
  if (/\b(rejected|pending|confirmed|delivered|completed|cancelled|canceled|disabled|verified|unverified)\b.*\b(order|orders|request|requests|account|accounts|player|players)\b/.test(text)) return "data_analysis";
  if (!isDefinitionQuestion && /\b(research|latest|current|search web|search for|look up|internet|find online|website)\b/.test(text)) return "web_research";
  if (/^(what'?s happening|whats happening|what is happening|what'?s up|wsp|wsup|wassup|sup|wyd|how are you|you there|talk to me)$/i.test(clean)) return "casual_chat";
  if (/\b(route|url|page|where is)\b/.test(text)) return "route_search";
  if (/\b(config|vite|cloudflare|wrangler|package|env)\b/.test(text)) return "config_search";
  if (/\b(build failed|build error|npm|pnpm|vite error|typescript)\b/.test(text)) return "build_error";
  if (/\b(deploy|deployment|cloudflare|pages)\b/.test(text)) return "deployment_error";
  if (/\b(database|supabase|sql|table|schema|rls)\b/.test(text)) return "database_question";
  if (/\b(order|orders|checkout|payment|account|player|promo|admin|logs|delivery)\b/.test(text)) return "admin_data_question";
  if (/\b(file|component|function|code|source|frontend|backend)\b/.test(text)) return "file_search";
  if (/\b(rank|ranks|key|keys|bundle|bundles|crate|crates|cosmetic)\b/.test(text)) return "website_project_question";
  if (text.trim()) return "general_question";
  return "unknown";
}
