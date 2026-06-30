type ResearchResult = {
  source: string;
  title: string;
  url: string;
  snippet?: string;
};

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

export async function searchTool(message: string) {
  const query = cleanQuery(message);
  if (!query) return "Tell me what to research and I will search free public sources.";

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

  if (results.length === 0) {
    return [
      `I tried free no-key research sources for "${query}", but none returned usable results from the browser.`,
      "Some public sources limit browser requests. For stronger research everywhere, we would need a server-side search provider later.",
    ].join("\n\n");
  }

  return [
    `Research results for "${query}":`,
    ...results.map((result, index) => {
      const snippet = result.snippet ? `\n   ${result.snippet}` : "";
      return `${index + 1}. ${result.title}\n   ${result.url}${snippet}\n   Source: ${result.source}`;
    }),
  ].join("\n\n");
}
