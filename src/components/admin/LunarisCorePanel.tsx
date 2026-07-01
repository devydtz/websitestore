import { FormEvent, useEffect, useRef, useState } from "react";
import { BrainCircuit, Eraser, Loader2, MessageSquarePlus, Send, ShieldCheck, Sparkles, X } from "lucide-react";
import { sendToLunarisCore, type LunarisCoreMessage, type LunarisCoreMode } from "@/lib/lunarisCore/client";
import { LunarisCoreMessage as MessageBubble } from "./LunarisCoreMessage";
import { LunarisCoreQuickActions } from "./LunarisCoreQuickActions";

type StoredChat = {
  id: string;
  title: string;
  mode: LunarisCoreMode;
  messages: LunarisCoreMessage[];
  updatedAt: string;
};

type CoreState = {
  chats: StoredChat[];
  activeId: string;
};

const storageKey = "lunaris-core-chat-memory-v3";

const welcome: LunarisCoreMessage = {
  role: "core",
  content:
    "I am here. Ask me about the store, admin panel, checkout bugs, Supabase data, Minecraft setup, code, reports, or anything you want to understand. I will use Lunaris knowledge first and stay honest when something is missing.",
};

const modes: Array<{ id: LunarisCoreMode; label: string; hint: string }> = [
  { id: "general", label: "General", hint: "Balanced answers" },
  { id: "coder", label: "Coder", hint: "Code and bugs" },
  { id: "data", label: "Data", hint: "Reports and scans" },
  { id: "minecraft", label: "Minecraft", hint: "Server and RCON" },
  { id: "security", label: "Security", hint: "Risks and secrets" },
  { id: "store", label: "Store", hint: "Products and orders" },
];

const defaultSuggestions = [
  "Analyze all admin data",
  "Find checkout crashes",
  "Scan ranks keys bundles",
  "What should we improve next?",
];

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function makeChat(): StoredChat {
  return {
    id: makeId(),
    title: "New conversation",
    mode: "general",
    messages: [welcome],
    updatedAt: new Date().toISOString(),
  };
}

function loadCoreState(): CoreState {
  if (typeof window === "undefined") {
    const chat = makeChat();
    return { chats: [chat], activeId: chat.id };
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey) || "null") as CoreState | null;
    const chats = Array.isArray(parsed?.chats) ? parsed.chats.filter((chat) => chat?.id && Array.isArray(chat.messages)) : [];
    if (chats.length) {
      return {
        chats: chats.slice(0, 20),
        activeId: chats.some((chat) => chat.id === parsed?.activeId) ? String(parsed?.activeId) : chats[0].id,
      };
    }
  } catch {
    window.localStorage.removeItem(storageKey);
  }

  const chat = makeChat();
  return { chats: [chat], activeId: chat.id };
}

function saveCoreState(state: CoreState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey, JSON.stringify({ ...state, chats: state.chats.slice(0, 20) }));
}

function titleFrom(text: string) {
  const compact = text.replace(/\s+/g, " ").trim();
  if (!compact) return "New conversation";
  return compact.length > 42 ? `${compact.slice(0, 42)}...` : compact;
}

function buildSuggestions(question: string, answer: string) {
  const text = `${question} ${answer}`.toLowerCase();
  if (text.includes("checkout") || text.includes("order") || text.includes("payment")) {
    return ["Scan pending orders", "Find checkout code", "Explain order status flow", "Check payment bugs"];
  }
  if (text.includes("supabase") || text.includes("database") || text.includes("table")) {
    return ["Analyze database schema", "Find duplicate rows", "Scan accounts", "Check admin policies"];
  }
  if (text.includes("minecraft") || text.includes("rcon") || text.includes("server")) {
    return ["RCON troubleshooting checklist", "Explain rank commands", "Check server delivery logs", "Minecraft store ideas"];
  }
  if (text.includes("code") || text.includes("build") || text.includes("cloudflare") || text.includes("vite")) {
    return ["Find build problems", "Where is admin code?", "Where is checkout code?", "Security checklist"];
  }
  return defaultSuggestions;
}

