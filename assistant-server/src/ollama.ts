export type OllamaMessage = { role: "system" | "user" | "assistant"; content: string };

export const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
export const defaultModel = process.env.OLLAMA_MODEL || "qwen2.5-coder:7b";

export async function listModels() {
  const response = await fetch(`${ollamaBaseUrl}/api/tags`);
  if (!response.ok) throw new Error("Assistant backend offline.");
  const data = (await response.json()) as { models?: Array<{ name: string }> };
  return data.models ?? [];
}

export async function isOllamaOnline() {
  try {
    await listModels();
    return true;
  } catch {
    return false;
  }
}

export async function chatWithOllama(messages: OllamaMessage[], model = defaultModel) {
  const response = await fetch(`${ollamaBaseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, stream: false }),
  });
  if (!response.ok) throw new Error("Assistant backend offline.");
  const data = (await response.json()) as { message?: { content?: string } };
  return data.message?.content || "I could not generate a response.";
}
