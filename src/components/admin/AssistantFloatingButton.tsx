import { Link } from "@tanstack/react-router";
import { MoonStar } from "lucide-react";

export function AssistantFloatingButton({ currentPage }: { currentPage: string }) {
  if (currentPage === "/admin/assistant") return null;
  return (
    <Link
      to="/admin/assistant"
      className="fixed bottom-6 right-6 z-[80] grid h-16 w-16 place-items-center rounded-full border border-purple-200/40 bg-[radial-gradient(circle_at_30%_25%,#f5e9ff,#bba3ff_42%,#4f2d86_75%,#12081f)] text-slate-950 shadow-[0_0_38px_rgba(190,160,255,0.55)] transition hover:scale-105"
      aria-label="Open Lunaris AI assistant"
    >
      <MoonStar className="h-8 w-8" />
    </Link>
  );
}
