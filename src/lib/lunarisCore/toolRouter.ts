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
          "Hi. I am Lunaris Core, the private admin assistant for Lunaris Craft. I can answer from the imported knowledge base, safe repo file catalog, project index, admin database scanner, calculator, time/date tools, and free public research sources. I will not invent files, rows, products, ranks, keys, bundles, logs, or secrets.",
        source: "Lunaris Core identity and imported knowledge rules.",
      };
    case "capabilities":
      return {
        answer:
          "I can help with:\n- Heavy coding help: React, Vite, TypeScript, debugging, build errors, frontend/backend structure\n- Minecraft server ops: Paper/Purpur, LuckPerms, RCON, ranks, crates, Geyser/Floodgate, store delivery\n- Lunaris website knowledge: routes, components, checkout, account, cart, products, admin panel, Supabase, Cloudflare\n- Supabase scans: orders, accounts, promos, products, and admin data your current permissions can read\n- Security checks: secrets, service-role safety, RCON/password exposure, RLS issues\n- Time/date in Asia/Manila and calculator/price math\n- Free no-key research using public sources like DuckDuckGo Instant Answer, Wikipedia, Modrinth, GitHub, and Mojang version metadata\n\nI do not use an external AI model or paid API key. Browser-based free research can be limited by public-source restrictions, but I will try multiple sources.",
        source: "Lunaris Core capabilities document and imported knowledge rules.",
      };
    case "coding_knowledge":
    case "minecraft_knowledge":
    case "security_knowledge":
    case "knowledge_question":
      return { answer: knowledgeTool(message), source: "Imported Lunaris Core advanced knowledge pack and built-in knowledge base." };
    case "data_analysis":
      return { answer: await dataAnalysisTool(message), source: "Data analysis tool using Supabase admin data helpers." };
    case "system_overview":
      return { answer: websiteTool(message), source: "Project overview from Lunaris Core project index and file catalog." };
    case "current_time":
      return { answer: `It is currently ${timeTool()} in Asia/Manila.`, source: "Time tool." };
    case "current_date":
      return { answer: `The date is ${dateTool(message)}.`, source: "Date tool." };
    case "calculator":
      return { answer: calculatorTool(message), source: "Calculator tool." };
    case "web_research":
      return { answer: await searchTool(message), source: "Free public research tool." };
    case "database_question":
    case "admin_data_question":
      return { answer: await databaseTool(message), source: "Supabase database scanner through existing admin data helpers." };
    case "website_project_question":
    case "code_question":
    case "file_search":
    case "route_search":
    case "config_search":
    case "build_error":
    case "deployment_error":
      return { answer: projectTool(message), source: "Lunaris Core project index and safe repo file catalog." };
    case "general_question":
      return {
        answer: knowledgeTool(message),
        source: "Imported Lunaris Core knowledge base.",
      };
    default:
      return {
        answer:
          "I do not have enough information to answer that accurately. I checked the intent detector, but the request did not clearly match a project search, database scan, calculation, date/time question, research request, or knowledge topic.",
        source: "Intent detector.",
      };
  }
}
