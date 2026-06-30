import { Link } from "@tanstack/react-router";
import { MoonStar } from "lucide-react";

export function LunarisCoreButton() {
  return (
    <Link
      to="/admin/core"
      className="group fixed bottom-5 right-5 z-[80] flex items-center gap-3 rounded-full border border-purple-200/25 bg-[#10071f]/90 px-4 py-3 text-sm font-black text-purple-50 shadow-2xl shadow-purple-600/30 backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-purple-100/55 hover:bg-purple-950"
      aria-label="Open Lunaris Core"
    >
      <span className="relative grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-purple-200 via-fuchsia-200 to-indigo-300 text-slate-950 shadow-lg shadow-purple-400/30">
        <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-emerald-300 shadow-[0_0_14px_rgba(110,231,183,0.9)]" />
        <MoonStar className="h-5 w-5" />
      </span>
      <span className="hidden sm:block">Lunaris Core</span>
    </Link>
  );
}
