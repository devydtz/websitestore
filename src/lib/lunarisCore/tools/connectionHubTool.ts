const connectedCapabilities = [
  "Lunaris project/code knowledge",
  "Supabase admin data scanner",
  "Orders/accounts/products/promos helpers",
  "Minecraft public status checker",
  "Protected Minecraft command bridge",
  "Free public web research links",
  "File/image upload previews",
  "Text/Markdown answer export",
  "Calculator and date/time tools",
];

const notConnectedYet = [
  "Private Facebook/TikTok/YouTube account data",
  "Paid universal web search APIs",
  "Real image generation endpoint",
  "Real document/PDF/XLSX binary generator inside Cloudflare",
  "Unrestricted shell/code execution",
];

export function connectionHubTool() {
  return [
    "I am connected to the main Lunaris admin tools that are safe to run from the website.",
    "",
    "Connected now:",
    ...connectedCapabilities.map((item) => `- ${item}`),
    "",
    "Not connected yet:",
    ...notConnectedYet.map((item) => `- ${item}`),
    "",
    "I can still answer broad questions with built-in knowledge and Cloudflare AI, but live/private data needs a real tool connection before I treat it as fact.",
  ].join("\n");
}
