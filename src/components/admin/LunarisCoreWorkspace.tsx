import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Archive,
  ArrowUp,
  ChevronLeft,
  Download,
  Pencil,
  Pin,
  Share2,
  Star,
  Trash2,
  Eraser,
  FileText,
  Home,
  Image as ImageIcon,
  Library,
  Loader2,
  MessageSquare,
  MessageSquarePlus,
  MoonStar,
  MoreHorizontal,
  Paperclip,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { sendToLunarisCore, type LunarisCoreAttachment, type LunarisCoreMessage, type LunarisCoreToolTrace } from "@/lib/lunarisCore/client";
import { LunarisCoreMessage as MessageBubble } from "./LunarisCoreMessage";
import { planLunarisCoreTask, type LunarisPlan } from "@/lib/lunarisCore/planner";
import { learnFromCoreExchange } from "@/lib/lunarisCore/memoryStore";

type StoredChat = {
  id: string;
  title: string;
  messages: LunarisCoreMessage[];
  updatedAt: string;
  pinned?: boolean;
  favorite?: boolean;
  archived?: boolean;
};

type CoreState = {
  chats: StoredChat[];
  activeId: string;
};

const storageKey = "lunaris-core-chat-memory-v3";
const maxStoredChats = 12;
const maxStoredMessages = 80;

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
        chats: sanitizeCoreState({ chats, activeId: String(parsed?.activeId || chats[0].id) }).chats,
        activeId: chats.some((chat) => chat.id === parsed?.activeId) ? String(parsed?.activeId) : chats[0].id,
      };
    }
  } catch {
    window.localStorage.removeItem(storageKey);
    const chat = makeChat();
    return { chats: [chat], activeId: chat.id };
  }

  const chat = makeChat();
  return { chats: [chat], activeId: chat.id };
}

function saveCoreState(state: CoreState) {
  if (typeof window === "undefined") return;
  const safeState = sanitizeCoreState(state);
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(safeState));
  } catch {
    const minimalState = {
      ...safeState,
      chats: safeState.chats.slice(0, 4).map((chat) => ({ ...chat, messages: chat.messages.slice(-30).map(stripHeavyMessageData) })),
    };
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(minimalState));
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }
}

function titleFrom(text: string) {
  const compact = text.replace(/\s+/g, " ").trim();
  if (!compact) return "New chat";
  return compact.length > 44 ? `${compact.slice(0, 44)}...` : compact;
}

function stripHeavyMessageData(message: LunarisCoreMessage): LunarisCoreMessage {
  return {
    role: message.role,
    content: message.content.slice(0, 6000),
    attachments: message.attachments?.map((file) => ({
      id: file.id,
      name: file.name,
      type: file.type,
      size: file.size,
      kind: file.kind,
      text: file.text ? file.text.slice(0, 2000) : undefined,
    })),
    generatedImages: message.generatedImages?.map((image) => ({
      id: image.id,
      prompt: image.prompt,
      url: "",
    })),
    tools: message.tools?.map((tool) => ({
      name: tool.name,
      status: tool.status,
      summary: tool.summary.slice(0, 800),
    })),
  };
}

function sanitizeCoreState(state: CoreState): CoreState {
  const chats = state.chats.slice(0, maxStoredChats).map((chat) => ({
    ...chat,
    messages: chat.messages.slice(-maxStoredMessages).map(stripHeavyMessageData),
  }));
  return {
    chats,
    activeId: chats.some((chat) => chat.id === state.activeId) ? state.activeId : chats[0]?.id || state.activeId,
  };
}

