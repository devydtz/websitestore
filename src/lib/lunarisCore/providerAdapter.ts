import { getSupabaseBrowserClient } from "@/lib/supabase";

type ProviderInput = {
  message: string;
  intent: string;
  groundedAnswer: string;
  source: string;
  next: string;
};

export async function providerAdapter(input: ProviderInput): Promise<{ ok: true; answer: string; model?: string } | { ok: false; error: string }> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase.ok) return { ok: false, error: supabase.error };

  const session = await supabase.client.auth.getSession();
  const token = session.data.session?.access_token;
  if (!token) {
    return {
      ok: false,
      error: "Admin Supabase session is required before Cloudflare AI can answer.",
    };
  }

  try {
    const response = await fetch("/api/lunaris-core/chat", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(input),
    });
    const data = (await response.json().catch(() => null)) as { answer?: string; model?: string; error?: string } | null;
    if (!response.ok || !data?.answer) return { ok: false, error: data?.error || `Cloudflare AI failed with HTTP ${response.status}.` };
    return { ok: true, answer: data.answer, model: data.model };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Cloudflare AI request failed." };
  }
}
