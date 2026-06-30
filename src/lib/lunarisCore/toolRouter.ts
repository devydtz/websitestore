import type { LunarisIntent } from "./intentDetector";
import { calculatorTool } from "./tools/calculatorTool";
import { dataAnalysisTool } from "./tools/dataAnalysisTool";
import { dateTool } from "./tools/dateTool";
import { databaseTool } from "./tools/databaseTool";
import { knowledgeTool } from "./tools/knowledgeTool";
import { projectTool } from "./tools/projectTool";
import { searchTool } from "./tools/searchTool";
import { timeTool } from "./tools/timeTool";
import { websiteTool } from "./tools/websiteTool";

export async function routeTool(intent: LunarisIntent, message: string) {
  switch (intent) {
    case "greeting":
      return {
        answer:
          "Yo, I am Lunaris Core. I am inside the admin panel and I can help with the store, admin tools, orders, accounts, products, Supabase data, Cloudflare build issues, time/date, and math. Ask me anything about the project and I will search my safe knowledge map or database tools.",
        source: "lunarisCore greeting",
      };
    case "capabilities":
      return {
        answer:
          "I can help with:\n- Heavy coding help: React, Vite, TypeScript, debugging, build errors, frontend/backend structure\n- Minecraft server ops: Paper/Purpur, LuckPerms, RCON, ranks, crates, Geyser/Floodgate, store delivery\n- Lunaris website knowledge: routes, components, checkout, account, cart, products, admin panel, Supabase, Cloudflare\n- Supabase scans: orders, accounts, promos, products, and admin data your current permissions can read\n- Security checks: secrets, service-role safety, RCON/password exposure, RLS issues\n- Time/date in Asia/Manila and calculator/price math\n- Free no-key research using public sources like DuckDuckGo Instant Answer, Wikipedia, Modrinth, GitHub, and Mojang version metadata\n\nI do not use an external AI model or paid API key. Browser-based free research can be limited by public-source restrictions, but I will try multiple sources.",
        source: "lunarisCore capabilities",
      };
    case "coding_knowledge":
    case "minecraft_knowledge":
    case "security_knowledge":
    case "knowledge_question":
      return { answer: knowledgeTool(message), source: "knowledgeTool" };
    case "data_analysis":
      return { answer: await dataAnalysisTool(message), source: "dataAnalysisTool" };
    case "system_overview":
      return { answer: websiteTool(message), source: "websiteTool projectOverview" };
    case "current_time":
      return { answer: `It is currently ${timeTool()} in Asia/Manila.`, source: "timeTool" };
    case "current_date":
      return { answer: `The date is ${dateTool(message)}.`, source: "dateTool" };
    case "calculator":
      return { answer: calculatorTool(message), source: "calculatorTool" };
    case "web_research":
      return { answer: await searchTool(message), source: "searchTool" };
    case "database_question":
    case "admin_data_question":
      return { answer: await databaseTool(message), source: "databaseTool" };
    case "website_project_question":
    case "code_question":
    case "file_search":
    case "route_search":
    case "config_search":
    case "build_error":
    case "deployment_error":
      return { answer: projectTool(message), source: "projectTool" };
    case "general_question":
      return {
        answer: knowledgeTool(message),
        source: "knowledgeTool",
      };
    default:
      return { answer: "I need a clearer question. Try asking about orders, accounts, promos, ranks, files, build errors, time, date, or math.", source: "intentDetector" };
  }
}
