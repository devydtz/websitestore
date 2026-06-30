import { safeText } from "./safety";

export function responseEngine(input: { answer: string; source: string; next?: string }) {
  return safeText(input.answer);
}
