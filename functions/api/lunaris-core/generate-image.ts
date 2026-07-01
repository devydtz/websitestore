type Env = {
  AI?: {
    run: (model: string, input: unknown) => Promise<unknown>;
  };
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  LUNARIS_IMAGE_MODEL?: string;
};

type AdminProfile = {
  role?: "owner" | "admin" | "staff" | "viewer";
};

function json(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json",
      ...init.headers,
    },
  });
}

function safeText(value: unknown, maxLength = 1800) {
  return String(value ?? "")
    .replace(/(service[_-]?role[_-]?key\s*[:=]\s*)[^\s"']+/gi, "$1[hidden]")
    .replace(/(api[_-]?key\s*[:=]\s*)[^\s"']+/gi, "$1[hidden]")
    .replace(/(token\s*[:=]\s*)[^\s"']+/gi, "$1[hidden]")
    .replace(/(password\s*[:=]\s*)[^\s"']+/gi, "$1[hidden]")
    .slice(0, maxLength)
    .trim();
}

function normalizeSupabaseUrl(url: string) {
  return url.trim().replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
}

async function verifyAdmin(request: Request, env: Env) {
  const auth = request.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length).trim() : "";
  const supabaseUrl = env.VITE_SUPABASE_URL ? normalizeSupabaseUrl(env.VITE_SUPABASE_URL) : "";
  const anonKey = env.VITE_SUPABASE_ANON_KEY || "";

  if (!token) return { ok: false as const, status: 401, error: "Admin session required." };
  if (!supabaseUrl || !anonKey) return { ok: false as const, status: 500, error: "Supabase auth is not configured for Lunaris Core." };

  const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: anonKey,
      authorization: `Bearer ${token}`,
    },
  });
  if (!userResponse.ok) return { ok: false as const, status: 401, error: "Invalid admin session." };

  const user = (await userResponse.json().catch(() => null)) as { id?: string } | null;
  if (!user?.id) return { ok: false as const, status: 401, error: "Invalid admin user." };

  const profileResponse = await fetch(`${supabaseUrl}/rest/v1/admin_profiles?id=eq.${encodeURIComponent(user.id)}&select=role&limit=1`, {
    headers: {
      apikey: anonKey,
      authorization: `Bearer ${token}`,
      accept: "application/json",
    },
  });
  if (!profileResponse.ok) return { ok: false as const, status: 403, error: "Admin profile check failed." };

  const profiles = (await profileResponse.json().catch(() => [])) as AdminProfile[];
  const profile = profiles[0];
  if (!profile?.role || !["owner", "admin", "staff"].includes(profile.role)) {
    return { ok: false as const, status: 403, error: "Owner, admin, or staff access required." };
  }

  return { ok: true as const };
}

function extractImage(result: unknown) {
  if (!result || typeof result !== "object") return "";
  const record = result as Record<string, unknown>;
  if (typeof record.image === "string") return record.image;
  if (typeof record.result === "string") return record.result;
  if (record.result && typeof record.result === "object" && typeof (record.result as Record<string, unknown>).image === "string") {
    return (record.result as Record<string, string>).image;
  }
  return "";
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const admin = await verifyAdmin(request, env);
  if (!admin.ok) return json({ error: admin.error }, { status: admin.status });

  if (!env.AI) {
    return json({ error: "Cloudflare Workers AI binding is not configured." }, { status: 503 });
  }

  const body = (await request.json().catch(() => null)) as { prompt?: string } | null;
  const prompt = safeText(body?.prompt, 1600);
  if (!prompt) return json({ error: "Prompt is required." }, { status: 400 });

  const model = env.LUNARIS_IMAGE_MODEL || "@cf/black-forest-labs/flux-1-schnell";

  try {
    const result = await env.AI.run(model, {
      prompt,
      seed: Math.floor(Math.random() * 1_000_000),
    });
    const image = extractImage(result);
    if (!image) return json({ error: "Cloudflare image model returned no image." }, { status: 502 });
    return json({
      image: `data:image/jpeg;charset=utf-8;base64,${image}`,
      model,
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Cloudflare image generation failed." }, { status: 502 });
  }
};

export const onRequest: PagesFunction<Env> = async ({ request }) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204 });
  return json({ error: "Method not allowed." }, { status: 405 });
};
