import { detectIntent } from "./intentDetector";
import type { LunarisIntent } from "./intentDetector";
import { routeTool } from "./toolRouter";
import { responseEngine } from "./responseEngine";
import { providerAdapter } from "./providerAdapter";
import type { LunarisCoreRequestContext } from "./client";
import { appendAttachmentContext, formatLunarisAnswer } from "./answerFormatter";
import { fileReaderTool } from "./tools/fileReaderTool";
import { imageReaderTool } from "./tools/imageReaderTool";
import { planLunarisCoreTask } from "./planner";
import { humanizeCoreFallback } from "./personality";
import { buildConversationMemory, loadPinnedCoreNotes } from "./memoryStore";

function normalized(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").replace(/[^\w\s]/g, "").trim();
}

function isTooSimilar(a: string, b: string) {
  const left = normalized(a);
  const right = normalized(b);
  if (!left || !right) return false;
  if (left === right) return true;
  const shorter = left.length < right.length ? left : right;
  const longer = left.length < right.length ? right : left;
  return shorter.length > 80 && longer.includes(shorter.slice(0, Math.min(shorter.length, 220)));
}

function recentCoreAnswers(history = [] as NonNullable<LunarisCoreRequestContext["history"]>) {
  return history.filter((item) => item.role === "core").map((item) => item.content).slice(-5);
}

function antiRepeat(answer: string, message: string, history: NonNullable<LunarisCoreRequestContext["history"]>) {
  const previous = recentCoreAnswers(history);
  const requestedNoRepeat = /\b(don'?t|do not|stop|never)\s+(repeat|copy|say the same|loop)\b/i.test(message);
  if (!previous.some((old) => isTooSimilar(answer, old))) return answer;
  if (requestedNoRepeat) return "Got it. I will not repeat that again. Tell me the exact thing you want changed or ask a new question and I will answer fresh.";
  return "I caught myself almost repeating the same response. Give me one more detail and I will answer it from a different angle.";
}

function sourceForIntent(intent: LunarisIntent, message: string, rawSource: string) {
  if (rawSource && rawSource !== "intentDetector") return rawSource;
  switch (intent) {
    case "data_analysis":
    case "database_question":
    case "admin_data_question":
      return "Supabase admin data scanner: orders, accounts, store_products, and promo_codes when requested.";
    case "website_project_question":
    case "code_question":
    case "file_search":
    case "route_search":
    case "config_search":
    case "build_error":
    case "deployment_error":
    case "system_overview":
      return "Lunaris Core project index and safe repo file catalog.";
    case "web_research":
      return "Free public research sources: DuckDuckGo Instant Answer, Wikipedia, Modrinth, GitHub, and Mojang metadata when available.";
    case "minecraft_server_status":
      return "Live Minecraft server status lookup for lunaris.ultraga.me:19075. This is current public reachability data.";
    case "minecraft_command":
      return "Protected Supabase Edge Function RCON command runner.";
    case "calculator":
      return "Calculator tool.";
    case "current_time":
      return "Time tool using Asia/Manila timezone.";
    case "current_date":
      return "Date tool using Asia/Manila timezone.";
    case "coding_knowledge":
    case "minecraft_knowledge":
    case "security_knowledge":
    case "knowledge_question":
    case "general_question":
    case "capabilities":
    case "greeting":
      return "Lunaris Core imported knowledge base and behavior rules.";
    default:
      return `Intent detector searched for a matching tool for: "${message}".`;
  }
}

function nextForIntent(intent: LunarisIntent) {
  switch (intent) {
    case "data_analysis":
    case "database_question":
    case "admin_data_question":
      return "Review the flagged issues in the admin panel, then ask me to narrow the report to orders, accounts, products, promos, duplicates, or revenue.";
    case "website_project_question":
    case "code_question":
    case "file_search":
    case "route_search":
    case "config_search":
    case "build_error":
    case "deployment_error":
      return "Open the listed file or ask me to narrow the search by exact error text, route, component, or feature name.";
    case "web_research":
      return "Open the returned links to verify details, especially if the topic is current or version-sensitive.";
    case "minecraft_server_status":
      return "Use RCON separately only for private in-game commands; public status can show online state and player counts.";
    case "minecraft_command":
      return "Check the server response before running another command.";
    case "calculator":
      return "Send another expression if you want a discount, total, percentage, or price breakdown.";
    case "current_time":
    case "current_date":
      return "Ask for another timezone or a date calculation if needed.";
    default:
      return "Ask a more specific follow-up, or request a project search, database scan, calculation, report, or web research.";
  }
}

export async function askLunarisCore(message: string, context: LunarisCoreRequestContext = {}) {
  const attachments = context.attachments || [];
  const history = context.history || [];
  const pinnedNotes = loadPinnedCoreNotes();
  const attachmentSummaries = attachments.map((file) => `${file.name} (${file.kind}, ${file.type || "unknown"}, ${file.size} bytes)`);
  const conversationMemory = buildConversationMemory(history);
  const memoryContext = pinnedNotes.length
    ? [`Saved admin preferences:`, ...pinnedNotes.slice(0, 25).map((note) => `- ${note}`), "", conversationMemory].join("\n")
    : conversationMemory;
  const enrichedMessage = appendAttachmentContext([message, memoryContext ? `\nMemory context:\n${memoryContext}` : ""].join("\n"), attachmentSummaries);
  const plan = planLunarisCoreTask(enrichedMessage, attachments);
  const intent = detectIntent(enrichedMessage);
  const result = await routeTool(intent, enrichedMessage);
  const source = sourceForIntent(intent, message, result.source);
  const next = nextForIntent(intent);
  const attachmentContext = attachments.length
    ? [fileReaderTool(attachments), imageReaderTool(attachments)].filter(Boolean).join("\n\n")
    : "";
  const localAnswer = humanizeCoreFallback(formatLunarisAnswer(responseEngine({
    answer: result.answer,
    source,
    next,
  }) + (attachmentContext ? `\n\nUploaded file context:\n${attachmentContext}` : "")));
  const tools = [...plan.tools, ...(result.tools || [])];

  if (intent === "minecraft_server_status" || intent === "minecraft_command" || intent === "web_research" || intent === "casual_chat" || intent === "memory_preference") {
    return {
      intent,
      content: antiRepeat(localAnswer, message, history),
      tools,
    };
  }

  const model = await providerAdapter({
    message: enrichedMessage,
    intent,
    groundedAnswer: localAnswer,
    source,
    next,
    mode: context.mode || "general",
    history: history.slice(-80),
  });
  const modelAnswer = model.ok ? humanizeCoreFallback(formatLunarisAnswer(model.answer)) : localAnswer;

  return {
    intent,
    content: antiRepeat(modelAnswer, message, history),
    tools,
  };
}
