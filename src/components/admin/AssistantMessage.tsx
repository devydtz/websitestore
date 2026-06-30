import { Bot, User } from "lucide-react";
import type { AssistantChatMessage } from "@/lib/assistantApi";

export function AssistantMessage({ message }: { message: AssistantChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-2xl border border-purple-200 bg-white text-purple-600 shadow-sm">
          <Bot className="h-4 w-4" />
        </div>
      )}
      <div
        className={`max-w-[86%] whitespace-pre-wrap rounded-[1.4rem] px-4 py-3 text-sm leading-relaxed shadow-lg ${
          isUser
            ? "bg-blue-500 text-white"
            : "border border-slate-200 bg-white text-slate-800"
        }`}
      >
        {message.content}
      </div>
      {isUser && (
        <div className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-slate-100 text-slate-600">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}
