import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { LunarisCoreAttachment, LunarisCoreToolTrace } from "../client";

export type ImageReaderResult = {
  answer: string;
  tools: LunarisCoreToolTrace[];
};

export async function imageReaderTool(attachments: LunarisCoreAttachment[], prompt: string): Promise<ImageReaderResult> {
  const images = attachments.filter((file) => file.kind === "image" && file.preview).slice(0, 4);
  if (!images.length) {
    return { answer: "No image was attached.", tools: [] };
  }

  const supabase = getSupabaseBrowserClient();
  if (!supabase.ok) {
    return {
      answer: `${images.length} image${images.length === 1 ? "" : "s"} attached, but visual analysis is unavailable because Supabase auth is not connected: ${supabase.error}`,
      tools: [{ name: "Image Vision", status: "error", summary: "Supabase auth was unavailable for image analysis." }],
    };
  }

  const session = await supabase.client.auth.getSession();
  const token = session.data.session?.access_token;
  if (!token) {
    return {
      answer: `${images.length} image${images.length === 1 ? "" : "s"} attached. Sign in as an admin first so Core can analyze images through Cloudflare AI.`,
      tools: [{ name: "Image Vision", status: "error", summary: "Admin session was missing for image analysis." }],
    };
  }

  try {
    const response = await fetch("/api/lunaris-core/analyze-image", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        prompt: prompt || "Describe and analyze this uploaded image clearly.",
        images: images.map((image) => ({
          name: image.name,
          type: image.type,
          dataUrl: image.preview,
        })),
      }),
    });
    const data = (await response.json().catch(() => null)) as { answer?: string; error?: string; model?: string } | null;

    if (!response.ok || !data?.answer) {
      return {
        answer: `${images.length} image${images.length === 1 ? "" : "s"} attached, but visual analysis failed${data?.error ? `: ${data.error}` : "."}`,
        tools: [{ name: "Image Vision", status: "error", summary: data?.error || `HTTP ${response.status}` }],
      };
    }

    return {
      answer: [`Uploaded image analysis:`, data.answer].join("\n"),
      tools: [{ name: "Image Vision", status: "done", summary: `Analyzed ${images.length} image${images.length === 1 ? "" : "s"} with ${data.model || "Cloudflare Vision AI"}.` }],
    };
  } catch (error) {
    return {
      answer: `${images.length} image${images.length === 1 ? "" : "s"} attached, but visual analysis failed: ${error instanceof Error ? error.message : "unknown error"}`,
      tools: [{ name: "Image Vision", status: "error", summary: "The image analysis endpoint request failed." }],
    };
  }
}
