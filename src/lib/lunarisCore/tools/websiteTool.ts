import { listAdminSystems, listRoutes, projectOverview } from "../projectSearch";

export function websiteTool(message = "") {
  const text = message.toLowerCase();
  if (/\b(admin|dashboard|core|assistant)\b/.test(text)) {
    return `Admin systems I know:\n${listAdminSystems()}`;
  }
  if (/\b(route|page|url)\b/.test(text)) {
    return `Routes I know:\n${listRoutes()}`;
  }
  return projectOverview();
}
