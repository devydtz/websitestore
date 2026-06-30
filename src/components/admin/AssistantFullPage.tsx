import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Bot, Database, FileSearch, Loader2, MessageSquarePlus, Send, Sparkles, Trash2 } from "lucide-react";
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
  "Fix my admin panel and explain what files control it.",
  "Scan my orders, accounts, promos, ranks, keys, and bundles.",
  "Check checkout bugs and explain the Supabase tables involved.",
  "Show recent admin actions and failed deliveries.",
];

export function AssistantFullPage() {
  const [messages, setMessages] = useState<AssistantChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"checking" | "online" | "offline">("checking");
  const [diff, setDiff] = useState<string | undefined>();
  const [conversationId, setConversationId] = useState<string | undefined>();
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    void getAssistantStatus().then((result) => {
      setStatus(result.ok && result.data.ollama ? "online" : "offline");
    });
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, diff]);

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);
  const isStarter = messages.length === 0 && !loading && !diff;
  const statusCopy = status === "online" ? "Assistant online" : status === "offline" ? "Assistant backend offline." : "Checking backend...";

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
      context: { currentPage: "/admin/assistant" },
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
    setMessages((current) => [...current, { role: "user", content: label }]);
    setLoading(true);
    const result = await assistantAction<{ summary?: string; rows?: unknown[]; output?: string; error?: string }>(path, {
      currentPage: "/admin/assistant",
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
    setMessages([]);
    setDiff(undefined);
    setConversationId(undefined);
    setInput("");
  }

  return (
    <div className="min-h-screen bg-[#070312] text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(180,145,255,0.32),transparent_38%),linear-gradient(180deg,#15113d_0%,#090414_52%,#04020b_100%)]" />
        <div className="absolute inset-0 opacity-50 [background-image:radial-gradient(circle,rgba(255,255,255,0.9)_1px,transparent_1.5px),radial-gradient(circle,rgba(205,188,255,0.8)_1px,transparent_1.3px)] [background-position:0_0,44px_65px] [background-size:120px_120px,190px_190px]" />
      </div>

      <div className="relative z-10 flex min-h-screen">
        <aside className="hidden w-80 shrink-0 border-r border-purple-200/15 bg-black/25 p-5 backdrop-blur-xl lg:flex lg:flex-col">
          <Link to="/admin/dashboard" className="mb-5 inline-flex items-center gap-2 rounded-full border border-purple-200/15 px-4 py-2 text-sm font-bold text-purple-100 hover:bg-white/10">
            <ArrowLeft className="h-4 w-4" />
            Back to admin
          </Link>
          <button onClick={newChat} className="mb-5 flex items-center justify-center gap-2 rounded-2xl bg-purple-200 px-4 py-3 font-black text-slate-950">
            <MessageSquarePlus className="h-4 w-4" />
            New chat
          </button>
          <div className="rounded-3xl border border-purple-200/15 bg-white/[0.04] p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-purple-200/15">
                <Bot className="h-6 w-6 text-purple-100" />
              </div>
              <div>
                <p className="font-black">Lunaris AI</p>
                <p className={`text-xs font-bold ${status === "online" ? "text-emerald-300" : status === "offline" ? "text-red-300" : "text-purple-200"}`}>
                  {statusCopy}
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-purple-100/70">
              Private admin assistant for website code, Supabase data, orders, products, promos, and debugging.
            </p>
          </div>
          <div className="mt-5 space-y-2">
            {quickActions.map(([label, path]) => (
              <button
                key={label}
                onClick={() => runQuickAction(label, path)}
                className="w-full rounded-2xl border border-purple-200/15 bg-white/[0.04] px-4 py-3 text-left text-sm font-bold text-purple-50 hover:bg-purple-200/10"
              >
                {label}
              </button>
            ))}
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-purple-200/15 bg-black/20 px-4 py-4 backdrop-blur-xl sm:px-6">
            <div>
              <h1 className="text-xl font-black sm:text-2xl">Lunaris Assistant</h1>
              <p className="text-sm text-purple-100/60">{statusCopy}</p>
            </div>
            <div className="flex gap-2">
              <Link to="/admin/dashboard" className="rounded-full border border-purple-200/15 px-4 py-2 text-sm font-bold text-purple-100 hover:bg-white/10">
                Admin
              </Link>
              <button onClick={newChat} className="rounded-full bg-purple-200 px-4 py-2 text-sm font-black text-slate-950">
                New
              </button>
            </div>
          </header>

          <div ref={scrollRef} className="flex-1 overflow-auto px-4 py-6 sm:px-6">
            <div className="mx-auto max-w-4xl space-y-6">
              {isStarter && (
                <div className="flex min-h-[58vh] flex-col items-center justify-center text-center">
                  <div className="mb-8 grid h-24 w-24 place-items-center rounded-[2rem] border border-purple-200/25 bg-purple-200/15 shadow-[0_0_70px_rgba(190,160,255,0.35)]">
                    <Bot className="h-11 w-11 text-purple-100" />
                  </div>
                  <h2 className="text-4xl font-black tracking-tight sm:text-5xl">What are we fixing?</h2>
                  <p className="mt-3 max-w-xl text-purple-100/65">
                    Ask about your admin panel, checkout, database, products, accounts, promos, Cloudflare errors, or code.
                  </p>
                  <div className="mt-8 grid w-full max-w-3xl gap-3 sm:grid-cols-2">
                    {promptCards.map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => setInput(prompt)}
                        className="rounded-3xl border border-purple-200/15 bg-white/[0.05] p-5 text-left font-bold text-purple-50 transition hover:border-purple-200/35 hover:bg-purple-200/10"
                      >
                        <Sparkles className="mb-3 h-5 w-5 text-purple-200" />
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((message, index) => (
                <AssistantMessage key={`${message.role}-${index}`} message={message} />
              ))}
              {loading && (
                <div className="inline-flex items-center gap-3 rounded-3xl border border-purple-200/15 bg-white/[0.05] px-4 py-3 text-sm text-purple-100">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Checking Lunaris data...
                </div>
              )}
              <AssistantDiffViewer diff={diff} />
            </div>
          </div>

          <form onSubmit={submit} className="border-t border-purple-200/15 bg-black/30 p-4 backdrop-blur-xl sm:p-5">
            <div className="mx-auto max-w-4xl">
              <div className="mb-3 flex gap-2 overflow-x-auto pb-1 lg:hidden">
                {quickActions.slice(0, 4).map(([label, path]) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => runQuickAction(label, path)}
                    className="shrink-0 rounded-full border border-purple-200/15 bg-white/[0.05] px-3 py-2 text-xs font-bold text-purple-50"
                  >
                    {label}
                  </button>
                ))}
                <button type="button" onClick={() => setInput("Search files for ")} className="shrink-0 rounded-full border border-purple-200/15 bg-white/[0.05] px-3 py-2 text-xs font-bold text-purple-50">
                  <FileSearch className="mr-1 inline h-3 w-3" />
                  Search files
                </button>
                <button type="button" onClick={() => setInput("Analyze database")} className="shrink-0 rounded-full border border-purple-200/15 bg-white/[0.05] px-3 py-2 text-xs font-bold text-purple-50">
                  <Database className="mr-1 inline h-3 w-3" />
                  Database
                </button>
              </div>
              <div className="flex items-end gap-3 rounded-[2rem] border border-purple-200/25 bg-white/[0.06] p-3 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
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
                  className="max-h-40 min-h-12 min-w-0 flex-1 resize-none bg-transparent px-3 py-3 text-sm text-white outline-none placeholder:text-purple-100/40"
                />
                <button
                  type="submit"
                  disabled={!canSend}
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-purple-200 text-slate-950 transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-purple-100/45">
                <span>Private admin assistant. Secrets stay hidden.</span>
                <button type="button" onClick={newChat} className="inline-flex items-center gap-1 hover:text-purple-100">
                  <Trash2 className="h-3 w-3" />
                  Clear
                </button>
              </div>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
