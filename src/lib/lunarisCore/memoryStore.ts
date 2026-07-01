import type { LunarisCoreMessage } from "./client";

const memoryKey = "lunaris-core-admin-notes-v1";
const learnedMemoryKey = "lunaris-core-learned-memory-v1";

export type LunarisLearnedMemory = {
  preferences: string[];
  projectFacts: string[];
  activeProblems: string[];
  codingContext: string[];
  minecraftContext: string[];
  adminDataContext: string[];
  decisions: string[];
  updatedAt: string;
};

const emptyLearnedMemory = (): LunarisLearnedMemory => ({
  preferences: [],
  projectFacts: [],
  activeProblems: [],
  codingContext: [],
  minecraftContext: [],
  adminDataContext: [],
  decisions: [],
  updatedAt: new Date().toISOString(),
});

export function loadPinnedCoreNotes(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(memoryKey) || "[]");
    return Array.isArray(parsed) ? parsed.map(String).slice(0, 50) : [];
  } catch {
    return [];
  }
}

export function savePinnedCoreNote(note: string) {
  if (typeof window === "undefined") return;
  const notes = [note, ...loadPinnedCoreNotes()].filter(Boolean).slice(0, 50);
  window.localStorage.setItem(memoryKey, JSON.stringify(notes));
}

export function loadLearnedCoreMemory(): LunarisLearnedMemory {
  if (typeof window === "undefined") return emptyLearnedMemory();
  try {
    const parsed = JSON.parse(window.localStorage.getItem(learnedMemoryKey) || "null") as Partial<LunarisLearnedMemory> | null;
    if (!parsed || typeof parsed !== "object") return emptyLearnedMemory();
    return {
      preferences: Array.isArray(parsed.preferences) ? parsed.preferences.map(String).slice(0, 80) : [],
      projectFacts: Array.isArray(parsed.projectFacts) ? parsed.projectFacts.map(String).slice(0, 120) : [],
      activeProblems: Array.isArray(parsed.activeProblems) ? parsed.activeProblems.map(String).slice(0, 120) : [],
      codingContext: Array.isArray(parsed.codingContext) ? parsed.codingContext.map(String).slice(0, 120) : [],
      minecraftContext: Array.isArray(parsed.minecraftContext) ? parsed.minecraftContext.map(String).slice(0, 120) : [],
      adminDataContext: Array.isArray(parsed.adminDataContext) ? parsed.adminDataContext.map(String).slice(0, 120) : [],
      decisions: Array.isArray(parsed.decisions) ? parsed.decisions.map(String).slice(0, 120) : [],
      updatedAt: String(parsed.updatedAt || new Date().toISOString()),
    };
  } catch {
    return emptyLearnedMemory();
  }
}

function remember(list: string[], value: string, limit: number) {
  const clean = compactLine(value, 280);
  if (!clean || clean.length < 4) return list.slice(0, limit);
  const normalizedClean = clean.toLowerCase();
  const withoutDuplicate = list.filter((item) => item.toLowerCase() !== normalizedClean);
  return [clean, ...withoutDuplicate].slice(0, limit);
}

