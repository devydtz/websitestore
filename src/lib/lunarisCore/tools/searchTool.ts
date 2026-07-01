type ResearchResult = {
  source: string;
  title: string;
  url: string;
  snippet?: string;
};

function wantsLinks(message: string) {
  return /\b(link|links|source|sources|url|urls|open it|open them|website)\b/i.test(message);
}

function isDefinitionQuestion(message: string) {
  return /\b(meaning of|definition of|define)\b/i.test(message) || /\bwhat does\b.+\bmean\b/i.test(message) || /\bwhat is meaning of\b/i.test(message);
}

function extractDefinitionTerm(message: string) {
  const patterns = [
    /\bwhat is meaning of\s+(.+?)\??$/i,
    /\bmeaning of\s+(.+?)\??$/i,
    /\bdefinition of\s+(.+?)\??$/i,
    /\bdefine\s+(.+?)\??$/i,
    /\bwhat does\s+(.+?)\s+mean\??$/i,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match?.[1]) return match[1].trim().replace(/^["']|["']$/g, "");
  }

  return "";
}

function isShortLookup(message: string) {
  const term = extractDefinitionTerm(message);
  return Boolean(term) && term.split(/\s+/).length <= 4;
}

function compactSnippet(snippet?: string, fallback?: string) {
  const value = (snippet || fallback || "").replace(/\s+/g, " ").trim();
  if (!value) return "";
  return value.length > 220 ? `${value.slice(0, 217).trimEnd()}...` : value;
}

function summarizeTopResult(query: string, result: ResearchResult) {
  const snippet = compactSnippet(result.snippet, result.title);
  if (!snippet) return `I found a public result for "${query}", but it did not include a clean summary.`;
  return snippet;
}

function cleanQuery(message: string) {
  return message
    .replace(/\b(research|search web|search|look up|lookup|internet|latest|current)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, { headers: { Accept: "application/json" } });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

async function searchDuckDuckGo(query: string): Promise<ResearchResult[]> {
  type DuckDuckGoTopic = { Text?: string; FirstURL?: string; Name?: string; Topics?: DuckDuckGoTopic[] };
  type DuckDuckGoResponse = {
    Heading?: string;
    AbstractText?: string;
    AbstractURL?: string;
    RelatedTopics?: DuckDuckGoTopic[];
  };

  const data = await fetchJson<DuckDuckGoResponse>(
    `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`,
  );
  if (!data) return [];

  const results: ResearchResult[] = [];
  if (data.AbstractText && data.AbstractURL) {
    results.push({
      source: "DuckDuckGo",
      title: data.Heading || query,
      url: data.AbstractURL,
      snippet: data.AbstractText,
    });
  }

  const flattened = (data.RelatedTopics || []).flatMap((topic) => topic.Topics || [topic]);
  for (const topic of flattened.slice(0, 4)) {
    if (!topic.Text || !topic.FirstURL) continue;
    results.push({
      source: "DuckDuckGo",
      title: topic.Text.split(" - ")[0] || topic.Name || query,
      url: topic.FirstURL,
      snippet: topic.Text,
    });
  }

  return results;
}

async function searchWikipedia(query: string): Promise<ResearchResult[]> {
  const data = await fetchJson<[string, string[], string[], string[]]>(
    `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=4&namespace=0&format=json&origin=*`,
  );
  if (!data) return [];
  const [, titles, descriptions, urls] = data;
  return titles.map((title, index) => ({
    source: "Wikipedia",
    title,
    url: urls[index] || `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/\s+/g, "_"))}`,
    snippet: descriptions[index],
  }));
}

async function searchModrinth(query: string): Promise<ResearchResult[]> {
  type ModrinthResponse = {
    hits?: Array<{ title?: string; slug?: string; description?: string; project_type?: string }>;
  };

  const data = await fetchJson<ModrinthResponse>(`https://api.modrinth.com/v2/search?query=${encodeURIComponent(query)}&limit=4`);
  if (!data?.hits) return [];
  return data.hits.map((hit) => ({
    source: "Modrinth",
    title: hit.title || hit.slug || "Modrinth project",
    url: `https://modrinth.com/${hit.project_type || "project"}/${hit.slug || ""}`,
    snippet: hit.description,
  }));
}

async function searchGitHub(query: string): Promise<ResearchResult[]> {
  type GitHubResponse = {
    items?: Array<{ full_name?: string; html_url?: string; description?: string | null; stargazers_count?: number }>;
  };

  const data = await fetchJson<GitHubResponse>(
    `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=4`,
  );
  if (!data?.items) return [];
  return data.items.map((repo) => ({
    source: "GitHub",
    title: repo.full_name || "GitHub repository",
    url: repo.html_url || "https://github.com/search",
    snippet: `${repo.description || "No description."}${typeof repo.stargazers_count === "number" ? ` Stars: ${repo.stargazers_count}.` : ""}`,
  }));
}

async function getMinecraftVersion(query: string): Promise<ResearchResult[]> {
  if (!/\b(minecraft|mc)\b/i.test(query) || !/\b(version|release|snapshot)\b/i.test(query)) return [];
  type VersionManifest = { latest?: { release?: string; snapshot?: string } };

  const data = await fetchJson<VersionManifest>("https://piston-meta.mojang.com/mc/game/version_manifest_v2.json");
  if (!data?.latest) return [];

  return [
    {
      source: "Mojang version manifest",
      title: "Latest Minecraft Java versions",
      url: "https://piston-meta.mojang.com/mc/game/version_manifest_v2.json",
      snippet: `Latest release: ${data.latest.release || "unknown"}. Latest snapshot: ${data.latest.snapshot || "unknown"}.`,
    },
  ];
}

function uniqueResults(results: ResearchResult[]) {
  const seen = new Set<string>();
  return results.filter((result) => {
    const key = result.url || result.title;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function directResearchLinks(query: string): ResearchResult[] {
  const encoded = encodeURIComponent(query);
  const siteQuery = (site: string) => encodeURIComponent(`site:${site} ${query}`);

  return [
    {
      source: "DuckDuckGo direct search",
      title: "Search the open web",
      url: `https://duckduckgo.com/?q=${encoded}`,
      snippet: "Best no-login search link for broad web research.",
    },
    {
      source: "YouTube direct search",
      title: "Search YouTube",
      url: `https://www.youtube.com/results?search_query=${encoded}`,
      snippet: "Use this for videos, tutorials, server showcases, and plugin guides.",
    },
    {
      source: "TikTok direct search",
      title: "Search TikTok",
      url: `https://www.tiktok.com/search?q=${encoded}`,
      snippet: "TikTok blocks most API-free scraping, so this opens the live search page directly.",
    },
    {
      source: "Facebook public search",
      title: "Search public Facebook pages/posts",
      url: `https://duckduckgo.com/?q=${siteQuery("facebook.com")}`,
      snippet: "Facebook usually requires login for deep results, so this searches public indexed pages.",
    },
    {
      source: "GitHub direct search",
      title: "Search GitHub",
      url: `https://github.com/search?q=${encoded}&type=repositories`,
      snippet: "Useful for code, plugins, open-source projects, and examples.",
    },
    {
      source: "Modrinth direct search",
      title: "Search Modrinth",
      url: `https://modrinth.com/search?q=${encoded}`,
      snippet: "Useful for Minecraft mods, plugins, datapacks, and resource packs.",
    },
    {
      source: "Cloudflare Docs search",
      title: "Search Cloudflare docs",
      url: `https://developers.cloudflare.com/search/?q=${encoded}`,
      snippet: "Useful for Pages, Workers, Workers AI, DNS, and deployment problems.",
    },
  ];
}

export async function searchTool(message: string) {
  const query = cleanQuery(message);
  if (!query) return "Tell me what to research and I will search free public sources.";
  const directLinksRequested = wantsLinks(message);
  const definitionQuestion = isDefinitionQuestion(message);
  const shortLookup = isShortLookup(message);

  const settled = await Promise.allSettled([
    getMinecraftVersion(query),
    searchDuckDuckGo(query),
    searchWikipedia(query),
    searchModrinth(query),
    searchGitHub(query),
  ]);

  const results = uniqueResults(
    settled.flatMap((item) => (item.status === "fulfilled" ? item.value : [])).filter((item) => item.title && item.url),
  ).slice(0, 10);
  const links = directResearchLinks(query);

  if (results.length === 0) {
    if (definitionQuestion || shortLookup) {
      const term = extractDefinitionTerm(message) || query;
      return `I could not verify a solid public definition for "${term}" yet. If that is slang, local language, or server-specific wording, send the context and I will narrow it properly.`;
    }

    if (!directLinksRequested) {
      return `I could not verify a solid public answer for "${query}" from the free live sources I checked. Ask me to search deeper or ask for direct links and I will open the research path.`;
    }

    return [
      `I could not pull live snippets for "${query}" from the free no-key APIs, but here are direct research links you can open:`,
      ...links.map((result, index) => `${index + 1}. ${result.title}\n   ${result.url}\n   ${result.snippet}`),
      "Some sites like TikTok and Facebook block no-key automated scraping, so Core gives you the live search page instead of inventing results.",
    ].join("\n\n");
  }

  const top = results[0];

  if (definitionQuestion || shortLookup || !directLinksRequested) {
    const directAnswer = summarizeTopResult(query, top);
    if (!directLinksRequested) return directAnswer;
    return `${directAnswer}\n\nSource: ${top.url}`;
  }

  return [
    `I found these useful results for "${query}":`,
    ...results.map((result, index) => {
      const snippet = result.snippet ? `\n   ${result.snippet}` : "";
      return `${index + 1}. ${result.title}\n   ${result.url}${snippet}`;
    }),
    "Direct research links:",
    ...links.map((result, index) => `${index + 1}. ${result.title}\n   ${result.url}`),
  ].join("\n\n");
}
