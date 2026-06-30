import { detectIntent } from "./intentDetector";
import { routeTool } from "./toolRouter";
import { responseEngine } from "./responseEngine";

export async function askLunarisCore(message: string) {
  const intent = detectIntent(message);
  const result = await routeTool(intent, message);
  return {
    intent,
    content: responseEngine({
      answer: result.answer,
      source: result.source,
      next: "Use another quick action or ask Lunaris Core a follow-up.",
    }),
  };
}
