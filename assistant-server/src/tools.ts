import { analyzeDatabase, scanTable } from "./database.js";
import { searchData, searchProject } from "./search.js";

export async function runTool(name: string, input: Record<string, unknown>) {
  switch (name) {
    case "search_project":
      return searchProject(String(input.query ?? ""));
    case "search_database":
      return searchData(String(input.query ?? ""));
    case "analyze_database":
      return analyzeDatabase();
    case "scan_ranks":
      return scanTable("ranks");
    case "scan_crates":
      return scanTable("crates");
    case "scan_keys":
      return scanTable("crate_keys");
    case "scan_bundles":
      return scanTable("bundles");
    case "scan_cosmetics":
      return scanTable("cosmetics");
    case "scan_admin_logs":
      return scanTable("admin_logs");
    default:
      return { note: "No tool needed." };
  }
}
