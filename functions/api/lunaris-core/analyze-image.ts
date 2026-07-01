type Env = {
  AI?: {
    run: (model: string, input: unknown) => Promise<unknown>;
  };
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  LUNARIS_VISION_MODEL?: string;
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

function safeText(value: unknown, maxLength = 3000) {
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

function dataUrlToBytes(dataUrl: string) {
  const base64 = dataUrl.includes(",") ? dataUrl.split(",").pop() || "" : dataUrl;
  const binary = atob(base64);
  return [...Uint8Array.from(binary, (char) => char.charCodeAt(0))];
}

function extractText(result: unknown) {
  if (typeof result === "string") return result;
  if (!result || typeof result !== "object") return "";
  const record = result as Record<string, unknown>;
  if (typeof record.response === "string") return record.response;
  if (typeof record.text === "string") return record.text;
  if (typeof record.result === "string") return record.result;
  if (record.result && typeof record.result === "object") {
    const nested = record.result as Record<string, unknown>;
    if (typeof nested.response === "string") return nested.response;
    if (typeof nested.text === "string") return nested.text;
  }
  return "";
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const admin = await verifyAdmin(request, env);
  if (!admin.ok) return json({ error: admin.error }, { status: admin.status });

  if (!env.AI) return json({ error: "Cloudflare Workers AI binding is not configured." }, { status: 503 });

  const body = (await request.json().catch(() => null)) as {
    prompt?: string;
    images?: Array<{ name?: string; type?: string; dataUrl?: string }>;
  } | null;
  const prompt = safeText(body?.prompt || "Describe and analyze this image clearly.", 1800);
  const image = body?.images?.find((item) => item?.dataUrl)?.dataUrl;
  if (!image) return json({ error: "At least one image is required." }, { status: 400 });

  const model = env.LUNARIS_VISION_MODEL || "@cf/meta/llama-3.2-11b-vision-instruct";

  try {
    const result = await env.AI.run(model, {
      image: dataUrlToBytes(image),
      prompt: [
        "Analyze the uploaded image for the Lunaris admin.",
        "Describe only what is visible. Do not invent hidden data, files, tables, or website state.",
        `Admin request: ${prompt}`,
      ].join("\n"),
      max_tokens: 700,
    });
    const answer = safeText(extractText(result), 4000);
    if (!answer) return json({ error: "Cloudflare vision model returned no text." }, { status: 502 });
    return json({ answer, model });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Cloudflare vision analysis failed." }, { status: 502 });
  }
};

export const onRequest: PagesFunction<Env> = async ({ request }) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204 });
  return json({ error: "Method not allowed." }, { status: 405 });
};
