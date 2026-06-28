export async function onRequestPost({ request, env }) {
  const webhookUrl = env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    return Response.json({ ok: false, error: "DISCORD_WEBHOOK_URL is not configured." }, { status: 200 });
  }

  try {
    const body = await request.json();
    const title = body.title || "Lunaris Store Update";
    const description = body.description || "A store event happened.";
    const color = Number(body.color || 12429311);

    const discordRes = await fetch(webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        username: "Lunaris Store",
        avatar_url: "https://mclunaris.store/pwa-192.png",
        embeds: [
          {
            title,
            description,
            color,
            timestamp: new Date().toISOString(),
            fields: Array.isArray(body.fields) ? body.fields.slice(0, 8) : [],
          },
        ],
      }),
    });

    if (!discordRes.ok) {
      return Response.json({ ok: false, error: `Discord returned ${discordRes.status}` }, { status: 200 });
    }

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : String(error) }, { status: 200 });
  }
}
