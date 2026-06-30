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
