import type { LunarisIntent } from "./intentDetector";
import { calculatorTool } from "./tools/calculatorTool";
import { dateTool } from "./tools/dateTool";
import { databaseTool } from "./tools/databaseTool";
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
          "I can help with:\n- Website/frontend routes, components, cart, checkout, account, and order status\n- Admin panel systems: orders, accounts, promos, products, delivery logs, settings, and admin roles\n- Supabase data scans for orders, accounts, promos, and products\n- Backend/Edge Function/RCON file locations and explanations\n- Cloudflare/Vite/build/deploy debugging from the project map\n- Time/date in Asia/Manila\n- Basic calculator and price math\n- General questions when they do not need live internet\n\nI do not use an external AI model, and web research is disabled unless you configure a search provider later.",
        source: "lunarisCore capabilities",
      };
    case "system_overview":
      return { answer: websiteTool(message), source: "websiteTool projectOverview" };
    case "current_time":
      return { answer: `It is currently ${timeTool()} in Asia/Manila.`, source: "timeTool" };
    case "current_date":
      return { answer: `The date is ${dateTool(message)}.`, source: "dateTool" };
    case "calculator":
      return { answer: calculatorTool(message), source: "calculatorTool" };
    case "web_research":
      return { answer: searchTool(), source: "searchTool" };
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
        answer: `I can answer from the Lunaris project knowledge I have loaded. ${websiteTool(message)}\n\nIf you meant live internet research: ${searchTool()}`,
        source: "websiteTool + searchTool",
      };
    default:
      return { answer: "I need a clearer question. Try asking about orders, accounts, promos, ranks, files, build errors, time, date, or math.", source: "intentDetector" };
  }
}
