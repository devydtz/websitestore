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
      return { answer: `${websiteTool()}\n\nFor general live research: ${searchTool()}`, source: "websiteTool + searchTool" };
    default:
      return { answer: "I need a clearer question. Try asking about orders, accounts, promos, ranks, files, build errors, time, date, or math.", source: "intentDetector" };
  }
}
