import { Loader2 } from "lucide-react";

export function LunarisCoreAnalyzingPanel({ steps }: { steps: string[] }) {
  return (
    <div className="rounded-3xl border border-purple-200 bg-white p-4">
      <div className="mb-3 flex items-center gap-2 font-black text-purple-800">
        <Loader2 className="h-4 w-4 animate-spin" />
        Analyzing
      </div>
      <div className="grid gap-2">
        {steps.map((step) => (
          <div key={step} className="rounded-2xl bg-purple-50 px-3 py-2 text-sm font-bold text-slate-600">
            {step}
          </div>
        ))}
      </div>
    </div>
  );
}
