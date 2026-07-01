import { getRequiredEnv, json, verifyCopilotKey, type Env } from "./_shared";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = verifyCopilotKey(request, env);
  if (!auth.ok) return auth.response;

  const config = getRequiredEnv(env);
  if (!config.ok) return config.response;

  return json({
    ok: true,
    service: "lunaris-copilot-api",
    microsoft_copilot_ready: true,
    auth_mode: "api_key_header_or_bearer",
    base_url: new URL(request.url).origin,
    timestamp: new Date().toISOString(),
  });
};

export const onRequest: PagesFunction<Env> = async ({ request }) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204 });
  return json({ error: "Method not allowed." }, { status: 405 });
};
