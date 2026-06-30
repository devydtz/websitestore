import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowUp,
  ChevronLeft,
  Eraser,
  Home,
  Loader2,
  MessageSquare,
  MessageSquarePlus,
  MoonStar,
  Search,
  Sparkles,
} from "lucide-react";
import { sendToLunarisCore, type LunarisCoreMessage } from "@/lib/lunarisCore/client";
import { LunarisCoreMessage as MessageBubble } from "./LunarisCoreMessage";

type StoredChat = {
  id: string;
  title: string;
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
    "Welcome back. I can help with your admin panel, checkout flow, Supabase data, Minecraft delivery, Cloudflare errors, products, promos, reports, and code. Ask normally, I will keep it clean and useful.",
};

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function makeChat(): StoredChat {
  return {
    id: makeId(),
    title: "New chat",
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
        chats: chats.slice(0, 30),
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
  window.localStorage.setItem(storageKey, JSON.stringify({ ...state, chats: state.chats.slice(0, 30) }));
}

function titleFrom(text: string) {
  const compact = text.replace(/\s+/g, " ").trim();
  if (!compact) return "New chat";
  return compact.length > 44 ? `${compact.slice(0, 44)}...` : compact;
}

export function LunarisCoreWorkspace() {
  const [coreState, setCoreState] = useState<CoreState>(() => loadCoreState());
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const activeChat = coreState.chats.find((chat) => chat.id === coreState.activeId) || coreState.chats[0] || makeChat();
  const visibleChats = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return coreState.chats;
    return coreState.chats.filter((chat) => chat.title.toLowerCase().includes(search));
  }, [coreState.chats, query]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [activeChat.messages, loading]);

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
    commitState((current) => ({ chats: [chat, ...current.chats].slice(0, 30), activeId: chat.id }));
    setInput("");
  }

  function clearActiveChat() {
    updateActiveChat((chat) => ({ ...chat, title: "New chat", messages: [welcome] }));
  }

  async function ask(value = input) {
    const text = value.trim();
    if (!text || loading) return;

    setInput("");
    setLoading(true);
    const adminMessage: LunarisCoreMessage = { role: "admin", content: text };
    const history = [...activeChat.messages, adminMessage].slice(-18);

    updateActiveChat((chat) => ({
      ...chat,
      title: chat.title === "New chat" ? titleFrom(text) : chat.title,
      messages: [...chat.messages, adminMessage],
    }));

    try {
      const result = await sendToLunarisCore(text, {
        mode: "general",
        history,
      });
      updateActiveChat((chat) => ({
        ...chat,
        messages: [...chat.messages, { role: "core", content: result.content }],
      }));
    } catch (error) {
      updateActiveChat((chat) => ({
        ...chat,
        messages: [
          ...chat.messages,
          {
            role: "core",
            content: `I could not answer that yet: ${error instanceof Error ? error.message : "unknown Core error"}. Your chat is still saved, so retry after the backend settles.`,
          },
        ],
      }));
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void ask();
  }

  return (
    <main className="relative h-screen overflow-hidden bg-[#fbfaff] text-slate-950">
      <div className="relative grid h-screen lg:grid-cols-[280px_1fr]">
        <aside className="hidden border-r border-slate-200/80 bg-white/90 p-3 backdrop-blur-xl lg:flex lg:flex-col">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-purple-700 to-indigo-600 text-white shadow-sm shadow-purple-200">
                <MoonStar className="h-4 w-4" />
              </span>
              <div>
                <p className="text-base font-black">Lunaris Core</p>
                <p className="text-[11px] font-bold text-slate-500">Private admin AI</p>
              </div>
            </div>
            <Link to="/admin/dashboard" className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950" title="Back to admin">
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </div>

          <button
            type="button"
            onClick={startNewChat}
            className="mb-3 flex w-full items-center gap-3 rounded-xl bg-slate-100 px-3 py-2.5 text-sm font-black transition hover:bg-purple-100"
          >
            <MessageSquarePlus className="h-4 w-4" />
            New chat
          </button>

          <label className="mb-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500">
            <Search className="h-4 w-4" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search chats" className="min-w-0 flex-1 bg-transparent outline-none" />
          </label>

          <div className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-slate-400">Chats</div>
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
            {visibleChats.map((chat) => (
              <button
                key={chat.id}
                type="button"
                onClick={() => commitState((current) => ({ ...current, activeId: chat.id }))}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                  chat.id === activeChat.id ? "bg-purple-100 font-black text-purple-950" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <MessageSquare className="h-4 w-4 shrink-0" />
                <span className="min-w-0 truncate">{chat.title}</span>
              </button>
            ))}
          </div>
        </aside>

        <section className="flex h-screen min-h-0 flex-col">
          <header className="z-10 flex h-16 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-xl sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <Link to="/admin/dashboard" className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 lg:hidden">
                <Home className="h-5 w-5" />
              </Link>
              <div className="min-w-0">
                <p className="truncate text-xs font-black text-slate-500">Lunaris Core</p>
                <h1 className="truncate text-base font-black sm:text-xl">{activeChat.title}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={clearActiveChat} className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950" title="Clear chat">
                <Eraser className="h-5 w-5" />
              </button>
              <button type="button" onClick={startNewChat} className="rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white transition hover:bg-purple-950">
                New
              </button>
            </div>
          </header>

          <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
              {activeChat.messages.length <= 1 && (
                <div className="grid min-h-[34vh] place-items-center py-4 text-center">
                  <div>
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-purple-200 via-white to-indigo-200 shadow-lg shadow-purple-100">
                    <Sparkles className="h-7 w-7 text-purple-700" />
                  </div>
                  <h2 className="mt-4 text-2xl font-black">Ask Lunaris Core anything.</h2>
                  <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
                    I will answer from your project knowledge, admin data tools, and safe general knowledge without forcing modes or random prompt buttons.
                  </p>
                  </div>
                </div>
              )}

              {activeChat.messages.map((message, index) => (
                <MessageBubble key={`${activeChat.id}-${message.role}-${index}`} message={message} />
              ))}

              {loading && (
                <div className="flex w-fit items-center gap-2 rounded-full border border-purple-200 bg-white px-4 py-2 text-sm font-bold text-slate-500 shadow-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                  Thinking through the context...
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="shrink-0 border-t border-slate-200/80 bg-[#fbfaff]/95 px-4 py-3 backdrop-blur-xl sm:px-6">
            <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-[1.5rem] border border-slate-200 bg-white px-3 py-2 shadow-xl shadow-purple-950/5">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void ask();
                  }
                }}
                placeholder="Ask anything about Lunaris Craft..."
                className="h-10 max-h-28 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-base outline-none placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-purple-600 text-white shadow-sm shadow-purple-200 transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-45"
                aria-label="Send message"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowUp className="h-5 w-5" />}
              </button>
            </div>
            <p className="mt-1 text-center text-[11px] font-semibold text-slate-400">Private admin assistant. Verify important server and payment actions.</p>
          </form>
        </section>
      </div>
    </main>
  );
}
