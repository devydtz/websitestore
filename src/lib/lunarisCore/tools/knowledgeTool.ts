export async function knowledgeTool(message: string) {
  const { answerFromKnowledge, fullKnowledgeSummary } = await import("../knowledgeBase");

  if (/\b(all knowledge|everything|what do you know|knowledge base|world knowledge)\b/i.test(message)) {
    return fullKnowledgeSummary();
  }

  return answerFromKnowledge(message);
}
