import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import { connect as netConnect } from "node:net";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const ADMIN_PASSWORD = Deno.env.get("ADMIN_PASSWORD") ?? "lunaris-admin-2024";
const RCON_HOST = Deno.env.get("RCON_HOST") ?? "";
const RCON_PORT = Deno.env.get("RCON_PORT") ?? "25575";
const RCON_PASSWORD = Deno.env.get("RCON_PASSWORD") ?? "";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

type OrderItem = { id: string; name: string; price: string; qty: number };
type Order = {
  id: string;
  username: string;
  edition: "java" | "bedrock";
  email: string;
  items: OrderItem[];
  total_cents: number;
  total_display: string;
  status: string;
  admin_note: string | null;
  delivered_at: string | null;
  delivery_log: { command: string; ok: boolean; response?: string }[] | null;
  created_at: string;
};

// ---- Minimal RCON client (Source RCON protocol) ----
const SERVERDATA_AUTH = 3;
const SERVERDATA_EXECCOMMAND = 2;
const SERVERDATA_RESPONSE_VALUE = 0;

function rconPacket(id: number, type: number, body: string): Uint8Array {
  const payload = new TextEncoder().encode(body);
  const len = 4 + 4 + 4 + payload.length + 2; // id + type + len-payload + payload + 2 null
  const buf = new Uint8Array(4 + len);
  const dv = new DataView(buf.buffer);
  dv.setUint32(0, len, true);
  dv.setInt32(4, id, true);
  dv.setInt32(8, type, true);
  buf.set(payload, 12);
  // last two bytes are null terminators (already 0)
  return buf;
}

function readPacket(buf: Uint8Array): { id: number; type: number; body: string; size: number } | null {
  if (buf.length < 12) return null;
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const size = dv.getUint32(0, true);
  if (buf.length < 4 + size) return null;
  const id = dv.getInt32(4, true);
  const type = dv.getInt32(8, true);
  const bodyBytes = buf.slice(12, 4 + size - 2);
  return { id, type, body: new TextDecoder().decode(bodyBytes), size: 4 + size };
}

async function rconCommand(host: string, port: number, password: string, command: string): Promise<{ ok: boolean; response: string }> {
  return new Promise((resolve) => {
    if (!host) {
      resolve({ ok: false, response: "RCON_HOST not configured" });
      return;
    }
    const socket = netConnect({ host, port: Number(port) });
    let buffer = new Uint8Array(0);
    let authenticated = false;
    let commandSent = false;
    let settled = false;
    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        socket.destroy();
        resolve({ ok: false, response: "RCON timeout" });
      }
    }, 8000);

    const finish = (result: { ok: boolean; response: string }) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      socket.destroy();
      resolve(result);
    };

    socket.on("error", (err) => finish({ ok: false, response: err.message }));

    socket.on("data", (chunk: Uint8Array) => {
      const merged = new Uint8Array(buffer.length + chunk.length);
      merged.set(buffer, 0);
      merged.set(chunk, buffer.length);
      buffer = merged;

      let pkt = readPacket(buffer);
      while (pkt) {
        if (!authenticated) {
          if (pkt.id === -1 || pkt.type !== SERVERDATA_RESPONSE_VALUE) {
            finish({ ok: false, response: "RCON auth failed (bad password)" });
            return;
          }
          authenticated = true;
          socket.write(rconPacket(1, SERVERDATA_EXECCOMMAND, command));
          commandSent = true;
        } else if (commandSent && pkt.id === 1) {
          finish({ ok: true, response: pkt.body || "OK" });
          return;
        }
        buffer = buffer.slice(pkt.size);
        pkt = readPacket(buffer);
      }
    });

    socket.on("connect", () => {
      socket.write(rconPacket(0, SERVERDATA_AUTH, password));
    });
  });
}

