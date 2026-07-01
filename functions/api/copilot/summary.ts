import { json, supabaseRest, verifyCopilotKey, type Env } from "./_shared";

type OrderRow = {
  id: string;
  status?: string | null;
  total_cents?: number | null;
};

type ProductRow = {
  id: string;
  category?: string | null;
  is_active?: boolean | null;
};

type AccountRow = {
  id: string;
  email_verified?: boolean | null;
  disabled?: boolean | null;
};

type PromoRow = {
  code: string;
  active?: boolean | null;
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = verifyCopilotKey(request, env);
  if (!auth.ok) return auth.response;

  try {
    const [orders, products, accounts, promos] = await Promise.all([
      supabaseRest<OrderRow[]>(env, "orders?select=id,status,total_cents"),
      supabaseRest<ProductRow[]>(env, "store_products?select=id,category,is_active"),
      supabaseRest<AccountRow[]>(env, "accounts?select=id,email_verified,disabled"),
      supabaseRest<PromoRow[]>(env, "promo_codes?select=code,active"),
    ]);

    const orderCounts = {
      total: orders.length,
      pending: orders.filter((order) => order.status === "pending").length,
      confirmed: orders.filter((order) => order.status === "confirmed").length,
      rejected: orders.filter((order) => order.status === "rejected").length,
      delivered: orders.filter((order) => order.status === "delivered").length,
    };

    const productCategories = products.reduce<Record<string, number>>((map, product) => {
      const key = product.category || "uncategorized";
      map[key] = (map[key] || 0) + 1;
      return map;
    }, {});

    return json({
      ok: true,
      summary: {
        orders: {
          ...orderCounts,
          gross_revenue_cents: orders.reduce((sum, order) => sum + Number(order.total_cents || 0), 0),
        },
        products: {
          total: products.length,
          active: products.filter((product) => product.is_active !== false).length,
          inactive: products.filter((product) => product.is_active === false).length,
          by_category: productCategories,
        },
        accounts: {
          total: accounts.length,
          verified: accounts.filter((account) => Boolean(account.email_verified)).length,
          disabled: accounts.filter((account) => Boolean(account.disabled)).length,
        },
        promos: {
          total: promos.length,
          active: promos.filter((promo) => promo.active !== false).length,
          inactive: promos.filter((promo) => promo.active === false).length,
        },
      },
      generated_at: new Date().toISOString(),
    });
  } catch (error) {
    return json(
      {
        error: error instanceof Error ? error.message : "Could not load Lunaris summary.",
      },
      { status: 500 },
    );
  }
};

export const onRequest: PagesFunction<Env> = async ({ request }) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204 });
  return json({ error: "Method not allowed." }, { status: 405 });
};
