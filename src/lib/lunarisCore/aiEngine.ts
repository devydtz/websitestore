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
import { searchTool } from "./tools/searchTool";

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

function localGeneralFallback(message: string) {
  const clean = message.trim();
  if (!clean) return "I am here. Send me what you want to build, fix, check, or ask.";
  if (clean.length <= 24) return `I got you. For "${clean}", tell me the exact part you want handled and I will lock onto it.`;
  return `I got you. Here is how I would handle it: ${clean}`;
}

function isQuestionLike(message: string) {
  return /\?|\b(what|why|how|when|where|who|which|can|does|do|is|are|latest|current|meaning|define|explain|compare)\b/i.test(message);
}

function isWebSearchFriendlyIntent(intent: LunarisIntent) {
  return ["knowledge_question", "coding_knowledge", "minecraft_knowledge", "security_knowledge", "general_question", "web_research"].includes(intent);
}

function soundsUncertain(answer: string) {
  return [
    "did not find a matching lunaris-specific knowledge note",
    "do not have enough information",
    "did not clearly match",
    "ask a more specific follow-up",
    "tell me the exact part",
  ].some((phrase) => answer.toLowerCase().includes(phrase));
}

function antiRepeat(answer: string, message: string, history: NonNullable<LunarisCoreRequestContext["history"]>) {
  const previous = recentCoreAnswers(history);
  const requestedNoRepeat = /\b(don'?t|do not|stop|never)\s+(repeat|copy|say the same|loop)\b/i.test(message);
  if (!previous.some((old) => isTooSimilar(answer, old))) return answer;
  if (requestedNoRepeat) return "Got it. I will stop repeating that and answer fresh from here.";
  return answer;
}

function sourceForIntent(intent: LunarisIntent, message: string, rawSource: string) {
  if (rawSource && rawSource !== "intentDetector") return rawSource;
  switch (intent) {
    case "data_analysis":
    case "database_question":
    case "admin_data_question":
    case "order_investigator":
    case "player_investigator":
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
    case "core_health":
      return "Lunaris Core health checker.";
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
    case "order_investigator":
    case "player_investigator":
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
  const hasImages = attachments.some((file) => file.kind === "image");
  const history = context.history || [];
  const pinnedNotes = loadPinnedCoreNotes();
  const attachmentSummaries = attachments.map((file) => `${file.name} (${file.kind}, ${file.type || "unknown"}, ${file.size} bytes)`);
  const conversationMemory = buildConversationMemory(history);
  const memoryContext = pinnedNotes.length
    ? [`Saved admin preferences:`, ...pinnedNotes.slice(0, 25).map((note) => `- ${note}`), "", conversationMemory].join("\n")
    : conversationMemory;
  const enrichedMessage = appendAttachmentContext([message, memoryContext ? `\nMemory context:\n${memoryContext}` : ""].join("\n"), attachmentSummaries);
  const plan = planLunarisCoreTask(enrichedMessage, attachments);
  let intent = detectIntent(message);
  if (hasImages && (intent === "data_analysis" || /^analy[sz]e( these)? uploaded files\.?$/i.test(message.trim()))) {
    intent = "general_question";
  }
  const toolMessage = appendAttachmentContext(message, attachmentSummaries);
  const result = await routeTool(intent, toolMessage);
  const source = sourceForIntent(intent, message, result.source);
  const next = nextForIntent(intent);
  const imageResult = hasImages ? await imageReaderTool(attachments, message) : null;
  const attachmentContext = attachments.length
    ? [fileReaderTool(attachments), imageResult?.answer].filter(Boolean).join("\n\n")
    : "";
  const localAnswer = humanizeCoreFallback(formatLunarisAnswer(responseEngine({
    answer: result.answer,
    source,
    next,
  }) + (attachmentContext ? `\n\nUploaded file context:\n${attachmentContext}` : "")));
  const tools = [...plan.tools, ...(result.tools || []), ...(imageResult?.tools || [])];

  if (!attachments.length && isWebSearchFriendlyIntent(intent) && isQuestionLike(message) && soundsUncertain(localAnswer)) {
    const researched = await searchTool(message);
    const researchedAnswer = humanizeCoreFallback(formatLunarisAnswer(responseEngine({
      answer: researched,
      source: "Free public research sources: DuckDuckGo Instant Answer, Wikipedia, Modrinth, GitHub, and direct public search links.",
      next: "Open the most relevant link or ask me to narrow the search.",
    })));
    return {
      intent: "web_research",
      content: antiRepeat(researchedAnswer, message, history),
      tools: [...tools, { name: "Web Research", status: "done", summary: "Core fell back to public web research because local knowledge was not enough." }],
    };
  }

  if (attachments.length) {
    return {
      intent,
      content: antiRepeat(localAnswer, message, history),
      generatedImages: result.generatedImages,
      tools,
    };
  }

  if (intent === "minecraft_server_status" || intent === "minecraft_command" || intent === "web_research" || intent === "memory_preference" || intent === "image_generation" || intent === "core_health" || intent === "order_investigator" || intent === "player_investigator") {
    return {
      intent,
      content: antiRepeat(localAnswer, message, history),
      generatedImages: result.generatedImages,
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
  if (!model.ok && !attachments.length && isWebSearchFriendlyIntent(intent) && isQuestionLike(message)) {
    const researched = await searchTool(message);
    const researchedAnswer = humanizeCoreFallback(formatLunarisAnswer(responseEngine({
      answer: researched,
      source: "Free public research sources: DuckDuckGo Instant Answer, Wikipedia, Modrinth, GitHub, and direct public search links.",
      next: "Open the most relevant link or ask me to narrow the search.",
    })));
    return {
      intent: "web_research",
      content: antiRepeat(researchedAnswer, message, history),
      tools: [...tools, { name: "Web Research", status: "done", summary: "Core used the web-research fallback because the model/backend answer was unavailable." }],
    };
  }

  const modelAnswer = model.ok ? humanizeCoreFallback(formatLunarisAnswer(model.answer)) : intent === "general_question" ? localGeneralFallback(message) : localAnswer;

  return {
    intent,
    content: antiRepeat(modelAnswer, message, history),
    generatedImages: result.generatedImages,
    tools,
  };
}
