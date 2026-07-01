import { asBool, asInt, asText, json, supabaseRest, verifyCopilotKey, type Env } from "./_shared";

type ProductRow = {
  id: string;
  category?: string | null;
  name?: string | null;
  tagline?: string | null;
  price?: string | null;
  compare_at_price?: string | null;
  is_active?: boolean | null;
  featured?: boolean | null;
  sort_order?: number | null;
  perks?: unknown;
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = verifyCopilotKey(request, env);
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const limit = asInt(url.searchParams.get("limit"), 100, 1, 250);
  const category = asText(url.searchParams.get("category"));
  const active = asBool(url.searchParams.get("active"));
  const featured = asBool(url.searchParams.get("featured"));

  try {
    const query = [
      "select=id,category,name,tagline,price,compare_at_price,is_active,featured,sort_order,perks",
      category ? `category=eq.${encodeURIComponent(category)}` : "",
      active === undefined ? "" : `is_active=eq.${active}`,
      featured === undefined ? "" : `featured=eq.${featured}`,
      "order=category.asc,sort_order.asc",
      `limit=${limit}`,
    ]
      .filter(Boolean)
      .join("&");

    const products = await supabaseRest<ProductRow[]>(env, `store_products?${query}`);
    return json({
      ok: true,
      count: products.length,
      products: products.map((product) => ({
        id: product.id,
        category: product.category || "unknown",
        name: product.name || "",
        tagline: product.tagline || "",
        price: product.price || null,
        compare_at_price: product.compare_at_price || null,
        is_active: product.is_active !== false,
        featured: Boolean(product.featured),
        sort_order: Number(product.sort_order || 0),
        perks: Array.isArray(product.perks) ? product.perks : [],
      })),
    });
  } catch (error) {
    return json(
      {
        error: error instanceof Error ? error.message : "Could not load Lunaris products.",
      },
      { status: 500 },
    );
  }
};

export const onRequest: PagesFunction<Env> = async ({ request }) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204 });
  return json({ error: "Method not allowed." }, { status: 405 });
};
