import { supabaseClient } from "@/lib/supabaseClient";

const assistantApiUrl = (import.meta.env.VITE_ASSISTANT_API_URL as string | undefined) ?? "http://localhost:8789";

export type AssistantModel = {
  name: string;
  installed?: boolean;
};

export type AssistantChatMessage = {
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  metadata?: Record<string, unknown>;
};

export type AssistantChatResponse = {
  message: AssistantChatMessage;
  conversationId?: string;
  toolsUsed?: string[];
  proposedDiff?: string;
  error?: string;
};

async function adminHeaders() {
  const { data } = await supabaseClient.auth.getSession();
  const token = data.session?.access_token;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T>(path: string, init?: RequestInit): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    const response = await fetch(`${assistantApiUrl}${path}`, {
      ...init,
      headers: {
        ...(await adminHeaders()),
        ...(init?.headers ?? {}),
      },
    });
    const data = (await response.json().catch(() => null)) as T | { error?: string } | null;
    if (!response.ok) {
      return { ok: false, error: (data as { error?: string } | null)?.error || "Assistant backend offline." };
    }
    return { ok: true, data: data as T };
  } catch {
    return { ok: false, error: "Assistant backend offline." };
  }
}

export function getAssistantStatus() {
  return request<{ ok: boolean; ollama: boolean; model: string }>("/api/admin/assistant/status");
}

export function getAssistantModels() {
  return request<{ models: AssistantModel[] }>("/api/admin/assistant/models");
}

export function sendAssistantMessage(input: {
  message: string;
  model: string;
  conversationId?: string;
  context?: Record<string, unknown>;
}) {
  return request<AssistantChatResponse>("/api/admin/assistant/chat", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function assistantAction<T>(path: string, body: Record<string, unknown> = {}) {
  return request<T>(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function getAssistantGitStatus() {
  return request<{ output: string }>("/api/admin/assistant/git-status");
}

export function getAssistantGitDiff() {
  return request<{ output: string }>("/api/admin/assistant/git-diff");
}
