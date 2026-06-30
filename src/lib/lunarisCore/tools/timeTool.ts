export function timeTool(timeZone = "Asia/Manila") {
  return new Intl.DateTimeFormat("en-PH", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    weekday: "long",
  }).format(new Date());
}
