import { projectIndex } from "./projectIndexer";

export function searchProject(query: string) {
  const terms = query.toLowerCase().split(/\W+/).filter(Boolean);
  return projectIndex
    .map((entry) => {
      const haystack = `${entry.path} ${entry.kind} ${entry.summary} ${entry.keywords.join(" ")}`.toLowerCase();
      const score = terms.reduce((sum, term) => sum + (haystack.includes(term) ? 1 : 0), 0);
      return { ...entry, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
}