function collectMemoryLines(message: string, answer: string) {
  const text = `${message}\n${answer}`;
  const lines = text
    .split(/\n|(?<=[.!?])\s+/)
    .map((line) => compactLine(line, 280))
    .filter((line) => line.length > 8);

  return {
    preferences: lines.filter((line) => /\b(don'?t|dont|do not|never|always|prefer|call me|my name is|from now on|i want|make it|style|tone|answer|response)\b/i.test(line)),
    projectFacts: lines.filter((line) => /\b(lunaris|website|admin panel|cloudflare|supabase|github|repo|domain|mclunaris|pages|vite|react|typescript)\b/i.test(line)),
    activeProblems: lines.filter((line) => /\b(error|crash|bug|broken|failed|not working|fix|issue|problem|timeout|blank|white screen)\b/i.test(line)),
    codingContext: lines.filter((line) => /\b(code|coding|file|component|function|typescript|react|vite|build|deploy|commit|push|route|api|sql|migration)\b/i.test(line)),
    minecraftContext: lines.filter((line) => /\b(minecraft|server|rcon|players|online|rank|crate|key|bundle|command|luckperms|lp |port|lunaris\\.ultraga\\.me)\b/i.test(line)),
    adminDataContext: lines.filter((line) => /\b(order|checkout|account|password|email|promo|gcash|request|admin log|database|table|row|supabase)\b/i.test(line)),
    decisions: lines.filter((line) => /\b(done|fixed|changed|pushed|deployed|decided|removed|added|updated|now uses|correct)\b/i.test(line)),
  };
}

export function learnFromCoreExchange(adminMessage: string, coreAnswer: string) {
  if (typeof window === "undefined") return;
  const current = loadLearnedCoreMemory();
  const learned = collectMemoryLines(adminMessage, coreAnswer);
  const next: LunarisLearnedMemory = {
    preferences: learned.preferences.reduce((list, line) => remember(list, line, 80), current.preferences),
    projectFacts: learned.projectFacts.reduce((list, line) => remember(list, line, 120), current.projectFacts),
    activeProblems: learned.activeProblems.reduce((list, line) => remember(list, line, 120), current.activeProblems),
    codingContext: learned.codingContext.reduce((list, line) => remember(list, line, 120), current.codingContext),
    minecraftContext: learned.minecraftContext.reduce((list, line) => remember(list, line, 120), current.minecraftContext),
    adminDataContext: learned.adminDataContext.reduce((list, line) => remember(list, line, 120), current.adminDataContext),
    decisions: learned.decisions.reduce((list, line) => remember(list, line, 120), current.decisions),
    updatedAt: new Date().toISOString(),
  };
  window.localStorage.setItem(learnedMemoryKey, JSON.stringify(next));
}

export function summarizeLearnedCoreMemory(memory = loadLearnedCoreMemory()) {
  const section = (title: string, lines: string[], limit: number) =>
    lines.length ? `${title}:\n${lines.slice(0, limit).map((line) => `- ${line}`).join("\n")}` : "";

  return [
    section("Learned admin preferences", memory.preferences, 24),
    section("Learned Lunaris project facts", memory.projectFacts, 30),
    section("Active or repeated problems", memory.activeProblems, 30),
    section("Coding and repo context", memory.codingContext, 30),
    section("Minecraft/server context", memory.minecraftContext, 30),
    section("Admin/database/store context", memory.adminDataContext, 30),
    section("Previous decisions and completed changes", memory.decisions, 30),
  ]
    .filter(Boolean)
    .join("\n\n")
    .slice(0, 22_000);
}

export function summarizeRecentChat(messages: LunarisCoreMessage[]) {
  return messages
    .slice(-8)
    .map((message) => `${message.role}: ${message.content.slice(0, 240)}`)
    .join("\n");
}

function compactLine(value: string, max = 260) {
  const clean = value.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max)}...` : clean;
}

function looksImportant(content: string) {
  return /\b(remember|call me|my name is|don't|dont|do not|never|always|prefer|i want|fix|broken|crash|error|supabase|cloudflare|minecraft|rcon|server|checkout|admin|core|domain|port|rank|bundle|key|promo|password|email)\b/i.test(content);
}

export function buildConversationMemory(messages: LunarisCoreMessage[]) {
  const learnedMemory = summarizeLearnedCoreMemory();
  const useful = messages
    .filter((message) => message.content && message.content.trim() && message.content !== "Welcome back.")
    .map((message) => ({ ...message, content: compactLine(message.content) }));

  const adminFacts = useful
    .filter((message) => message.role === "admin" && looksImportant(message.content))
    .slice(-36)
    .map((message) => `- Admin said: ${message.content}`);

  const coreDecisions = useful
    .filter((message) => message.role === "core" && looksImportant(message.content))
    .slice(-18)
    .map((message) => `- Core answered: ${message.content}`);

  const recent = useful
    .slice(-24)
    .map((message) => `${message.role === "admin" ? "Admin" : "Core"}: ${message.content}`);

  return [
    learnedMemory ? `Permanent learned memory:\n${learnedMemory}` : "",
    adminFacts.length ? `Important admin preferences, facts, and requests:\n${adminFacts.join("\n")}` : "",
    coreDecisions.length ? `Important previous Core answers and decisions:\n${coreDecisions.join("\n")}` : "",
    recent.length ? `Recent conversation window:\n${recent.join("\n")}` : "",
  ]
    .filter(Boolean)
    .join("\n\n")
    .slice(0, 32_000);
}
