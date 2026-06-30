import { Bot, User } from "lucide-react";
import type { AssistantChatMessage } from "@/lib/assistantApi";

export function AssistantMessage({ message }: { message: AssistantChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-2xl border border-purple-300/30 bg-purple-400/15 text-purple-100 shadow-[0_0_18px_rgba(190,160,255,0.2)]">
          <Bot className="h-4 w-4" />
        </div>
      )}
      <div
        className={`max-w-[86%] whitespace-pre-wrap rounded-[1.4rem] px-4 py-3 text-sm leading-relaxed shadow-lg ${
          isUser
            ? "bg-purple-200 text-slate-950"
            : "border border-purple-300/15 bg-[#120a24]/85 text-purple-50"
        }`}
      >
        {message.content}
      </div>
      {isUser && (
        <div className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-2xl border border-purple-300/30 bg-white/10 text-purple-100">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}
