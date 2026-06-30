import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Bot, Database, FileSearch, Loader2, MessageSquarePlus, Send, Sparkles, Trash2, X } from "lucide-react";
import {
  assistantAction,
  getAssistantStatus,
  sendAssistantMessage,
  type AssistantChatMessage,
} from "@/lib/assistantApi";
import { AssistantDiffViewer } from "./AssistantDiffViewer";
import { AssistantMessage } from "./AssistantMessage";

const DEFAULT_MODEL = "qwen2.5-coder:7b";

const quickActions = [
  ["Analyze admin panel", "/api/admin/assistant/analyze-project"],
  ["Analyze database", "/api/admin/assistant/analyze-database"],
  ["Scan orders/data", "/api/admin/assistant/search-data"],
  ["Scan ranks", "/api/admin/assistant/scan-ranks"],
  ["Scan keys", "/api/admin/assistant/scan-keys"],
  ["Scan bundles", "/api/admin/assistant/scan-bundles"],
  ["Scan logs", "/api/admin/assistant/scan-logs"],
] as const;

const promptCards = [
  "Why is this admin page not showing existing data?",
  "Scan my active ranks, keys, bundles, and promos.",
  "Check checkout bugs and explain the files involved.",
  "Show recent admin actions and failed deliveries.",
];

export function AssistantChatPanel({ open, onClose, currentPage }: { open: boolean; onClose: () => void; currentPage: string }) {
  const [messages, setMessages] = useState<AssistantChatMessage[]>([
    {
      role: "assistant",
      content:
        "I am your private Lunaris admin assistant. Ask me about orders, players, promos, products, Supabase, checkout bugs, or website code.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"checking" | "online" | "offline">("checking");
  const [diff, setDiff] = useState<string | undefined>();
  const [conversationId, setConversationId] = useState<string | undefined>();
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setStatus("checking");
    void getAssistantStatus().then((result) => {
      setStatus(result.ok && result.data.ollama ? "online" : "offline");
    });
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, diff]);

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    const text = input.trim();
    if (!text) return;
    setMessages((current) => [...current, { role: "user", content: text }]);
    setInput("");
    setLoading(true);
    const result = await sendAssistantMessage({
      message: text,
      model: DEFAULT_MODEL,
      conversationId,
      context: { currentPage },
    });
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
      model: DEFAULT_MODEL,
    });
    setLoading(false);
    if (!result.ok) {
      setMessages((current) => [...current, { role: "assistant", content: result.error }]);
      return;
    }
    const body = result.data.summary || result.data.output || JSON.stringify(result.data.rows ?? result.data, null, 2);
    setMessages((current) => [...current, { role: "assistant", content: body }]);
  }

  function newChat() {
    setMessages([
      {
        role: "assistant",
        content: "New chat ready. What are we fixing or checking in Lunaris?",
      },
    ]);
    setDiff(undefined);
    setConversationId(undefined);
    setInput("");
  }

  if (!open) return null;

  const statusCopy =
    status === "online" ? "Online" : status === "offline" ? "Assistant backend offline." : "Checking backend...";

  return (
    <div className="fixed inset-0 z-[90] bg-black/55 backdrop-blur-md md:bg-black/30">
      <aside className="ml-auto flex h-full w-full max-w-3xl flex-col overflow-hidden border-l border-purple-200/20 bg-[#080414]/95 text-white shadow-2xl shadow-purple-950/70">
        <header className="relative overflow-hidden border-b border-purple-200/15 p-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(199,168,255,0.24),transparent_32%),radial-gradient(circle_at_90%_20%,rgba(120,90,255,0.2),transparent_30%)]" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl border border-purple-200/30 bg-purple-200/15 shadow-[0_0_30px_rgba(190,160,255,0.25)]">
                <Bot className="h-6 w-6 text-purple-100" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-black tracking-tight">Lunaris Assistant</h2>
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                      status === "online"
                        ? "bg-emerald-400/15 text-emerald-100"
                        : status === "offline"
                          ? "bg-red-400/15 text-red-100"
                          : "bg-purple-300/15 text-purple-100"
                    }`}
                  >
                    {statusCopy}
                  </span>
                </div>
                <p className="mt-1 text-sm text-purple-100/70">
                  Private admin helper for your website, database, products, players, and orders.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={newChat} className="rounded-full border border-white/10 p-2 hover:bg-white/10" aria-label="New chat">
                <MessageSquarePlus className="h-5 w-5" />
              </button>
              <button onClick={onClose} className="rounded-full border border-white/10 p-2 hover:bg-white/10" aria-label="Close assistant">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        <div className="border-b border-purple-200/10 p-4">
          <div className="mb-3 grid gap-2 sm:grid-cols-2">
            {promptCards.map((prompt) => (
              <button
                key={prompt}
                onClick={() => setInput(prompt)}
                className="rounded-2xl border border-purple-200/15 bg-white/[0.04] p-3 text-left text-sm text-purple-50 transition hover:border-purple-200/35 hover:bg-purple-200/10"
              >
                {prompt}
              </button>
            ))}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {quickActions.map(([label, path]) => (
              <button
                key={label}
                onClick={() => runQuickAction(label, path)}
                className="shrink-0 rounded-full border border-purple-300/20 bg-purple-300/10 px-3 py-2 text-xs font-bold text-purple-50 hover:bg-purple-300/20"
              >
                {label}
              </button>
            ))}
            <button
              onClick={() => setInput("Search files for ")}
              className="shrink-0 rounded-full border border-purple-300/20 bg-purple-300/10 px-3 py-2 text-xs font-bold text-purple-50 hover:bg-purple-300/20"
            >
              <FileSearch className="mr-1 inline h-3 w-3" />
              Search files
            </button>
            <button
              onClick={() => setInput(`Explain this admin page: ${currentPage}`)}
              className="shrink-0 rounded-full border border-purple-300/20 bg-purple-300/10 px-3 py-2 text-xs font-bold text-purple-50 hover:bg-purple-300/20"
            >
              <Database className="mr-1 inline h-3 w-3" />
              Explain page
            </button>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 space-y-5 overflow-auto p-5">
          {messages.map((message, index) => (
            <AssistantMessage key={`${message.role}-${index}`} message={message} />
          ))}
          {loading && (
            <div className="flex items-center gap-3 rounded-3xl border border-purple-200/15 bg-purple-200/10 px-4 py-3 text-sm text-purple-100">
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking Lunaris data...
            </div>
          )}
          <AssistantDiffViewer diff={diff} />
        </div>

        <form onSubmit={submit} className="border-t border-purple-200/15 bg-black/20 p-4">
          <div className="mb-3 flex justify-between">
            <p className="flex items-center gap-2 text-xs text-purple-100/55">
              <Sparkles className="h-3 w-3" />
              Private admin chat. Secrets stay hidden.
            </p>
            <button
              type="button"
              onClick={newChat}
              className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs font-bold text-purple-100 hover:bg-white/10"
            >
              <Trash2 className="h-3 w-3" />
              Clear
            </button>
          </div>
          <div className="flex items-end gap-2 rounded-[1.7rem] border border-purple-200/25 bg-black/45 p-2 shadow-inner">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void submit();
                }
              }}
              rows={1}
              placeholder="Message Lunaris Assistant..."
              className="max-h-32 min-h-11 min-w-0 flex-1 resize-none bg-transparent px-3 py-3 text-sm text-white outline-none placeholder:text-purple-200/45"
            />
            <button
              type="submit"
              disabled={!canSend}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-purple-200 text-slate-950 transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}
