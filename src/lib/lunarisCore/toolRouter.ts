import type { LunarisIntent } from "./intentDetector";
import { calculatorTool } from "./tools/calculatorTool";
import { dataAnalysisTool } from "./tools/dataAnalysisTool";
import { dateTool } from "./tools/dateTool";
import { databaseTool } from "./tools/databaseTool";
import { knowledgeTool } from "./tools/knowledgeTool";
import { fileGeneratorTool } from "./tools/fileGeneratorTool";
import { imageGeneratorTool } from "./tools/imageGeneratorTool";
import { runCoreMinecraftCommand } from "./tools/minecraftCommandTool";
import { minecraftServerTool } from "./tools/minecraftServerTool";
import { projectTool } from "./tools/projectTool";
import { searchTool } from "./tools/searchTool";
import { timeTool } from "./tools/timeTool";
import { websiteTool } from "./tools/websiteTool";
import { connectionHubTool } from "./tools/connectionHubTool";
import { casualChatTool } from "./tools/casualChatTool";
import { memoryPreferenceTool } from "./tools/memoryPreferenceTool";
import { corePowerTool } from "./tools/powerTool";
import type { LunarisCoreGeneratedImage, LunarisCoreToolTrace } from "./client";

export type LunarisToolResult = {
  answer: string;
  source: string;
  generatedImages?: LunarisCoreGeneratedImage[];
  tools?: LunarisCoreToolTrace[];
};

export async function routeTool(intent: LunarisIntent, message: string): Promise<LunarisToolResult> {
  switch (intent) {
    case "greeting":
      return {
        answer:
          "Yo, I am here. Ask me anything about Lunaris Craft, code, Minecraft, admin data, web research, files, or ideas. If I can verify it, I will; if I cannot, I will tell you straight instead of making stuff up.",
        source: "Lunaris Core identity and imported knowledge rules.",
      };
    case "capabilities":
      return {
        answer:
          "I can help with the Lunaris website, checkout bugs, admin data, Supabase tables, Cloudflare deploy issues, Minecraft ranks/RCON delivery, store products, code structure, security checks, reports, price math, uploaded files, generated text files, and public research links. Ask normally. I will pick the right tool quietly and give you the clean answer.",
        source: "Lunaris Core capabilities document and imported knowledge rules.",
      };
    case "connections":
      return {
        answer: connectionHubTool(),
        source: "Lunaris Core connection hub.",
        tools: [{ name: "Connection Hub", status: "done", summary: "Listed currently connected and not-yet-connected Core capabilities." }],
      };
    case "core_power_tool":
      return {
        answer: corePowerTool(message),
        source: "Lunaris Core power tools registry.",
        tools: [{ name: "Power Tools", status: "done", summary: "Matched the request to a Lunaris Core admin tool group." }],
      };
    case "casual_chat":
      return {
        answer: casualChatTool(message),
        source: "Lunaris Core conversational behavior.",
      };
    case "memory_preference":
      return {
        answer: memoryPreferenceTool(message),
        source: "Lunaris Core browser conversation memory.",
        tools: [{ name: "Memory", status: "done", summary: "Saved the admin preference in local chat memory." }],
      };
    case "coding_knowledge":
    case "minecraft_knowledge":
    case "security_knowledge":
    case "knowledge_question":
      return { answer: knowledgeTool(message), source: "Imported Lunaris Core advanced knowledge pack and built-in knowledge base." };
    case "minecraft_server_status":
      return { answer: await minecraftServerTool(message), source: "Live Minecraft server status lookup for lunaris.ultraga.me:19075." };
    case "minecraft_command":
      return { answer: await runCoreMinecraftCommand(message), source: "Protected Supabase Edge Function RCON command runner." };
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
    case "file_generation":
      return {
        answer: fileGeneratorTool(message),
        source: "Lunaris Core file generator helper.",
        tools: [{ name: "File Generator", status: "done", summary: "Prepared this answer for Markdown/text export from the chat." }],
      };
    case "image_generation":
      return imageGeneratorTool(message);
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
        answer:
          "I can answer broad questions, casual messages, coding problems, Minecraft/server questions, planning, writing, math, and troubleshooting. I will use the chat memory and Lunaris context when it matters, and I will ask only if the request is truly unclear.",
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
