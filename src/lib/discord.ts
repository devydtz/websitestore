type DiscordField = {
  name: string;
  value: string;
  inline?: boolean;
};

export async function notifyDiscord(input: {
  title: string;
  description: string;
  color?: number;
  fields?: DiscordField[];
}) {
  try {
    await fetch("/api/discord-webhook", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    // Discord alerts are helpful, but they should never block checkout/admin actions.
  }
}
