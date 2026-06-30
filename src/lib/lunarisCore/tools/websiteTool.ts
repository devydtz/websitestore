import { projectIndex } from "../projectIndexer";

export function websiteTool() {
  const routes = projectIndex.filter((entry) => entry.kind === "route");
  return `Website structure I know about:\n${routes.map((route) => `- ${route.path}: ${route.summary}`).join("\n")}`;
}
