import { searchProject } from "./projectSearch";

export function buildContext(message: string) {
  return {
    projectMatches: searchProject(message),
    timeZone: "Asia/Manila",
  };
}
