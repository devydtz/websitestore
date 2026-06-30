import { Bot, UserRound } from "lucide-react";
import type { LunarisCoreMessage as CoreMessage } from "@/lib/lunarisCore/client";

export function LunarisCoreMessage({ message }: { message: CoreMessage }) {
  const isCore = message.role === "core";

  return (
    <div className={`flex gap-3 ${isCore ? "justify-start" : "justify-end"}`}>
      {isCore && (
        <div className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-xl border border-purple-200/40 bg-purple-100 text-purple-700">
          <Bot className="h-3.5 w-3.5" />
        </div>
      )}
      <div
        className={`max-w-[78%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-[15px] leading-7 shadow-sm ${
          isCore
            ? "border border-slate-200 bg-white text-slate-900"
            : "border border-purple-100/40 bg-purple-100 text-slate-950"
        }`}
      >
        {message.content}
      </div>
      {!isCore && (
        <div className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-xl border border-purple-200 bg-purple-600 text-white">
          <UserRound className="h-3.5 w-3.5" />
        </div>
      )}
    </div>
  );
}
