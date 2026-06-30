import type { LunarisCoreToolTrace } from "@/lib/lunarisCore/client";

export function LunarisCoreToolCard({ tool }: { tool: LunarisCoreToolTrace }) {
  return (
    <div className="rounded-2xl border border-purple-200 bg-white p-3 text-sm shadow-sm">
      <div className="font-black text-purple-900">{tool.name}</div>
      <div className="text-slate-500">{tool.summary}</div>
    </div>
  );
}
