import { asBool, asInt, asText, json, supabaseRest, verifyCopilotKey, type Env } from "./_shared";

type AccountRow = {
  id: string;
  username?: string | null;
  email?: string | null;
  display_name?: string | null;
  edition?: string | null;
  email_verified?: boolean | null;
  disabled?: boolean | null;
  history_count?: number | null;
  total_spent_cents?: number | null;
  total_spent_display?: string | null;
  created_at?: string | null;
  last_seen_at?: string | null;
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = verifyCopilotKey(request, env);
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const limit = asInt(url.searchParams.get("limit"), 50, 1, 250);
  const verified = asBool(url.searchParams.get("verified"));
  const disabled = asBool(url.searchParams.get("disabled"));
  const username = asText(url.searchParams.get("username"));

  try {
    const query = [
      "select=id,username,email,display_name,edition,email_verified,disabled,history_count,total_spent_cents,total_spent_display,created_at,last_seen_at",
      verified === undefined ? "" : `email_verified=eq.${verified}`,
      disabled === undefined ? "" : `disabled=eq.${disabled}`,
      username ? `username=ilike.${encodeURIComponent(`*${username}*`)}` : "",
      "order=created_at.desc",
      `limit=${limit}`,
    ]
      .filter(Boolean)
      .join("&");

    const accounts = await supabaseRest<AccountRow[]>(env, `accounts?${query}`);
    return json({
      ok: true,
      count: accounts.length,
      accounts: accounts.map((account) => ({
        id: account.id,
        username: account.username || "",
        email: account.email || "",
        display_name: account.display_name || "",
        edition: account.edition || "",
        email_verified: Boolean(account.email_verified),
        disabled: Boolean(account.disabled),
        history_count: Number(account.history_count || 0),
        total_spent_cents: Number(account.total_spent_cents || 0),
        total_spent_display: account.total_spent_display || null,
        created_at: account.created_at || null,
        last_seen_at: account.last_seen_at || null,
      })),
    });
  } catch (error) {
    return json(
      {
        error: error instanceof Error ? error.message : "Could not load Lunaris accounts.",
      },
      { status: 500 },
    );
  }
};

export const onRequest: PagesFunction<Env> = async ({ request }) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204 });
  return json({ error: "Method not allowed." }, { status: 405 });
};
