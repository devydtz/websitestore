import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { LunarisToolResult } from "../toolRouter";

function cleanPrompt(message: string) {
  return message
    .replace(/\b(generate|create|make|draw)\b/gi, "")
    .replace(/\b(image|picture|photo|art|logo|icon|wallpaper|banner)\b/gi, "")
    .replace(/\buploaded context:[\s\S]*$/i, "")
    .replace(/^(of|for|about|with)\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function imageGeneratorTool(message: string): Promise<LunarisToolResult> {
  const prompt = (cleanPrompt(message) || message.trim()).slice(0, 900);
  if (!prompt) {
    return {
      answer: "Tell me what image you want me to generate.",
      source: "Lunaris Core image generator.",
    };
  }

  const supabase = getSupabaseBrowserClient();
  if (!supabase.ok) {
    return {
      answer: `Image generation is not ready because Supabase auth is not connected: ${supabase.error}`,
      source: "Lunaris Core image generator.",
      tools: [{ name: "Image Generator", status: "error", summary: "Supabase auth was unavailable." }],
    };
  }

  const session = await supabase.client.auth.getSession();
  const token = session.data.session?.access_token;
  if (!token) {
    return {
      answer: "Sign in as an admin first, then I can generate images through Cloudflare AI.",
      source: "Lunaris Core image generator.",
      tools: [{ name: "Image Generator", status: "error", summary: "Admin session was missing." }],
    };
  }

  try {
    const response = await fetch("/api/lunaris-core/generate-image", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ prompt }),
    });
    const data = (await response.json().catch(() => null)) as { image?: string; error?: string; model?: string } | null;

    if (!response.ok || !data?.image) {
      return {
        answer: `Image generation failed${data?.error ? `: ${data.error}` : "."}`,
        source: "Cloudflare Workers AI image endpoint.",
        tools: [{ name: "Image Generator", status: "error", summary: data?.error || `HTTP ${response.status}` }],
      };
    }

    return {
      answer: `Generated image: ${prompt}`,
      source: data.model || "Cloudflare Workers AI image model.",
      generatedImages: [{ id: crypto.randomUUID?.() || `${Date.now()}`, prompt, url: data.image }],
      tools: [{ name: "Image Generator", status: "done", summary: `Generated an image with ${data.model || "Cloudflare Workers AI"}.` }],
    };
  } catch (error) {
    return {
      answer: `Image generation failed: ${error instanceof Error ? error.message : "unknown error"}`,
      source: "Cloudflare Workers AI image endpoint.",
      tools: [{ name: "Image Generator", status: "error", summary: "The image endpoint request failed." }],
    };
  }
}
