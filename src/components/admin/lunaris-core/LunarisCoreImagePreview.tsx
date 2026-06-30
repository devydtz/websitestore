import type { LunarisCoreAttachment } from "@/lib/lunarisCore/client";

export function LunarisCoreImagePreview({ file }: { file: LunarisCoreAttachment }) {
  if (!file.preview) return null;
  return <img src={file.preview} alt={file.name} className="max-h-64 rounded-2xl border border-slate-200 object-cover" />;
}
