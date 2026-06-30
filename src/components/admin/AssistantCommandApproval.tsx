import { AlertTriangle } from "lucide-react";

export function AssistantCommandApproval({
  command,
  onApprove,
  onCancel,
}: {
  command?: string;
  onApprove: () => void;
  onCancel: () => void;
}) {
  if (!command) return null;
  return (
    <div className="rounded-3xl border border-amber-300/30 bg-amber-400/10 p-4 text-amber-50">
      <div className="flex items-center gap-2 font-bold">
        <AlertTriangle className="h-4 w-4" />
        Command approval required
      </div>
      <code className="mt-3 block rounded-2xl bg-black/50 p-3 text-xs">{command}</code>
      <div className="mt-4 flex gap-2">
        <button onClick={onApprove} className="rounded-full bg-amber-200 px-4 py-2 text-sm font-bold text-slate-950">
          Approve
        </button>
        <button onClick={onCancel} className="rounded-full border border-white/15 px-4 py-2 text-sm font-bold">
          Cancel
        </button>
      </div>
    </div>
  );
}
