import type { LunarisCoreAttachment } from "@/lib/lunarisCore/client";

export function LunarisCoreAttachmentTray({ files }: { files: LunarisCoreAttachment[] }) {
  if (!files.length) return null;
  return (
    <div className="flex gap-2 overflow-x-auto">
      {files.map((file) => (
        <span key={file.id} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-bold">
          {file.name}
        </span>
      ))}
    </div>
  );
}
