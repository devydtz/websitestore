import { searchProject } from "../projectSearch";

export function projectTool(message: string) {
  const results = searchProject(message);
  if (results.length === 0) {
    return "I searched the safe project map but did not find a matching file. Try naming the page, feature, or error.";
  }
  return `I searched the safe repo knowledge map and found these likely files/systems:\n${results
    .map((item, index) => `${index + 1}. ${item.path} - ${item.summary}`)
    .join("\n")}\n\nAsk me to narrow it down by page, button, table, route, checkout, admin, RCON, Cloudflare, or Supabase.`;
}
