import { safeText } from "./safety";

export function formatLunarisAnswer(answer: string) {
  return safeText(answer).trim();
}

export function appendAttachmentContext(message: string, attachmentSummaries: string[]) {
  if (!attachmentSummaries.length) return message;
  return [
    message,
    "",
    "Uploaded context:",
    ...attachmentSummaries.map((item, index) => `${index + 1}. ${item}`),
  ].join("\n");
}
