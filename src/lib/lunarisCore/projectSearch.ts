import { projectFileCatalog } from "./projectFileCatalog";
import { projectIndex, projectKnowledge } from "./projectIndexer";

function classifyPath(path: string) {
  if (path.includes("lunarisCore")) return "lunaris-core";
  if (path.includes("components\\admin") || path.includes("components/admin")) return "admin";
  if (path.includes("routes")) return "route";
  if (path.includes("supabase\\functions") || path.includes("supabase/functions")) return "backend";
  if (path.includes("supabase\\migrations") || path.includes("supabase/migrations")) return "database";
  if (path.includes("public")) return "public";
  if (path.includes("components\\ui") || path.includes("components/ui")) return "ui";
  if (path.includes("components")) return "frontend";
  if (path.includes("lib")) return "library";
  return "project-file";
}

export function searchProject(query: string) {
  const terms = query.toLowerCase().split(/\W+/).filter(Boolean);
  const curated = projectIndex
    .map((entry) => {
      const haystack = `${entry.path} ${entry.kind} ${entry.summary} ${entry.keywords.join(" ")}`.toLowerCase();
      const score = terms.reduce((sum, term) => sum + (haystack.includes(term) ? 1 : 0), 0);
      return { ...entry, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);

  const curatedPaths = new Set(curated.map((entry) => entry.path.replaceAll("\\", "/")));
  const catalog = projectFileCatalog
    .map((path) => {
      const normalized = path.replaceAll("\\", "/");
      const haystack = `${normalized} ${classifyPath(path)}`.toLowerCase();
      const score = terms.reduce((sum, term) => sum + (haystack.includes(term) ? 1 : 0), 0);
      return {
        path: normalized,
        kind: classifyPath(path),
        summary: `Safe repo catalog entry for ${normalized}.`,
        keywords: normalized.toLowerCase().split(/[\W_]+/).filter(Boolean),
        score,
      };
    })
    .filter((entry) => entry.score > 0 && !curatedPaths.has(entry.path))
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(0, 12 - curated.length));

  return [...curated, ...catalog].slice(0, 12);
}

export function projectOverview() {
  const kinds = [...new Set(projectIndex.map((entry) => entry.kind))].sort();
  const routeCount = projectIndex.filter((entry) => entry.kind === "route").length;
  const adminCount = projectIndex.filter((entry) => entry.kind === "admin").length;
  const dataCount = projectIndex.filter((entry) => entry.kind.includes("data") || entry.kind === "database").length;

  return [
    `${projectKnowledge.name} uses ${projectKnowledge.stack.join(", ")}.`,
    projectKnowledge.architecture,
    `Safe knowledge loaded: ${projectIndex.length} curated file/system summaries plus ${projectFileCatalog.length} repo file catalog entries across ${kinds.length} categories (${routeCount} routes, ${adminCount} admin modules, ${dataCount} data/database entries).`,
    `Categories: ${kinds.join(", ")}.`,
  ].join("\n\n");
}

export function listRoutes() {
  return projectIndex
    .filter((entry) => entry.kind === "route")
    .map((entry) => `- ${entry.path}: ${entry.summary}`)
    .join("\n");
}

export function listAdminSystems() {
  return projectIndex
    .filter((entry) => entry.kind === "admin" || entry.kind === "lunaris-core")
    .map((entry) => `- ${entry.path}: ${entry.summary}`)
    .join("\n");
}