export function LunarisCorePanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [coreState, setCoreState] = useState<CoreState>(() => loadCoreState());
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(defaultSuggestions);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const activeChat = coreState.chats.find((chat) => chat.id === coreState.activeId) || coreState.chats[0] || makeChat();
  const messages = activeChat.messages;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, open]);

  if (!open) return null;

  function commitState(updater: (current: CoreState) => CoreState) {
    setCoreState((current) => {
      const next = updater(current);
      saveCoreState(next);
      return next;
    });
  }

  function updateActiveChat(updater: (chat: StoredChat) => StoredChat) {
    commitState((current) => {
      const chats = current.chats.map((chat) => {
        if (chat.id !== current.activeId) return chat;
        return { ...updater(chat), updatedAt: new Date().toISOString() };
      });
      return { ...current, chats };
    });
  }

  function startNewChat() {
    const chat = makeChat();
    commitState((current) => ({ chats: [chat, ...current.chats].slice(0, 20), activeId: chat.id }));
    setSuggestions(defaultSuggestions);
  }

  function changeMode(mode: LunarisCoreMode) {
    updateActiveChat((chat) => ({ ...chat, mode }));
  }

  async function ask(value = input) {
    const text = value.trim();
    if (!text || loading) return;
    setInput("");
    setLoading(true);
    const adminMessage: LunarisCoreMessage = { role: "admin", content: text };
    const history = [...activeChat.messages, adminMessage].slice(-160);
    updateActiveChat((chat) => ({
      ...chat,
      title: chat.title === "New conversation" ? titleFrom(text) : chat.title,
      messages: [...chat.messages, adminMessage],
    }));
    try {
      const result = await sendToLunarisCore(text, {
        mode: activeChat.mode,
        history,
      });
      updateActiveChat((chat) => ({
        ...chat,
        messages: [...chat.messages, { role: "core", content: result.content }],
      }));
      setSuggestions(buildSuggestions(text, result.content));
    } catch (error) {
      const errorText = `I hit a Core error: ${error instanceof Error ? error.message : "Unknown error"}. I saved the chat, so you can retry without losing context.`;
      updateActiveChat((chat) => ({
        ...chat,
        messages: [...chat.messages, { role: "core", content: errorText }],
      }));
      setSuggestions(["Retry that", "Check AI status", "Scan project files", "Explain the error"]);
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
      <section className="absolute bottom-4 right-4 flex h-[min(820px,calc(100vh-2rem))] w-[calc(100vw-2rem)] max-w-[680px] flex-col overflow-hidden rounded-[2rem] border border-purple-200/20 bg-[#070311]/95 text-white shadow-2xl shadow-purple-950/60">
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
              <p className="mt-1 text-sm text-purple-100/70">Private admin chat with memory, project knowledge, store scans, and Cloudflare AI.</p>
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
          <div className="relative mt-4 grid gap-3 lg:grid-cols-[1fr_auto]">
            <select
              value={coreState.activeId}
              onChange={(event) => {
                commitState((current) => ({ ...current, activeId: event.target.value }));
                setSuggestions(defaultSuggestions);
              }}
              className="min-w-0 rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm font-bold text-purple-50 outline-none"
            >
              {coreState.chats.map((chat) => (
                <option key={chat.id} value={chat.id} className="bg-[#120920] text-white">
                  {chat.title}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={startNewChat}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-purple-200/20 bg-white/10 px-4 py-3 text-sm font-black text-purple-50 transition hover:bg-white/15"
            >
              <MessageSquarePlus className="h-4 w-4" />
              New chat
            </button>
          </div>
          <div className="relative mt-3 flex flex-wrap gap-2">
            {modes.map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => changeMode(mode.id)}
                className={`rounded-full border px-3 py-2 text-left text-xs font-black transition ${
                  activeChat.mode === mode.id
                    ? "border-purple-100 bg-purple-200 text-slate-950 shadow-lg shadow-purple-500/20"
                    : "border-white/10 bg-white/5 text-purple-100 hover:bg-white/10"
                }`}
                title={mode.hint}
              >
                {mode.label}
              </button>
            ))}
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
              Thinking through the context...
            </div>
          )}
          {!loading && suggestions.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => void ask(suggestion)}
                  className="rounded-full border border-purple-200/15 bg-purple-200/10 px-3 py-2 text-xs font-bold text-purple-50 transition hover:border-purple-200/40 hover:bg-purple-200/20"
                >
                  {suggestion}
                </button>
              ))}
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
                onClick={() => {
                  updateActiveChat((chat) => ({ ...chat, title: "New conversation", messages: [welcome] }));
                  setSuggestions(defaultSuggestions);
                }}
                className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold text-purple-100/70 hover:bg-white/10 hover:text-white"
              >
                <Eraser className="h-3.5 w-3.5" />
                Clear
              </button>
              <div className="hidden items-center gap-2 rounded-full border border-purple-200/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-purple-100/55 sm:inline-flex">
                <BrainCircuit className="h-3.5 w-3.5" />
                {activeChat.mode} mode
              </div>
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
