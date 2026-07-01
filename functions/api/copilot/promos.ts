import { asBool, asInt, json, supabaseRest, verifyCopilotKey, type Env } from "./_shared";

type PromoRow = {
  code: string;
  label?: string | null;
  description?: string | null;
  kind?: string | null;
  amount?: number | null;
  min_subtotal_cents?: number | null;
  active?: boolean | null;
  max_uses?: number | null;
  used_count?: number | null;
  max_uses_per_user?: number | null;
  expires_at?: string | null;
  created_at?: string | null;
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = verifyCopilotKey(request, env);
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const limit = asInt(url.searchParams.get("limit"), 100, 1, 250);
  const active = asBool(url.searchParams.get("active"));

  try {
    const query = [
      "select=code,label,description,kind,amount,min_subtotal_cents,active,max_uses,used_count,max_uses_per_user,expires_at,created_at",
      active === undefined ? "" : `active=eq.${active}`,
      "order=created_at.desc",
      `limit=${limit}`,
    ]
      .filter(Boolean)
      .join("&");

    const promos = await supabaseRest<PromoRow[]>(env, `promo_codes?${query}`);
    return json({
      ok: true,
      count: promos.length,
      promos: promos.map((promo) => ({
        code: promo.code,
        label: promo.label || "",
        description: promo.description || "",
        kind: promo.kind || "",
        amount: Number(promo.amount || 0),
        min_subtotal_cents: Number(promo.min_subtotal_cents || 0),
        active: promo.active !== false,
        max_uses: promo.max_uses ?? null,
        used_count: Number(promo.used_count || 0),
        max_uses_per_user: promo.max_uses_per_user ?? null,
        expires_at: promo.expires_at || null,
        created_at: promo.created_at || null,
      })),
    });
  } catch (error) {
    return json(
      {
        error: error instanceof Error ? error.message : "Could not load Lunaris promo codes.",
      },
      { status: 500 },
    );
  }
};

export const onRequest: PagesFunction<Env> = async ({ request }) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204 });
  return json({ error: "Method not allowed." }, { status: 405 });
};
