export type Env = {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  COPILOT_LUNARIS_API_KEY?: string;
};

type JsonInit = ResponseInit & {
  headers?: Record<string, string>;
};

const baseHeaders = {
  "content-type": "application/json",
  "cache-control": "no-store",
};

export function json(body: unknown, init: JsonInit = {}) {
  return new Response(JSON.stringify(body, null, 2), {
    ...init,
    headers: {
      ...baseHeaders,
      ...(init.headers || {}),
    },
  });
}

export function normalizeSupabaseUrl(url: string) {
  return url.trim().replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
}

export function getRequiredEnv(env: Env) {
  const supabaseUrl = env.SUPABASE_URL ? normalizeSupabaseUrl(env.SUPABASE_URL) : "";
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!supabaseUrl || !serviceRoleKey) {
    return {
      ok: false as const,
      response: json(
        {
          error: "Server-side Supabase access is not configured for Copilot.",
          missing: {
            SUPABASE_URL: !supabaseUrl,
            SUPABASE_SERVICE_ROLE_KEY: !serviceRoleKey,
          },
        },
        { status: 500 },
      ),
    };
  }

  return { ok: true as const, supabaseUrl, serviceRoleKey };
}

export function verifyCopilotKey(request: Request, env: Env) {
  const expected = env.COPILOT_LUNARIS_API_KEY || "";
  if (!expected) {
    return {
      ok: false as const,
      response: json(
        {
          error: "Copilot API key is not configured.",
          missing: "COPILOT_LUNARIS_API_KEY",
        },
        { status: 500 },
      ),
    };
  }

  const headerKey = request.headers.get("x-lunaris-copilot-key")?.trim() || "";
  const bearer = request.headers.get("authorization") || "";
  const bearerKey = bearer.startsWith("Bearer ") ? bearer.slice("Bearer ".length).trim() : "";
  const provided = headerKey || bearerKey;

  if (!provided || provided !== expected) {
    return {
      ok: false as const,
      response: json(
        {
          error: "Unauthorized.",
          detail: "Valid Copilot API key required.",
        },
        { status: 401 },
      ),
    };
  }

  return { ok: true as const };
}

export async function supabaseRest<T>(env: Env, path: string) {
  const config = getRequiredEnv(env);
  if (!config.ok) throw new Error("Supabase config missing");

  const response = await fetch(`${config.supabaseUrl}/rest/v1/${path}`, {
    headers: {
      apikey: config.serviceRoleKey,
      authorization: `Bearer ${config.serviceRoleKey}`,
      accept: "application/json",
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || `Supabase REST failed with HTTP ${response.status}`);
  }

  return (await response.json()) as T;
}

export function asInt(value: string | null, fallback: number, min = 1, max = 100) {
  const parsed = Number.parseInt(value || "", 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

export function asBool(value: string | null) {
  if (value == null || value === "") return undefined;
  if (["1", "true", "yes", "on"].includes(value.toLowerCase())) return true;
  if (["0", "false", "no", "off"].includes(value.toLowerCase())) return false;
  return undefined;
}

export function asText(value: string | null) {
  return (value || "").trim();
}

export function safeLike(value: string) {
  return encodeURIComponent(`*${value.replace(/\*/g, "").trim()}*`);
}