// ---- Command generation per item ----
function commandsForItem(item: OrderItem, username: string): string[] {
  const name = item.name.toLowerCase();
  const cmds: string[] = [];

  // Ranks: detected by "rank" keyword or known rank names
  if (
    !name.includes("bundle") &&
    !name.includes("package") &&
    (
      name.includes("rank") ||
      name.includes("crescent") ||
      name.includes("nebula") ||
      name.includes("solstice") ||
      name.includes("celestial") ||
      name.includes("monarch")
    )
  ) {
    // Give the rank via a permission plugin (LuckPerms style)
    const rank = extractRank(name);
    if (rank) cmds.push(`lp user ${username} parent add ${rank}`);
    return cmds;
  }

  // Keys: detected by "key" keyword
  if (name.includes("key") || name.includes("crate")) {
    cmds.push(`say Keys are coming soon. Manual review needed for ${username}.`);
    return cmds;
  }

  // Bundles: detected by "bundle" keyword
  if (name.includes("bundle") || name.includes("package") || name.includes("starter")) {
    cmds.push(`say Bundles are coming soon. Manual review needed for ${username}.`);
    return cmds;
  }

  // Fallback: do not give unknown products automatically.
  cmds.push(`say Unknown store product for ${username}. Manual review needed.`);
  return cmds;
}

function extractRank(name: string): string | null {
  if (name.includes("monarch")) return "monarch";
  if (name.includes("celestial") || name.includes("lunar")) return "celestial";
  if (name.includes("solstice") || name.includes("adventurer")) return "solstice";
  if (name.includes("nebula")) return "nebula";
  if (name.includes("crescent") || name.includes("starter") || name.includes("guild")) return "crescent";
  return null;
}

// ---- Main handler ----
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { orderId, action, adminToken, note } = await req.json();

    if (!orderId || !action) {
      return json({ error: "Missing orderId or action" }, 400);
    }
    if (adminToken !== ADMIN_PASSWORD) {
      return json({ error: "Unauthorized: invalid admin token" }, 403);
    }
    if (action !== "confirm" && action !== "reject") {
      return json({ error: "Invalid action" }, 400);
    }

    // Fetch the order
    const { data: order, error: fetchErr } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .maybeSingle<Order>();

    if (fetchErr) return json({ error: fetchErr.message }, 500);
    if (!order) return json({ error: "Order not found" }, 404);
    if (order.status !== "pending") {
      return json({ error: `Order is already ${order.status}` }, 409);
    }

    if (action === "reject") {
      const { data: updated, error: updErr } = await supabase
        .from("orders")
        .update({
          status: "rejected",
          admin_note: note ?? order.admin_note,
        })
        .eq("id", orderId)
        .select("*")
        .maybeSingle<Order>();
      if (updErr) return json({ error: updErr.message }, 500);
      return json({ order: updated });
    }

    // action === "confirm" — deliver in-game via RCON
    const displayName = order.edition === "bedrock" ? `.${order.username}` : order.username;
    const allCommands: string[] = [];
    for (const item of order.items) {
      allCommands.push(...commandsForItem(item, displayName));
    }
    // Always add an announcement
    allCommands.push(
      `say &6${displayName} &7received their store purchase &a#${order.id}&7. Thank you for supporting Lunaris Craft!`,
    );

    const deliveryLog: { command: string; ok: boolean; response?: string }[] = [];
    const rconHost = RCON_HOST;
    const rconPort = Number(RCON_PORT);

    for (const cmd of allCommands) {
      const result = await rconCommand(rconHost, rconPort, RCON_PASSWORD, cmd);
      deliveryLog.push({ command: cmd, ok: result.ok, response: result.response });
    }

    const allOk = deliveryLog.every((l) => l.ok);

    const { data: updated, error: updErr } = await supabase
      .from("orders")
      .update({
        status: allOk ? "delivered" : "confirmed",
        admin_note: note ?? order.admin_note,
        delivered_at: allOk ? new Date().toISOString() : null,
        delivery_log: deliveryLog,
      })
      .eq("id", orderId)
      .select("*")
      .maybeSingle<Order>();

    if (updErr) return json({ error: updErr.message }, 500);

    return json({
      order: updated,
      delivery: { allOk, log: deliveryLog },
    });
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
