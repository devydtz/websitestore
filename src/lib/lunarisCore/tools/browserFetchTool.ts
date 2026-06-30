const blockedHosts = [/^localhost$/i, /^127\./, /^10\./, /^192\.168\./, /^172\.(1[6-9]|2\d|3[01])\./, /^0\./, /^169\.254\./, /^::1$/];

function isBlockedUrl(url: URL) {
  if (!["http:", "https:"].includes(url.protocol)) return true;
  return blockedHosts.some((pattern) => pattern.test(url.hostname));
}

function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 8000);
}

export async function browserFetchTool(rawUrl: string) {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return "That is not a valid URL.";
  }

  if (isBlockedUrl(url)) {
    return "Blocked for safety. Lunaris Core will not fetch localhost, private network, file URLs, or non-web URLs.";
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url.toString(), { signal: controller.signal, headers: { accept: "text/html,text/plain,application/json" } });
    const text = await response.text();
    const title = text.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, " ").trim();
    return [
      `Fetched ${url.toString()}`,
      `Status: ${response.status}`,
      title ? `Title: ${title}` : "",
      "Extracted text:",
      stripHtml(text),
    ].filter(Boolean).join("\n");
  } catch (error) {
    return `Could not fetch that public page: ${error instanceof Error ? error.message : "unknown error"}`;
  } finally {
    window.clearTimeout(timeout);
  }
}
