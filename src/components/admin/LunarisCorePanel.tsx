import { FormEvent, useEffect, useRef, useState } from "react";
import { Eraser, Loader2, Send, ShieldCheck, Sparkles, X } from "lucide-react";
import { sendToLunarisCore, type LunarisCoreMessage } from "@/lib/lunarisCore/client";
import { LunarisCoreMessage as MessageBubble } from "./LunarisCoreMessage";
import { LunarisCoreQuickActions } from "./LunarisCoreQuickActions";

const welcome: LunarisCoreMessage = {
  role: "core",
  content:
    "Lunaris Core online. I can analyze admin data, summarize orders/accounts/products/promos, explain code and deployment issues, research free public sources, and produce clean reports. No external AI server or API key is connected.",
};

export function LunarisCorePanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<LunarisCoreMessage[]>([welcome]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, open]);

  if (!open) return null;

  async function ask(value = input) {
    const text = value.trim();
    if (!text || loading) return;
    setInput("");
    setLoading(true);
    setMessages((current) => [...current, { role: "admin", content: text }]);
    try {
      const result = await sendToLunarisCore(text);
      setMessages((current) => [...current, { role: "core", content: result.content }]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: "core",
          content: `I hit a local Core error: ${error instanceof Error ? error.message : "Unknown error"}. Nothing was sent to an outside AI service.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void ask();
  }

  return (
    <div className="fixed inset-0 z-[90] bg-black/45 backdrop-blur-sm sm:bg-transparent">
      <section className="absolute bottom-4 right-4 flex h-[min(760px,calc(100vh-2rem))] w-[calc(100vw-2rem)] max-w-[520px] flex-col overflow-hidden rounded-[2rem] border border-purple-200/20 bg-[#070311]/95 text-white shadow-2xl shadow-purple-950/60">
        <div className="relative border-b border-purple-200/10 bg-gradient-to-r from-purple-950/80 via-[#120920] to-fuchsia-950/60 p-4">
          <div className="pointer-events-none absolute inset-0 opacity-50 [background-image:radial-gradient(circle,rgba(255,255,255,0.8)_1px,transparent_1.4px)] [background-size:38px_38px]" />
          <div className="relative flex items-start justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-emerald-100">
                <ShieldCheck className="h-3.5 w-3.5" />
                Admin only
              </div>
              <h2 className="mt-3 flex items-center gap-2 text-2xl font-black">
                <Sparkles className="h-5 w-5 text-purple-200" />
                Lunaris Core
              </h2>
              <p className="mt-1 text-sm text-purple-100/70">Private admin intelligence, data analysis, project search, and free research tools.</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/10 bg-white/5 p-2 text-purple-100 transition hover:bg-white/10"
              aria-label="Close Lunaris Core"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="border-b border-purple-200/10 p-3">
          <LunarisCoreQuickActions onPick={(value) => void ask(value)} disabled={loading} />
        </div>

        <div ref={scrollRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          {messages.map((message, index) => (
            <MessageBubble key={`${message.role}-${index}`} message={message} />
          ))}
          {loading && (
            <div className="flex items-center gap-2 rounded-full border border-purple-200/15 bg-white/[0.06] px-4 py-2 text-sm text-purple-100/75">
              <Loader2 className="h-4 w-4 animate-spin" />
              Core is checking tools...
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="border-t border-purple-200/10 bg-black/25 p-3">
          <div className="rounded-[1.5rem] border border-purple-200/20 bg-black/35 p-2 focus-within:border-purple-200/45">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void ask();
                }
              }}
              placeholder="Ask for analysis, reports, code help, research, orders, files..."
              className="h-20 w-full resize-none bg-transparent px-3 py-2 text-sm text-white outline-none placeholder:text-purple-100/45"
            />
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setMessages([welcome])}
                className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold text-purple-100/70 hover:bg-white/10 hover:text-white"
              >
                <Eraser className="h-3.5 w-3.5" />
                Clear
              </button>
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="inline-flex items-center gap-2 rounded-full bg-purple-200 px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send
              </button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}
