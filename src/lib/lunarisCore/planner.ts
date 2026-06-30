import { detectIntent, type LunarisIntent } from "./intentDetector";
import type { LunarisCoreAttachment, LunarisCoreToolTrace } from "./client";

export type LunarisPlan = {
  intent: LunarisIntent;
  steps: string[];
  tools: LunarisCoreToolTrace[];
};

function tool(name: string, summary: string): LunarisCoreToolTrace {
  return { name, status: "done", summary };
}

export function planLunarisCoreTask(message: string, attachments: LunarisCoreAttachment[] = []): LunarisPlan {
  const intent = detectIntent(message);
  const steps = ["Understanding request", "Searching Lunaris knowledge"];
  const tools: LunarisCoreToolTrace[] = [];

  if (attachments.length) {
    steps.push("Inspecting uploaded files");
    tools.push(tool("File Reader", `${attachments.length} uploaded file${attachments.length === 1 ? "" : "s"} added to the context.`));
  }

  if (["website_project_question", "code_question", "file_search", "route_search", "config_search", "build_error", "deployment_error", "system_overview"].includes(intent)) {
    steps.push("Reading project index");
    tools.push(tool("Project Search", "Checked the safe Lunaris project catalog and indexed frontend/backend files."));
  }

  if (["database_question", "admin_data_question", "data_analysis"].includes(intent)) {
    steps.push("Scanning admin data");
    tools.push(tool("Database Scan", "Used the browser-safe Supabase admin data helpers."));
  }

  if (intent === "web_research") {
    steps.push("Researching public websites");
    tools.push(tool("Web Research", "Checked free no-key research sources and direct public search links."));
  }

  if (intent === "minecraft_server_status") {
    steps.push("Checking Minecraft public network");
    tools.push(tool("Minecraft Status", "Used the deployed backend direct server status ping."));
  }

  if (intent === "minecraft_command") {
    steps.push("Preparing protected server command");
    tools.push(tool("Minecraft Command", "Routes through the protected Supabase Edge Function."));
  }

  if (intent === "calculator") {
    steps.push("Running calculation");
    tools.push(tool("Calculator", "Computed the expression locally in the browser."));
  }

  if (intent === "current_time" || intent === "current_date") {
    steps.push("Checking date/time");
    tools.push(tool("Time/Date", "Used the configured Asia/Manila date and time helpers."));
  }

  steps.push("Building answer");
  return { intent, steps, tools };
}