export function LunarisCoreWorkspace() {
  const [coreState, setCoreState] = useState<CoreState>(() => loadCoreState());
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState<LunarisCoreAttachment[]>([]);
  const [activePlan, setActivePlan] = useState<LunarisPlan | null>(null);
  const [dragging, setDragging] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeChat = coreState.chats.find((chat) => chat.id === coreState.activeId) || coreState.chats[0] || makeChat();
  const visibleChats = useMemo(() => {
    const search = query.trim().toLowerCase();
    const sorted = coreState.chats
      .filter((chat) => !chat.archived || search.includes("archived"))
      .slice()
      .sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) || Number(Boolean(b.favorite)) - Number(Boolean(a.favorite)));
    if (!search) return sorted;
    return sorted.filter((chat) => chat.title.toLowerCase().includes(search) || (chat.archived && search.includes("archived")));
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
    commitState((current) => ({ chats: [chat, ...current.chats].slice(0, maxStoredChats), activeId: chat.id }));
    setInput("");
  }

  function clearActiveChat() {
    updateActiveChat((chat) => ({ ...chat, title: "New chat", messages: [welcome] }));
  }

  function renameChat(chatId: string) {
    const chat = coreState.chats.find((item) => item.id === chatId);
    const nextTitle = window.prompt("Rename chat", chat?.title || "New chat")?.trim();
    if (!nextTitle) return;
    commitState((current) => ({
      ...current,
      chats: current.chats.map((item) => (item.id === chatId ? { ...item, title: titleFrom(nextTitle), updatedAt: new Date().toISOString() } : item)),
    }));
  }

  function deleteChat(chatId: string) {
    const chat = coreState.chats.find((item) => item.id === chatId);
    if (!window.confirm(`Delete "${chat?.title || "this chat"}"?`)) return;
    commitState((current) => {
      const remaining = current.chats.filter((item) => item.id !== chatId);
      if (remaining.length) {
        return {
          chats: remaining,
          activeId: current.activeId === chatId ? remaining[0].id : current.activeId,
        };
      }
      const fresh = makeChat();
      return { chats: [fresh], activeId: fresh.id };
    });
  }

  function toggleChatFlag(chatId: string, flag: "pinned" | "favorite" | "archived") {
    commitState((current) => ({
      ...current,
      chats: current.chats.map((chat) => (chat.id === chatId ? { ...chat, [flag]: !chat[flag], updatedAt: new Date().toISOString() } : chat)),
    }));
  }

  function chatAsMarkdown(chat = activeChat) {
    return [
      `# ${chat.title}`,
      `Updated: ${chat.updatedAt}`,
      "",
      ...chat.messages.map((message) => `## ${message.role === "admin" ? "Admin" : "Lunaris Core"}\n\n${message.content}`),
    ].join("\n\n");
  }

  async function copyShareText() {
    await navigator.clipboard?.writeText(chatAsMarkdown());
  }

  function exportChat(ext: "md" | "txt") {
    const content = chatAsMarkdown();
    const blob = new Blob([content], { type: ext === "md" ? "text/markdown;charset=utf-8" : "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${activeChat.title.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").slice(0, 48) || "lunaris-core-chat"}.${ext}`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function ask(value = input) {
    const text = value.trim();
    if ((!text && attachments.length === 0) || loading) return;

    setInput("");
    setLoading(true);
    const outgoingAttachments = attachments;
    setAttachments([]);
    const plan = planLunarisCoreTask(text || "Analyze uploaded files.", outgoingAttachments);
    setActivePlan(plan);
    const adminMessage: LunarisCoreMessage = {
      role: "admin",
      content: text || "Analyze these uploaded files.",
      attachments: outgoingAttachments,
    };
    const history = [...activeChat.messages, adminMessage].slice(-160);

    updateActiveChat((chat) => ({
      ...chat,
      title: chat.title === "New chat" ? titleFrom(text || outgoingAttachments[0]?.name || "Uploaded files") : chat.title,
      messages: [...chat.messages, adminMessage],
    }));

    try {
      const result = await sendToLunarisCore(text || "Analyze uploaded files.", {
        mode: "general",
        history,
        attachments: outgoingAttachments,
      });
      learnFromCoreExchange(adminMessage.content, result.content);
      updateActiveChat((chat) => ({
        ...chat,
        messages: [
          ...chat.messages,
          {
            role: "core",
            content: result.content,
            generatedImages: result.generatedImages,
            tools: result.tools as LunarisCoreToolTrace[] | undefined,
          },
        ],
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
      setActivePlan(null);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void ask();
  }

  async function importFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList).slice(0, 8);
    const imported = await Promise.all(files.map(readAttachment));
    setAttachments((current) => [...current, ...imported].slice(0, 8));
  }

  async function readAttachment(file: File): Promise<LunarisCoreAttachment> {
    const id = makeId();
    const kind: LunarisCoreAttachment["kind"] = file.type.startsWith("image/")
      ? "image"
      : /\.(csv|json|xlsx?)$/i.test(file.name)
        ? "data"
        : file.type.startsWith("text/") || /\.(txt|md|mdx|tsx?|jsx?|css|scss|html|xml|sql|log|toml|ya?ml|ini|conf|properties|env\.example)$/i.test(file.name)
          ? "text"
          : "file";
    const base = { id, name: file.name, type: file.type || "unknown", size: file.size, kind };

    if (kind === "image") {
      return { ...base, preview: await readImagePreview(file) };
    }

    if (kind === "text" || kind === "data") {
      const text = await file.slice(0, 240_000).text().catch(() => "");
      return { ...base, text: text.slice(0, 80_000) };
    }

    return base;
  }

  function readAsDataUrl(file: Blob) {
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => resolve("");
      reader.readAsDataURL(file);
    });
  }

  async function readImagePreview(file: File) {
    const original = await readAsDataUrl(file);
    return new Promise<string>((resolve) => {
      const image = new Image();
      image.onload = () => {
        const maxSide = 1280;
        const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d");
        if (!context) {
          resolve(original);
          return;
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      image.onerror = () => resolve(original);
      image.src = original;
    });
  }

  return (
    <main
      className="relative h-screen overflow-hidden bg-[#fbfaff] text-slate-950"
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        void importFiles(event.dataTransfer.files);
      }}
    >
      {dragging && (
        <div className="pointer-events-none absolute inset-3 z-50 grid place-items-center rounded-[2rem] border-2 border-dashed border-purple-400 bg-purple-950/10 backdrop-blur-sm">
          <div className="rounded-3xl bg-white px-6 py-4 text-center font-black text-purple-950 shadow-2xl shadow-purple-900/20">
            Drop files into Lunaris Core
          </div>
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(168,85,247,0.12),transparent_26%),radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.10),transparent_22%),linear-gradient(180deg,#ffffff,#fbfaff)]" />
      <div className="relative grid h-screen lg:grid-cols-[296px_1fr]">
        <aside className="hidden border-r border-slate-200/80 bg-white/75 p-3 backdrop-blur-xl lg:flex lg:flex-col">
          <div className="mb-5 flex items-center justify-between px-1 pt-1">
            <div className="flex items-center gap-3">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-slate-950 text-white">
                <MoonStar className="h-4 w-4" />
              </span>
              <div>
                <p className="text-lg font-black">Lunaris Core</p>
                <p className="text-[11px] font-semibold text-slate-500">Admin assistant</p>
              </div>
            </div>
            <Link to="/admin/dashboard" className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950" title="Back to admin">
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </div>

          <button
            type="button"
            onClick={startNewChat}
            className="mb-2 flex w-full items-center gap-3 rounded-xl bg-[#ececec] px-3 py-2.5 text-sm font-semibold transition hover:bg-[#e5e5e5]"
          >
            <MessageSquarePlus className="h-4 w-4" />
            New chat
          </button>

          <button type="button" className="mb-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-[#ececec]">
            <Library className="h-4 w-4" />
            Library
          </button>

          <label className="mb-5 flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-slate-700 transition hover:bg-[#ececec]">
            <Search className="h-4 w-4" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search chats" className="min-w-0 flex-1 bg-transparent outline-none" />
          </label>

          <div className="mb-2 px-2 text-sm font-bold text-slate-800">Projects</div>
          <div className="mb-5 rounded-xl bg-[#ececec] px-3 py-2 text-sm font-semibold">Lunaris Craft</div>

          <div className="mb-3 px-2 text-sm font-bold text-slate-800">Chats</div>
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
            {visibleChats.map((chat) => (
              <div
                key={chat.id}
                className={`group flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                  chat.id === activeChat.id ? "bg-[#ececec] font-semibold text-slate-950" : "text-slate-700 hover:bg-[#ececec]"
                }`}
              >
                <button type="button" onClick={() => commitState((current) => ({ ...current, activeId: chat.id }))} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                  <MessageSquare className="h-4 w-4 shrink-0" />
                  <span className="min-w-0 truncate">{chat.title}</span>
                </button>
                <button type="button" onClick={() => renameChat(chat.id)} className="rounded-lg p-1 text-slate-400 opacity-0 transition hover:bg-white hover:text-slate-900 group-hover:opacity-100" title="Rename chat">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={() => toggleChatFlag(chat.id, "pinned")} className={`rounded-lg p-1 opacity-0 transition hover:bg-white group-hover:opacity-100 ${chat.pinned ? "text-purple-600 opacity-100" : "text-slate-400 hover:text-slate-900"}`} title="Pin chat">
                  <Pin className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={() => toggleChatFlag(chat.id, "favorite")} className={`rounded-lg p-1 opacity-0 transition hover:bg-white group-hover:opacity-100 ${chat.favorite ? "text-amber-500 opacity-100" : "text-slate-400 hover:text-slate-900"}`} title="Favorite chat">
                  <Star className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={() => toggleChatFlag(chat.id, "archived")} className="rounded-lg p-1 text-slate-400 opacity-0 transition hover:bg-white hover:text-slate-900 group-hover:opacity-100" title="Archive chat">
                  <Archive className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={() => deleteChat(chat.id)} className="rounded-lg p-1 text-slate-400 opacity-0 transition hover:bg-white hover:text-red-600 group-hover:opacity-100" title="Delete chat">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-3 rounded-xl px-3 py-2 text-sm">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-orange-500 text-xs font-black text-white">LC</div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold">Lunaris Admin</div>
              <div className="text-xs text-slate-500">Private</div>
            </div>
            <MoreHorizontal className="h-4 w-4 text-slate-500" />
          </div>
        </aside>

        <section className="flex h-screen min-h-0 flex-col">
          <header className="z-10 flex h-16 shrink-0 items-center justify-between border-b border-slate-100 bg-white/85 px-4 backdrop-blur-xl sm:px-7">
            <div className="flex min-w-0 items-center gap-3">
              <Link to="/admin/dashboard" className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 lg:hidden">
                <Home className="h-5 w-5" />
              </Link>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-500">Lunaris Craft</p>
                <h1 className="truncate text-base font-semibold sm:text-lg">{activeChat.title}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={copyShareText} className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950" title="Copy share text">
                <Share2 className="h-5 w-5" />
              </button>
              <button type="button" onClick={() => exportChat("md")} className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950" title="Export chat">
                <Download className="h-5 w-5" />
              </button>
              <button type="button" onClick={clearActiveChat} className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950" title="Clear chat">
                <Eraser className="h-5 w-5" />
              </button>
              <button type="button" onClick={startNewChat} className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800">
                New
              </button>
            </div>
          </header>

          <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-5 pb-32 sm:px-6">
            <div className="mx-auto flex w-full flex-col gap-1">
              {activeChat.messages.length <= 1 && (
                <div className="grid min-h-[46vh] place-items-center py-4 text-center">
                  <div>
                  <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-200">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <h2 className="mt-5 text-3xl font-semibold">What are we building today?</h2>
                  <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
                    Ask about code, Minecraft, admin data, files, research, reports, or generated content.
                  </p>
                  </div>
                </div>
              )}

              {activeChat.messages.map((message, index) => (
                <MessageBubble key={`${activeChat.id}-${message.role}-${index}`} message={message} />
              ))}

              {loading && (
                <AnalyzingPanel plan={activePlan} />
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="absolute bottom-0 left-0 right-0 shrink-0 bg-gradient-to-t from-[#fbfaff] via-[#fbfaff]/95 to-[#fbfaff]/10 px-4 pb-4 pt-8 sm:px-6">
            {attachments.length > 0 && (
              <div className="mx-auto mb-2 flex max-w-3xl gap-2 overflow-x-auto pb-1">
                {attachments.map((file) => (
                  <div key={file.id} className="flex max-w-xs items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm">
                    {file.kind === "image" ? <ImageIcon className="h-4 w-4 text-purple-600" /> : <FileText className="h-4 w-4 text-purple-600" />}
                    <span className="truncate font-bold">{file.name}</span>
                    <button type="button" onClick={() => setAttachments((current) => current.filter((item) => item.id !== file.id))} className="rounded-full p-1 hover:bg-slate-100">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-[1.75rem] border border-purple-100 bg-white/95 px-3 py-3 shadow-xl shadow-purple-950/10 backdrop-blur-xl">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                accept="image/*,.txt,.md,.mdx,.json,.csv,.xlsx,.xls,.pdf,.ts,.tsx,.js,.jsx,.css,.scss,.html,.xml,.sql,.log,.toml,.yaml,.yml,.ini,.conf,.properties"
                onChange={(event) => {
                  if (event.target.files) void importFiles(event.target.files);
                  event.currentTarget.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
                aria-label="Attach files"
              >
                <Paperclip className="h-5 w-5" />
              </button>
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
                className="h-9 max-h-24 min-h-9 flex-1 resize-none bg-transparent px-2 py-1.5 text-[16px] outline-none placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={loading || (!input.trim() && attachments.length === 0)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-950 text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-45"
                aria-label="Send message"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowUp className="h-5 w-5" />}
              </button>
            </div>
            <p className="mt-2 text-center text-xs text-slate-400">Learning from this chat. Verify important server and payment actions.</p>
          </form>
        </section>
      </div>
    </main>
  );
}

function AnalyzingPanel({ plan }: { plan: LunarisPlan | null }) {
  const steps = plan?.steps.length ? plan.steps : ["Understanding request", "Searching Lunaris knowledge", "Building answer"];
  return (
    <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-1 py-4 text-sm text-slate-500">
      <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
      <span className="font-medium">Thinking...</span>
      <span className="hidden truncate text-slate-400 sm:block">{steps[steps.length - 1]}</span>
    </div>
  );
}
