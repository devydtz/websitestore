import { safeText } from "./safety";

function cleanSection(value: string) {
  return safeText(value).trim();
}

export function responseEngine(input: { answer: string; source: string; next?: string }) {
  const answer = cleanSection(input.answer);
  const source = cleanSection(input.source || "Lunaris Core knowledge system");
  const next = cleanSection(input.next || "Ask a follow-up with the exact page, file, table, error, or data you want checked.");

  return [`Answer:\n${answer}`, `Source used:\n${source}`, `Next step:\n${next}`].join("\n\n");
}
