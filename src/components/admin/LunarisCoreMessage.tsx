import { Bot, UserRound } from "lucide-react";
import type { LunarisCoreMessage as CoreMessage } from "@/lib/lunarisCore/client";

export function LunarisCoreMessage({ message }: { message: CoreMessage }) {
  const isCore = message.role === "core";

  return (
    <div className={`flex gap-3 ${isCore ? "justify-start" : "justify-end"}`}>
      {isCore && (
        <div className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-2xl border border-purple-200/30 bg-purple-300/15 text-purple-100 shadow-lg shadow-purple-500/20">
          <Bot className="h-4 w-4" />
        </div>
      )}
      <div
        className={`max-w-[85%] whitespace-pre-wrap rounded-[1.35rem] px-4 py-3 text-sm leading-relaxed shadow-xl ${
          isCore
            ? "border border-purple-200/15 bg-[#120920]/95 text-purple-50"
            : "border border-purple-100/25 bg-purple-200 text-slate-950"
        }`}
      >
        {message.content}
      </div>
      {!isCore && (
        <div className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-2xl border border-white/15 bg-white/10 text-white">
          <UserRound className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}
