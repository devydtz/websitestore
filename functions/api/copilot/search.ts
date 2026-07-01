import { asText, json, safeLike, supabaseRest, verifyCopilotKey, type Env } from "./_shared";

type OrderMatch = {
  id: string;
  username?: string | null;
  email?: string | null;
  status?: string | null;
  total_display?: string | null;
};

type AccountMatch = {
  id: string;
  username?: string | null;
  email?: string | null;
  display_name?: string | null;
};

type ProductMatch = {
  id: string;
  name?: string | null;
  category?: string | null;
  tagline?: string | null;
};

type PromoMatch = {
  code: string;
  label?: string | null;
  description?: string | null;
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = verifyCopilotKey(request, env);
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const q = asText(url.searchParams.get("q"));

  if (!q) {
    return json({ error: "Search query 'q' is required." }, { status: 400 });
  }

  try {
    const like = safeLike(q);
    const [orders, accounts, products, promos] = await Promise.all([
      supabaseRest<OrderMatch[]>(
        env,
        `orders?select=id,username,email,status,total_display&or=(username.ilike.${like},email.ilike.${like},id.ilike.${like})&limit=8&order=created_at.desc`,
      ),
      supabaseRest<AccountMatch[]>(
        env,
        `accounts?select=id,username,email,display_name&or=(username.ilike.${like},email.ilike.${like},display_name.ilike.${like})&limit=8&order=created_at.desc`,
      ),
      supabaseRest<ProductMatch[]>(
        env,
        `store_products?select=id,name,category,tagline&or=(id.ilike.${like},name.ilike.${like},tagline.ilike.${like})&limit=8&order=sort_order.asc`,
      ),
      supabaseRest<PromoMatch[]>(
        env,
        `promo_codes?select=code,label,description&or=(code.ilike.${like},label.ilike.${like},description.ilike.${like})&limit=8&order=created_at.desc`,
      ),
    ]);

    return json({
      ok: true,
      query: q,
      results: {
        orders,
        accounts,
        products,
        promos,
      },
    });
  } catch (error) {
    return json(
      {
        error: error instanceof Error ? error.message : "Could not search Lunaris data.",
      },
      { status: 500 },
    );
  }
};

export const onRequest: PagesFunction<Env> = async ({ request }) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204 });
  return json({ error: "Method not allowed." }, { status: 405 });
};
