import { asInt, asText, json, supabaseRest, verifyCopilotKey, type Env } from "./_shared";

type OrderRow = {
  id: string;
  username?: string | null;
  email?: string | null;
  status?: string | null;
  total_display?: string | null;
  total_cents?: number | null;
  created_at?: string | null;
  reference_no?: string | null;
  admin_note?: string | null;
  items?: unknown;
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = verifyCopilotKey(request, env);
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const limit = asInt(url.searchParams.get("limit"), 25, 1, 100);
  const status = asText(url.searchParams.get("status"));
  const username = asText(url.searchParams.get("username"));

  try {
    const query = [
      "select=id,username,email,status,total_display,total_cents,created_at,reference_no,admin_note,items",
      status ? `status=eq.${encodeURIComponent(status)}` : "",
      username ? `username=ilike.${encodeURIComponent(`*${username}*`)}` : "",
      "order=created_at.desc",
      `limit=${limit}`,
    ]
      .filter(Boolean)
      .join("&");

    const orders = await supabaseRest<OrderRow[]>(env, `orders?${query}`);
    return json({
      ok: true,
      count: orders.length,
      orders: orders.map((order) => ({
        id: order.id,
        username: order.username || "",
        email: order.email || "",
        status: order.status || "unknown",
        total_display: order.total_display || null,
        total_cents: Number(order.total_cents || 0),
        created_at: order.created_at || null,
        reference_no: order.reference_no || null,
        admin_note: order.admin_note || null,
        item_count: Array.isArray(order.items) ? order.items.length : 0,
        items: Array.isArray(order.items) ? order.items : [],
      })),
    });
  } catch (error) {
    return json(
      {
        error: error instanceof Error ? error.message : "Could not load Lunaris orders.",
      },
      { status: 500 },
    );
  }
};

export const onRequest: PagesFunction<Env> = async ({ request }) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204 });
  return json({ error: "Method not allowed." }, { status: 405 });
};
