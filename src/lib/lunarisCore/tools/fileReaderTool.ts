import type { LunarisCoreAttachment } from "../client";

function describeFile(file: LunarisCoreAttachment) {
  const sizeKb = `${Math.max(1, Math.round(file.size / 1024))} KB`;
  if (file.text) {
    const lines = file.text.split(/\r?\n/);
    const preview = file.text.slice(0, 2500);
    return [
      `${file.name}`,
      `- Type: ${file.type || "unknown"}`,
      `- Size: ${sizeKb}`,
      `- Readable text: yes`,
      `- Lines loaded: ${lines.length}`,
      `- Preview:\n${preview}${file.text.length > preview.length ? "\n...[trimmed]" : ""}`,
    ].join("\n");
  }

  if (file.kind === "image") {
    return [
      `${file.name}`,
      `- Type: ${file.type || "image"}`,
      `- Size: ${sizeKb}`,
      `- Readable text: no`,
      `- Visual preview: yes`,
      `- Use image analysis for actual visual inspection.`,
    ].join("\n");
  }

  if (/pdf/i.test(file.type) || /\.pdf$/i.test(file.name)) {
    return [
      `${file.name}`,
      `- Type: PDF`,
      `- Size: ${sizeKb}`,
      `- Readable text: not extracted in browser yet`,
      `- Best action: upload a text export or screenshot, or ask Core to add PDF text extraction next.`,
    ].join("\n");
  }

  return [
    `${file.name}`,
    `- Type: ${file.type || "unknown"}`,
    `- Size: ${sizeKb}`,
    `- Readable text: no`,
    `- This looks like a binary/unsupported file. Core can see the filename and metadata only.`,
  ].join("\n");
}

export function fileReaderTool(attachments: LunarisCoreAttachment[]) {
  if (!attachments.length) return "No uploaded files were attached.";
  return [
    `Uploaded file reader loaded ${attachments.length} file${attachments.length === 1 ? "" : "s"}.`,
    ...attachments.map(describeFile),
  ].join("\n\n");
}
