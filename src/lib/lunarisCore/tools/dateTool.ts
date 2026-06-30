const dayMs = 24 * 60 * 60 * 1000;

export function dateTool(message: string, timeZone = "Asia/Manila") {
  const text = message.toLowerCase();
  const offset = text.includes("tomorrow") ? 1 : text.includes("yesterday") ? -1 : 0;
  const date = new Date(Date.now() + offset * dayMs);
  return new Intl.DateTimeFormat("en-PH", {
    timeZone,
    dateStyle: "full",
  }).format(date);
}
