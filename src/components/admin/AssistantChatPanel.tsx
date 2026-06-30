import { FormEvent, useEffect, useMemo, useState } from "react";
import { Bot, Database, FileSearch, Loader2, Send, Sparkles, Trash2, X } from "lucide-react";
import {
  assistantAction,
  getAssistantModels,
  getAssistantStatus,
  sendAssistantMessage,
  type AssistantChatMessage,
  type AssistantModel,
} from "@/lib/assistantApi";
import { AssistantDiffViewer } from "./AssistantDiffViewer";
import { AssistantMessage } from "./AssistantMessage";
import { AssistantSettings } from "./AssistantSettings";

const quickActions = [
  ["Analyze Project", "/api/admin/assistant/analyze-project"],
  ["Analyze Database", "/api/admin/assistant/analyze-database"],
  ["Scan Website Data", "/api/admin/assistant/search-data"],
  ["Scan Ranks", "/api/admin/assistant/scan-ranks"],
  ["Scan Crates", "/api/admin/assistant/scan-crates"],
  ["Scan Keys", "/api/admin/assistant/scan-keys"],
  ["Scan Bundles", "/api/admin/assistant/scan-bundles"],
  ["Scan Admin Logs", "/api/admin/assistant/scan-logs"],
] as const;

export function AssistantChatPanel({ open, onClose, currentPage }: { open: boolean; onClose: () => void; currentPage: string }) {
  const [messages, setMessages] = useState<AssistantChatMessage[]>([
    {
      role: "assistant",
      content:
        "Private Lunaris assistant ready. I can scan your admin data, project files, Supabase tables, logs, and propose safe fixes after you approve them.",
    },
  ]);
  const [models, setModels] = useState<AssistantModel[]>([]);
  const [model, setModel] = useState("qwen2.5-coder:7b");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("Checking assistant backend...");
  const [diff, setDiff] = useState<string | undefined>();
  const [conversationId, setConversationId] = useState<string | undefined>();

  useEffect(() => {
    if (!open) return;
    void getAssistantStatus().then((result) => {
      setStatus(result.ok && result.data.ollama ? `Online: ${result.data.model}` : "Assistant backend offline.");
    });
    void getAssistantModels().then((result) => {
      if (result.ok) setModels(result.data.models);
    });
  }, [open]);

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    const text = input.trim();
    if (!text) return;
    const userMessage: AssistantChatMessage = { role: "user", content: text };
    setMessages((current) => [...current, userMessage]);
    setInput("");
    setLoading(true);
    const result = await sendAssistantMessage({ message: text, model, conversationId, context: { currentPage } });
    setLoading(false);
    if (!result.ok) {
      setMessages((current) => [...current, { role: "assistant", content: result.error }]);
      return;
    }
    setConversationId(result.data.conversationId ?? conversationId);
    setDiff(result.data.proposedDiff);
    setMessages((current) => [...current, result.data.message]);
  }

  async function runQuickAction(label: string, path: string) {
    setLoading(true);
    setMessages((current) => [...current, { role: "user", content: label }]);
    const result = await assistantAction<{ summary?: string; rows?: unknown[]; output?: string; error?: string }>(path, {
      currentPage,
      model,
    });
    setLoading(false);
    if (!result.ok) {
      setMessages((current) => [...current, { role: "assistant", content: result.error }]);
      return;
    }
    const body = result.data.summary || result.data.output || JSON.stringify(result.data.rows ?? result.data, null, 2);
    setMessages((current) => [...current, { role: "assistant", content: body }]);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm md:bg-transparent">
      <aside className="ml-auto flex h-full w-full max-w-2xl flex-col border-l border-purple-300/20 bg-[#080414]/95 text-white shadow-2xl shadow-purple-950/70">
        <header className="flex items-center justify-between border-b border-purple-300/15 p-4">
          <div>
            <div className="flex items-center gap-2 text-lg font-black">
              <Bot className="h-5 w-5 text-purple-200" />
              Lunaris AI Assistant
            </div>
            <p className="text-xs text-purple-200/75">{status}</p>
          </div>
          <button onClick={onClose} className="rounded-full border border-white/10 p-2 hover:bg-white/10" aria-label="Close assistant">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="grid gap-3 border-b border-purple-300/10 p-4">
          <AssistantSettings model={model} models={models} onModelChange={setModel} />
          <div className="flex flex-wrap gap-2">
            {quickActions.map(([label, path]) => (
              <button
                key={label}
                onClick={() => runQuickAction(label, path)}
                className="rounded-full border border-purple-300/20 bg-purple-300/10 px-3 py-2 text-xs font-bold text-purple-50 hover:bg-purple-300/20"
              >
                {label}
              </button>
            ))}
            <button
              onClick={() => setInput(`Search files for: `)}
              className="rounded-full border border-purple-300/20 bg-purple-300/10 px-3 py-2 text-xs font-bold text-purple-50 hover:bg-purple-300/20"
            >
              <FileSearch className="mr-1 inline h-3 w-3" />
              Search Files
            </button>
            <button
              onClick={() => setInput(`Explain the current admin page: ${currentPage}`)}
              className="rounded-full border border-purple-300/20 bg-purple-300/10 px-3 py-2 text-xs font-bold text-purple-50 hover:bg-purple-300/20"
            >
              <Database className="mr-1 inline h-3 w-3" />
              Explain Current Page
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-auto p-4">
          {messages.map((message, index) => (
            <AssistantMessage key={`${message.role}-${index}`} message={message} />
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-purple-200">
              <Loader2 className="h-4 w-4 animate-spin" />
              Thinking and scanning safely...
            </div>
          )}
          <AssistantDiffViewer diff={diff} />
        </div>

        <form onSubmit={submit} className="border-t border-purple-300/15 p-4">
          <div className="mb-3 flex justify-between">
            <button
              type="button"
              onClick={() => {
                setMessages([]);
                setDiff(undefined);
                setConversationId(undefined);
              }}
              className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs font-bold text-purple-100 hover:bg-white/10"
            >
              <Trash2 className="h-3 w-3" />
              Clear chat
            </button>
          </div>
          <div className="flex gap-2 rounded-3xl border border-purple-300/25 bg-black/40 p-2">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about code, Supabase, ranks, bundles, logs, bugs..."
              className="min-w-0 flex-1 bg-transparent px-3 text-sm text-white outline-none placeholder:text-purple-200/50"
            />
            <button
              type="submit"
              disabled={!canSend}
              className="grid h-11 w-11 place-items-center rounded-full bg-purple-200 text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
          <p className="mt-2 flex items-center gap-1 text-[11px] text-purple-200/60">
            <Sparkles className="h-3 w-3" />
            No secrets are shown. Edits and commands require approval on the assistant server.
          </p>
        </form>
      </aside>
    </div>
  );
}
