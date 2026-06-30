import { chatWithOllama } from "./ollama.js";
import { classifyRequest } from "./planner.js";
import { systemPrompt } from "./prompts.js";
import { runTool } from "./tools.js";
import { ensureConversation, storeMessage } from "./memory.js";
import { redactSecrets } from "./safety.js";

export async function handleChat(input: { adminId: string; message: string; model?: string; conversationId?: string }) {
  const conversationId = await ensureConversation(input.adminId, input.conversationId);
  const kind = classifyRequest(input.message);
  const toolsUsed: string[] = [];
  let context = "";

  if (["file search", "code question", "deployment/build error", "UI/design request", "proposed edit"].includes(kind)) {
    const rows = await runTool("search_project", { query: input.message });
    toolsUsed.push("search_project");
    context += `\nRelevant project snippets:\n${JSON.stringify(rows).slice(0, 12000)}`;
  }
  if (["database question", "admin data question", "ranks/keys/bundles scan"].includes(kind)) {
    const rows = await runTool(kind === "ranks/keys/bundles scan" ? "analyze_database" : "search_database", { query: input.message });
    toolsUsed.push(kind === "ranks/keys/bundles scan" ? "analyze_database" : "search_database");
    context += `\nRelevant database data:\n${JSON.stringify(rows).slice(0, 12000)}`;
  }

  await storeMessage(conversationId, "user", input.message, { kind });
  const content = await chatWithOllama(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Request type: ${kind}\n${context}\n\nAdmin question:\n${input.message}` },
    ],
    input.model,
  );
  const safeContent = redactSecrets(content);
  await storeMessage(conversationId, "assistant", safeContent, { toolsUsed });
  return { conversationId, message: { role: "assistant" as const, content: safeContent }, toolsUsed };
}
