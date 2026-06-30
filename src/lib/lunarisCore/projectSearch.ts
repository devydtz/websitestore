import { projectIndex, projectKnowledge } from "./projectIndexer";

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
    .slice(0, 12);
}

export function projectOverview() {
  const kinds = [...new Set(projectIndex.map((entry) => entry.kind))].sort();
  const routeCount = projectIndex.filter((entry) => entry.kind === "route").length;
  const adminCount = projectIndex.filter((entry) => entry.kind === "admin").length;
  const dataCount = projectIndex.filter((entry) => entry.kind.includes("data") || entry.kind === "database").length;

  return [
    `${projectKnowledge.name} uses ${projectKnowledge.stack.join(", ")}.`,
    projectKnowledge.architecture,
    `Safe knowledge loaded: ${projectIndex.length} mapped files/systems across ${kinds.length} categories (${routeCount} routes, ${adminCount} admin modules, ${dataCount} data/database entries).`,
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
