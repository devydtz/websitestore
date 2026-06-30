import { searchProject } from "../projectSearch";

export function projectTool(message: string) {
  const results = searchProject(message);
  if (results.length === 0) {
    return "I searched the safe project map but did not find a matching file. Try naming the page, feature, or error.";
  }
  return `I found likely project files:\n${results
    .map((item, index) => `${index + 1}. ${item.path} - ${item.summary}`)
    .join("\n")}`;
}
