import { getMinecraftNetworkStatus, runMinecraftCommand } from "@/lib/supabase";

const adminTokenKey = "lunaris.admin.token.v1";

function savedAdminToken() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(adminTokenKey) || "";
}

function extractCommand(message: string) {
  const trimmed = message.trim();
  if (trimmed.startsWith("/")) return trimmed.slice(1).trim();

  const match = trimmed.match(/\b(?:run|execute|send)\s+(?:minecraft\s+|server\s+|rcon\s+)?command\s*[:\-]\s*([\s\S]+)$/i);
  if (match?.[1]) return match[1].trim().replace(/^\//, "");

  return "";
}

function explainMissingToken() {
  return [
    "I can run Minecraft commands, but the admin password is not saved in this browser session.",
    "Open the admin panel, enter the admin password once, then come back and tell me the command again.",
    "Example: run command: list",
  ].join("\n");
}

export async function runCoreMinecraftCommand(message: string) {
  const command = extractCommand(message);
  if (!command) {
    return [
      "Tell me the exact command using this format:",
      "run command: list",
      "run command: say hello from Lunaris Core",
      "run command: lp user Devydtz parent add monarch",
    ].join("\n");
  }

  const token = savedAdminToken();
  if (!token) return explainMissingToken();

  const result = await runMinecraftCommand(token, command);
  if (!result.ok) {
    return [`Command failed: ${command}`, result.error].join("\n");
  }

  return [`Command ran: ${result.command}`, `Server response: ${result.response || "OK"}`].join("\n");
}

export async function getRconPlayerList() {
  const token = savedAdminToken();
  if (!token) return null;

  const result = await runMinecraftCommand(token, "list");
  if (!result.ok) {
    return `RCON player list failed: ${result.error}`;
  }

  return [`RCON player list:`, result.response || "No response returned."].join("\n");
}

export async function getDirectMinecraftNetworkStatus() {
  const token = savedAdminToken();
  if (!token) return null;

  const result = await getMinecraftNetworkStatus(token);
  if (!result.ok) {
    return `Direct public network ping failed: ${result.error}`;
  }

  const status = result.data.status;
  const online = Number(status?.players?.online ?? 0);
  const max = Number(status?.players?.max ?? 0);
  const names = (status?.players?.sample ?? []).map((player) => player.name).filter(Boolean).slice(0, 20);
  const version = status?.version?.name || "Unknown version";

  return [
    "Live public network ping:",
    `Players online: ${online}${max ? ` / ${max}` : ""}`,
    names.length ? `Visible players: ${names.join(", ")}` : "The server did not expose player names in the public status sample.",
    `Server address: ${result.data.host}`,
    `Port: ${result.data.port}`,
    `Version: ${version}`,
  ].join("\n");
}
