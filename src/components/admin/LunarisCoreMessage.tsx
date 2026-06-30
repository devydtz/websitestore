import { Check, Copy, Download, FileText, Image as ImageIcon, Wrench } from "lucide-react";
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
  const [copiedAnswer, setCopiedAnswer] = useState(false);

  async function copyAnswer() {
    await navigator.clipboard?.writeText(message.content);
    setCopiedAnswer(true);
    window.setTimeout(() => setCopiedAnswer(false), 1200);
  }

  function downloadAnswer(ext: "md" | "txt") {
    const blob = new Blob([message.content], { type: ext === "md" ? "text/markdown;charset=utf-8" : "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `lunaris-core-answer.${ext}`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className={`mx-auto flex w-full max-w-3xl ${isCore ? "justify-start" : "justify-end"}`}>
      <div
        className={`${
          isCore
            ? "w-full bg-transparent px-1 py-5 text-slate-900"
            : "max-w-[75%] rounded-[1.5rem] bg-[#f4f4f4] px-5 py-3 text-slate-950"
        }`}
      >
        {isCore && message.tools?.length ? (
          <details className="mb-4 rounded-2xl border border-slate-200 bg-white">
            <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-semibold text-slate-700">
              <Wrench className="h-4 w-4" />
              Thinking
              <span className="ml-auto text-xs text-slate-400">Analyzed {message.tools.length} tool{message.tools.length === 1 ? "" : "s"}</span>
            </summary>
            <div className="border-t border-slate-100 p-3">
              {message.tools.map((tool, index) => (
                <div key={`${tool.name}-${index}`} className="mb-2 rounded-xl bg-slate-50 px-3 py-2 last:mb-0">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    {tool.name}
                    <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-[11px] text-slate-500">{tool.status}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{tool.summary}</p>
                </div>
              ))}
            </div>
          </details>
        ) : null}

        {message.attachments?.length ? (
          <div className="mb-3 grid gap-2">
            {message.attachments.map((file) => (
              <div key={file.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-slate-600">
                  {file.kind === "image" ? <ImageIcon className="h-4 w-4 text-slate-500" /> : <FileText className="h-4 w-4 text-slate-500" />}
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
        {isCore ? (
          <div className="mt-4 flex flex-wrap items-center gap-1 text-slate-500">
            <button type="button" onClick={copyAnswer} className="rounded-lg p-2 transition hover:bg-slate-100" title="Copy answer">
              {copiedAnswer ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
            <button type="button" onClick={() => downloadAnswer("md")} className="flex items-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold transition hover:bg-slate-100">
              <Download className="h-4 w-4" />
              MD
            </button>
            <button type="button" onClick={() => downloadAnswer("txt")} className="flex items-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold transition hover:bg-slate-100">
              <Download className="h-4 w-4" />
              TXT
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
