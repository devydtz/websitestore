export type KnowledgeTopic = {
  id: string;
  title: string;
  summary: string;
  keywords: string[];
  bullets: string[];
};

export const knowledgeBase: KnowledgeTopic[] = [
  {
    id: "data-analysis",
    title: "Data Analysis",
    summary: "Professional analysis workflow for orders, accounts, products, promos, logs, and structured data.",
    keywords: ["data", "analysis", "analyze", "report", "metrics", "duplicates", "anomalies", "revenue", "summary", "csv", "json", "logs"],
    bullets: [
      "Start by identifying the data source, row count, fields, and date range.",
      "Calculate totals, averages, status breakdowns, category counts, and top items before giving recommendations.",
      "Flag missing values, duplicate identifiers, invalid amounts, suspicious status combinations, and failed delivery logs.",
      "For Lunaris admin data, prioritize orders, accounts, products, promos, payment references, and delivery status.",
      "A good report has summary, key metrics, findings, issues, recommended actions, and limitations.",
    ],
  },
  {
    id: "coding-debugging",
    title: "Coding and Debugging",
    summary: "How to approach frontend, backend, TypeScript, build, and runtime problems.",
    keywords: ["coding", "code", "debug", "bug", "typescript", "javascript", "error", "crash", "frontend", "backend"],
    bullets: [
      "Start from the exact error, then identify whether it happens at build time, page load, click/action time, or after a network request.",
      "For React crashes, check null/undefined state, missing route data, bad async state updates, stale chunks, and unhandled rejected promises.",
      "For TypeScript issues, fix the real shape mismatch instead of hiding it with any unless the data is truly unknown.",
      "For slow pages, reduce repeated network calls, memoize expensive derived data, lazy-load heavy views, and avoid creating clients inside render loops.",
      "For production-only bugs, compare environment variables, deployed assets, Cloudflare cache, route rewrites, and browser console output.",
    ],
  },
  {
    id: "react-vite",
    title: "React + Vite",
    summary: "Core behavior for React apps built with Vite.",
    keywords: ["react", "vite", "component", "hook", "state", "useeffect", "bundle", "chunk", "spa", "router"],
    bullets: [
      "React components should keep render logic predictable: derive UI from state, keep side effects in effects/events, and guard optional data.",
      "Vite exposes browser env variables only when they start with VITE_. Server secrets must never be imported into frontend code.",
      "Dynamic import chunk errors often mean the browser cached an old asset after a new deploy; a reload handler or cache headers can help.",
      "TanStack Router file routes are generated into routeTree.gen.ts; route files should be added/removed then build regenerates the tree.",
      "A SPA on Cloudflare Pages normally needs safe fallback routing, but asset paths must not redirect into index.html.",
    ],
  },
  {
    id: "supabase",
    title: "Supabase",
    summary: "Auth, database, RLS, anon keys, service role, Edge Functions, and schema safety.",
    keywords: ["supabase", "postgres", "sql", "rls", "auth", "edge function", "service role", "anon", "schema", "database"],
    bullets: [
      "Frontend code may use VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY; it must never use the service-role key.",
      "RLS decides what the anon/authenticated frontend can read or write. If a table works in SQL editor but fails in browser, check RLS policies.",
      "Service-role actions belong in Edge Functions or trusted backend code only.",
      "Schema cache errors usually mean a table/column was just created or changed; refreshing schema/cache or waiting briefly can help.",
      "For admin actions, validate the admin session/role before changing orders, products, accounts, or delivery status.",
    ],
  },
  {
    id: "cloudflare-pages",
    title: "Cloudflare Pages",
    summary: "Deploy/build/runtime behavior for the website.",
    keywords: ["cloudflare", "pages", "deploy", "deployment", "build", "wrangler", "redirects", "headers", "cache"],
    bullets: [
      "A healthy build does not guarantee a healthy runtime; browser console errors still matter after deployment.",
      "Lockfile mismatches can break dependency install. package.json and the lockfile must agree.",
      "Use public/_headers for cache behavior and public/_redirects carefully so routes work without creating asset loops.",
      "Cloudflare Pages serves built files from dist for Vite builds.",
      "If a custom domain behaves differently than pages.dev, suspect DNS, SSL, caching, or stale assets.",
    ],
  },
  {
    id: "minecraft-server",
    title: "Minecraft Server Operations",
    summary: "Paper/Purpur server basics, plugins, permissions, RCON, and store delivery.",
    keywords: ["minecraft", "paper", "purpur", "server", "plugin", "plugins", "luckperms", "geyser", "floodgate", "rcon", "bedrock", "java"],
    bullets: [
      "Use Paper or Purpur for plugin servers; keep plugin versions compatible with the server version.",
      "LuckPerms is the standard choice for ranks and permissions. Common command pattern: lp user <player> parent add <group>.",
      "RCON needs enable-rcon=true, a matching rcon.password, and an open reachable rcon.port. The website backend must connect to the RCON port, not the public player port.",
      "Public server status can show whether the server is online, version/MOTD, and player counts without exposing RCON.",
      "Private in-game actions such as running commands, reading restricted plugin data, or granting ranks should go through a protected backend/Edge Function, never frontend code.",
      "If RCON times out, check firewall/allocation, whether the host exposes RCON publicly, correct port, correct password, and server.properties reload/restart.",
      "Geyser/Floodgate can allow Bedrock players, but usernames/prefixes and permission handling may differ from Java accounts.",
      "Store delivery should log every command result so admins can retry safely instead of double-granting rewards blindly.",
    ],
  },
  {
    id: "minecraft-store",
    title: "Minecraft Store Design",
    summary: "How ranks, keys, bundles, promos, checkout, and manual payment verification should work.",
    keywords: ["store", "ranks", "keys", "bundles", "crate", "cosmetic", "checkout", "gcash", "promo", "receipt", "order"],
    bullets: [
      "Ranks should have stable slugs, clear perks, price, active/disabled state, sort order, and delivery commands.",
      "Keys and bundles should stay hidden or coming soon until real products are added.",
      "Manual GCash flow should collect account, GCash number/reference, amount, and clear admin verification status.",
      "Promo codes should calculate the final price before checkout submit and store discount metadata on the order.",
      "Admin confirm/reject/complete actions should update order status, add admin notes, and keep audit/delivery logs.",
    ],
  },
  {
    id: "security",
    title: "Security",
    summary: "Practical security rules for the Lunaris site and admin panel.",
    keywords: ["security", "secret", "password", "token", "api key", "admin", "private", "safe"],
    bullets: [
      "Never expose service-role keys, RCON passwords, admin passwords, or private tokens in frontend code.",
      "Admin-only UI is not enough by itself; protected data changes should also be protected by RLS or server-side checks.",
      "Do not show real user passwords. Auth systems store password hashes and cannot safely recover original passwords.",
      "Use least privilege: public visitors read only public store data; admins get admin tools; service role stays server-side.",
      "Rotate any secret that has ever been pasted into chat, screenshots, commits, or public logs.",
    ],
  },
  {
    id: "general-assistant",
    title: "General Assistant Behavior",
    summary: "How Lunaris Core should answer normal questions.",
    keywords: ["general", "question", "advice", "idea", "plan", "explain", "anything", "world", "knowledge"],
    bullets: [
      "Answer directly and naturally when the question is about stable general knowledge, project structure, coding patterns, Minecraft server ops, math, or date/time.",
      "Sound like a helpful teammate: warm, clear, a little alive, and never stiff.",
      "Do not pretend to literally be human or have real emotions, but use empathetic conversational language when it helps.",
      "Invite the admin to ask anything, then use real tools/data instead of pretending to know unavailable facts.",
      "Be honest when a question needs live internet, current news, exact current versions, prices, laws, or external verification.",
      "For plans, give clear steps in order and mention what data or access is needed.",
      "For technical questions, prefer the repo knowledge map and database scanner first.",
      "Do not pretend to know files, secrets, or live data that are not available.",
    ],
  },
];

