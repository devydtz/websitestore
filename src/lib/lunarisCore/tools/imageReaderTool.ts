import type { LunarisCoreAttachment } from "../client";

export function imageReaderTool(attachments: LunarisCoreAttachment[]) {
  const images = attachments.filter((file) => file.kind === "image");
  if (!images.length) return "No image was attached.";
  return [
    `${images.length} image${images.length === 1 ? "" : "s"} attached.`,
    "Visual AI inspection is not configured in this Cloudflare-only setup yet, but the image previews are available in the chat for admin review.",
  ].join("\n");
}
