import { answerFromKnowledge, fullKnowledgeSummary } from "../knowledgeBase";

export function knowledgeTool(message: string) {
  if (/\b(all knowledge|everything|what do you know|knowledge base|world knowledge)\b/i.test(message)) {
    return fullKnowledgeSummary();
  }

  return answerFromKnowledge(message);
}
