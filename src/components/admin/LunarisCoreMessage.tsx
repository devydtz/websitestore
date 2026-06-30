import { Bot, Check, Copy, FileText, Image as ImageIcon, Wrench, UserRound } from "lucide-react";
import { useState } from "react";
import type { LunarisCoreMessage as CoreMessage } from "@/lib/lunarisCore/client";

function splitCodeBlocks(content: string) {
  const parts: Array<{ type: "text" | "code"; value: string; language?: string }> = [];
  const pattern = /```(\w+)?\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(content))) {
    if (match.index > lastIndex) parts.push({ type: "text", value: content.slice(lastIndex, match.index) });
    parts.push({ type: "code", language: match[1], value: match[2].trim() });
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < content.length) parts.push({ type: "text", value: content.slice(lastIndex) });
  return parts.length ? parts : [{ type: "text", value: content }];
}

function TextBlock({ value }: { value: string }) {
  const tokens = value.split(/(https?:\/\/[^\s)]+)/g);
  return (
    <div className="whitespace-pre-wrap">
      {tokens.map((token, index) =>
        /^https?:\/\//.test(token) ? (
          <a key={`${token}-${index}`} href={token} target="_blank" rel="noreferrer" className="font-bold text-purple-600 underline underline-offset-4">
            {token}
          </a>
        ) : (
          <span key={`${token}-${index}`}>{token}</span>
        ),
      )}
    </div>
  );
}

function CodeBlock({ value, language }: { value: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    await navigator.clipboard?.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="my-3 overflow-hidden rounded-2xl border border-purple-200/20 bg-slate-950 text-slate-100">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 text-xs font-bold text-slate-400">
        <span>{language || "code"}</span>
        <button type="button" onClick={copyCode} className="flex items-center gap-1 rounded-lg px-2 py-1 transition hover:bg-white/10">
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="max-h-80 overflow-auto p-3 text-sm leading-6">
        <code>{value}</code>
      </pre>
    </div>
  );
}

export function LunarisCoreMessage({ message }: { message: CoreMessage }) {
  const isCore = message.role === "core";
  const parts = splitCodeBlocks(message.content);

  return (
    <div className={`flex gap-3 ${isCore ? "justify-start" : "justify-end"}`}>
      {isCore && (
        <div className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-xl border border-purple-200/40 bg-purple-100 text-purple-700">
          <Bot className="h-3.5 w-3.5" />
        </div>
      )}
      <div
        className={`max-w-[82%] rounded-2xl px-4 py-3 text-[15px] leading-7 shadow-sm ${
          isCore
            ? "border border-slate-200 bg-white text-slate-900"
            : "border border-purple-100/40 bg-purple-100 text-slate-950"
        }`}
      >
        {message.attachments?.length ? (
          <div className="mb-3 grid gap-2">
            {message.attachments.map((file) => (
              <div key={file.id} className="overflow-hidden rounded-2xl border border-purple-200 bg-white/80">
                <div className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-slate-600">
                  {file.kind === "image" ? <ImageIcon className="h-4 w-4 text-purple-600" /> : <FileText className="h-4 w-4 text-purple-600" />}
                  <span className="min-w-0 truncate">{file.name}</span>
                </div>
                {file.preview && <img src={file.preview} alt={file.name} className="max-h-52 w-full object-cover" />}
              </div>
            ))}
          </div>
        ) : null}
        {parts.map((part, index) =>
          part.type === "code" ? (
            <CodeBlock key={`${part.type}-${index}`} value={part.value} language={part.language} />
          ) : (
            <TextBlock key={`${part.type}-${index}`} value={part.value} />
          ),
        )}
        {message.tools?.length ? (
          <div className="mt-4 space-y-2">
            <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Analyzed</div>
            {message.tools.map((tool, index) => (
              <details key={`${tool.name}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-black text-slate-700">
                  <Wrench className="h-4 w-4 text-purple-600" />
                  {tool.name}
                  <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-[11px] text-slate-500">{tool.status}</span>
                </summary>
                <p className="mt-2 text-sm text-slate-600">{tool.summary}</p>
                {tool.output && <pre className="mt-2 max-h-44 overflow-auto rounded-xl bg-slate-950 p-3 text-xs text-slate-100">{tool.output}</pre>}
              </details>
            ))}
          </div>
        ) : null}
      </div>
      {!isCore && (
        <div className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-xl border border-purple-200 bg-purple-600 text-white">
          <UserRound className="h-3.5 w-3.5" />
        </div>
      )}
    </div>
  );
}
