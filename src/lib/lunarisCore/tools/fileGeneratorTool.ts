export function fileGeneratorTool(message: string) {
  return [
    "I can generate downloadable text-based files from my response.",
    "Use the download buttons under this answer to save it as Markdown or text.",
    "Supported right now: .md, .txt, .json-style text, .csv-style text, HTML snippets, reports, SQL snippets, and code snippets.",
    "Binary exports like .docx, .xlsx, and .pdf need a server-side generator before I can create them directly inside the admin panel.",
    "",
    `Draft file content request: ${message}`,
  ].join("\n");
}
