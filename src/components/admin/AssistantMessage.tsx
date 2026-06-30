import { Bot, User } from "lucide-react";
import type { AssistantChatMessage } from "@/lib/assistantApi";

export function AssistantMessage({ message }: { message: AssistantChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-purple-300/30 bg-purple-400/15 text-purple-100">
          <Bot className="h-4 w-4" />
        </div>
      )}
      <div
        className={`max-w-[82%] whitespace-pre-wrap rounded-3xl px-4 py-3 text-sm leading-relaxed shadow-lg ${
          isUser
            ? "bg-purple-200 text-slate-950"
            : "border border-purple-300/15 bg-slate-950/70 text-purple-50"
        }`}
      >
        {message.content}
      </div>
      {isUser && (
        <div className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-purple-300/30 bg-white/10 text-purple-100">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}
