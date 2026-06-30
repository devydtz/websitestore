import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Bot, ChevronDown, Database, Expand, FileSearch, Loader2, MessageSquarePlus, Send, Sparkles, X } from "lucide-react";
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

  const isStarter = messages.length <= 1 && !loading && !diff;

  return (
    <div className="fixed bottom-24 right-4 z-[90] w-[calc(100vw-2rem)] max-w-[540px] md:right-6">
      <aside className="flex h-[min(760px,calc(100vh-7rem))] flex-col overflow-hidden rounded-[2rem] border border-purple-200/25 bg-[#fbfaff] text-slate-950 shadow-[0_24px_90px_rgba(20,8,48,0.45)]">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white/95 px-5 py-4">
          <button onClick={newChat} className="inline-flex items-center gap-2 text-base font-black">
            New conversation
            <ChevronDown className="h-4 w-4 text-slate-500" />
          </button>
          <div className="flex items-center gap-2 text-slate-500">
            <button onClick={newChat} className="rounded-full p-2 hover:bg-slate-100" aria-label="New chat">
              <MessageSquarePlus className="h-4 w-4" />
            </button>
            <button className="rounded-full p-2 hover:bg-slate-100" aria-label="Expand assistant">
              <Expand className="h-4 w-4" />
            </button>
            <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-100" aria-label="Close assistant">
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="border-b border-slate-200 bg-[radial-gradient(circle,rgba(118,87,255,0.1)_1px,transparent_1.5px)] bg-[length:18px_18px] px-5 py-4">
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <span className="font-semibold">Need more help?</span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                status === "online"
                  ? "bg-emerald-50 text-emerald-700"
                  : status === "offline"
                    ? "bg-red-50 text-red-700"
                    : "bg-purple-50 text-purple-700"
              }`}
            >
              {statusCopy}
            </span>
          </div>

          {isStarter && (
            <div className="py-8 text-center">
              <div className="mx-auto mb-5 flex h-28 w-44 items-center justify-center">
                <div className="h-16 w-16 translate-x-7 rounded-full bg-orange-300 blur-[1px]" />
                <div className="h-20 w-20 rounded-full bg-orange-200 blur-[1px]" />
                <div className="h-24 w-24 -translate-x-5 rounded-full bg-gradient-to-br from-orange-100 to-orange-400 blur-[1px]" />
              </div>
              <h3 className="text-2xl font-black">Good morning.</h3>
              <p className="mt-1 text-slate-500">What are we doing today?</p>
              <div className="mx-auto mt-7 grid max-w-sm gap-2 text-left">
                {promptCards.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => setInput(prompt)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-purple-300 hover:bg-purple-50"
                  >
                    <Sparkles className="mr-3 inline h-4 w-4 text-purple-500" />
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 overflow-x-auto pb-1">
            {quickActions.map(([label, path]) => (
              <button
                key={label}
                onClick={() => runQuickAction(label, path)}
                className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-purple-50"
              >
                {label}
              </button>
            ))}
            <button
              onClick={() => setInput("Search files for ")}
              className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-purple-50"
            >
              <FileSearch className="mr-1 inline h-3 w-3" />
              Search files
            </button>
            <button
              onClick={() => setInput(`Explain this admin page: ${currentPage}`)}
              className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-purple-50"
            >
              <Database className="mr-1 inline h-3 w-3" />
              Explain page
            </button>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 space-y-5 overflow-auto bg-[radial-gradient(circle,rgba(118,87,255,0.08)_1px,transparent_1.5px)] bg-[length:18px_18px] p-5">
          {messages.map((message, index) => (
            <AssistantMessage key={`${message.role}-${index}`} message={message} />
          ))}
          {loading && (
            <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking Lunaris data...
            </div>
          )}
          <AssistantDiffViewer diff={diff} />
        </div>

        <form onSubmit={submit} className="border-t border-slate-200 bg-white p-4">
          <div className="flex min-h-28 items-end gap-2 rounded-[1.5rem] border border-blue-300 bg-white p-3 shadow-[0_0_0_2px_rgba(96,165,250,0.12)]">
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
              placeholder="What can we help you with?"
              className="max-h-32 min-h-16 min-w-0 flex-1 resize-none bg-transparent px-1 py-2 text-base text-slate-900 outline-none placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={!canSend}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blue-200 text-white transition hover:scale-105 enabled:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}
