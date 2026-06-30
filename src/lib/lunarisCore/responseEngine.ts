import { formatToolAnswer, safeText } from "./safety";

export function responseEngine(input: { answer: string; source: string; next?: string }) {
  return formatToolAnswer(safeText(input.answer), input.source, input.next);
}
