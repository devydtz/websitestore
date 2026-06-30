import type { LunarisCoreAttachment } from "../client";

export function fileReaderTool(attachments: LunarisCoreAttachment[]) {
  if (!attachments.length) return "No uploaded files were attached.";
  return attachments
    .map((file) => {
      const preview = file.text ? `\nPreview:\n${file.text.slice(0, 1200)}` : file.preview ? "\nPreview available in the chat." : "";
      return `${file.name} (${file.type || "unknown"}, ${file.size} bytes)${preview}`;
    })
    .join("\n\n");
}
