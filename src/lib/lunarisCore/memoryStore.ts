import type { LunarisCoreMessage } from "./client";

const memoryKey = "lunaris-core-admin-notes-v1";

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
    adminFacts.length ? `Important admin preferences, facts, and requests:\n${adminFacts.join("\n")}` : "",
    coreDecisions.length ? `Important previous Core answers and decisions:\n${coreDecisions.join("\n")}` : "",
    recent.length ? `Recent conversation window:\n${recent.join("\n")}` : "",
  ]
    .filter(Boolean)
    .join("\n\n")
    .slice(0, 18_000);
}