export function searchKnowledge(query: string) {
  const stopWords = new Set(["the", "a", "an", "and", "or", "to", "of", "in", "it", "is", "are", "be", "me", "you", "my", "what", "how", "why", "can", "do", "does", "for"]);
  const terms = query
    .toLowerCase()
    .split(/\W+/)
    .filter((term) => term.length > 1 && !stopWords.has(term));
  return knowledgeBase
    .map((topic) => {
      const keywordText = topic.keywords.join(" ").toLowerCase();
      const haystack = `${topic.title} ${topic.summary} ${keywordText} ${topic.bullets.join(" ")}`.toLowerCase();
      const score = terms.reduce((sum, term) => {
        if (keywordText.split(" ").includes(term)) return sum + 4;
        if (topic.title.toLowerCase().includes(term)) return sum + 3;
        if (topic.summary.toLowerCase().includes(term)) return sum + 2;
        return sum + (haystack.includes(term) ? 1 : 0);
      }, 0);
      return { ...topic, score };
    })
    .filter((topic) => topic.score > 1)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);
}

export function answerFromKnowledge(query: string) {
  const matches = searchKnowledge(query);
  if (matches.length === 0) {
    return [
      "I do not have enough specific context to answer that accurately yet.",
      "I can help best when you ask about Lunaris code, admin data, orders, accounts, products, promos, Supabase, Cloudflare, Minecraft server ops, security, calculations, or research.",
    ].join("\n\n");
  }

  return matches
    .map((topic) => `${topic.title}\n${topic.summary}\n${topic.bullets.map((bullet) => `- ${bullet}`).join("\n")}`)
    .join("\n\n");
}

export function fullKnowledgeSummary() {
  return [
    "I have local knowledge loaded for these areas:",
    ...knowledgeBase.map((topic) => `- ${topic.title}: ${topic.summary}`),
    "",
    "I can answer from built-in knowledge, the Lunaris repo map, the safe repo file catalog, Supabase scanner, calculator, time/date tools, and free public research sources.",
  ].join("\n");
}
