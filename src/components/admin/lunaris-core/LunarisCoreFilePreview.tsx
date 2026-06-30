import type { LunarisCoreAttachment } from "@/lib/lunarisCore/client";

export function LunarisCoreFilePreview({ file }: { file: LunarisCoreAttachment }) {
  return <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold">{file.name}</div>;
}
