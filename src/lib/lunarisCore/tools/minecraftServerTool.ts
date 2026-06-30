type McSrvStatus = {
  online?: boolean;
  ip?: string;
  port?: number;
  hostname?: string;
  version?: string;
  protocol?: { name?: string; version?: number };
  players?: {
    online?: number;
    max?: number;
    list?: Array<{ name?: string } | string>;
  };
  motd?: {
    clean?: string[];
    raw?: string[];
  };
  debug?: {
    ping?: boolean;
    query?: boolean;
    srv?: boolean;
  };
};

const serverAddress = "lunaris.ultraga.me";
const serverPort = 19075;

function cleanLine(value: unknown) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function playerName(player: { name?: string } | string) {
  return typeof player === "string" ? player : player.name || "";
}

export async function minecraftServerTool() {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(`https://api.mcsrvstat.us/3/${serverAddress}:${serverPort}`, {
      signal: controller.signal,
      headers: { accept: "application/json" },
    });
    if (!response.ok) {
      return `I could not check the Minecraft server right now. The status lookup returned HTTP ${response.status}.`;
    }

    const data = (await response.json()) as McSrvStatus;
    if (!data.online) {
      return [
        "The public status lookup says the Minecraft server is offline or unreachable right now.",
        `Address checked: ${serverAddress}`,
        `Port checked: ${serverPort}`,
        "This does not use RCON, so it only confirms public reachability from the status API.",
      ].join("\n");
    }

    const online = Number(data.players?.online ?? 0);
    const max = Number(data.players?.max ?? 0);
    const names = (data.players?.list ?? []).map(playerName).map(cleanLine).filter(Boolean).slice(0, 20);
    const motd = (data.motd?.clean ?? []).map(cleanLine).filter(Boolean).join(" ");
    const version = cleanLine(data.version || data.protocol?.name || "Unknown version");

    return [
      `The Minecraft server is online.`,
      `Players online: ${online}${max ? ` / ${max}` : ""}`,
      `Server address: ${serverAddress}`,
      `Port: ${serverPort}`,
      `Version: ${version}`,
      motd ? `MOTD: ${motd}` : "",
      names.length ? `Visible players: ${names.join(", ")}` : "Visible player names were not returned by the public status lookup.",
      "Note: this is public status data, not a private RCON command result.",
    ]
      .filter(Boolean)
      .join("\n");
  } catch (error) {
    const message = error instanceof Error && error.name === "AbortError" ? "status lookup timed out" : error instanceof Error ? error.message : "unknown error";
    return `I could not check the Minecraft server right now because the ${message}.`;
  } finally {
    window.clearTimeout(timeout);
  }
}
