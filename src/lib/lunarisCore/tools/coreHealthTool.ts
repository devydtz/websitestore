import { getSupabaseBrowserClient, listAccounts, listOrders, listPromoCodes, listStoreProducts } from "@/lib/supabase";
import { minecraftServerTool } from "./minecraftServerTool";

type HealthLine = {
  name: string;
  ok: boolean;
  detail: string;
};

function mark(line: HealthLine) {
  return `${line.ok ? "OK" : "FIX"} ${line.name}: ${line.detail}`;
}

async function safeCheck(name: string, run: () => Promise<string>): Promise<HealthLine> {
  try {
    const detail = await run();
    return { name, ok: !/^error:/i.test(detail), detail: detail.replace(/^error:\s*/i, "") };
  } catch (error) {
    return { name, ok: false, detail: error instanceof Error ? error.message : "unknown error" };
  }
}

export async function coreHealthTool() {
  const supabaseClient = getSupabaseBrowserClient();
  const checks = await Promise.all([
    safeCheck("Supabase auth client", async () => (supabaseClient.ok ? "configured" : `error: ${supabaseClient.error}`)),
    safeCheck("Orders table", async () => {
      const result = await listOrders();
      return result.ok ? `${result.orders.length} recent orders readable` : `error: ${result.error}`;
    }),
    safeCheck("Accounts table", async () => {
      const result = await listAccounts();
      return result.ok ? `${result.accounts.length} accounts readable` : `error: ${result.error}`;
    }),
    safeCheck("Products table", async () => {
      const result = await listStoreProducts();
      return result.ok ? `${result.products.length} products readable` : `error: ${result.error}`;
    }),
    safeCheck("Promo table", async () => {
      const result = await listPromoCodes();
      return result.ok ? `${result.promos.length} promo codes readable` : `error: ${result.error}`;
    }),
    safeCheck("Minecraft public status", async () => minecraftServerTool("server status")),
  ]);

  const failed = checks.filter((check) => !check.ok);
  const next = failed.length
    ? [
        "Fix priority:",
        ...failed.slice(0, 4).map((check, index) => `${index + 1}. ${check.name} - ${check.detail}`),
      ].join("\n")
    : "Everything Core can check from the browser is responding. If AI replies still fail, check the Cloudflare Workers AI binding/quota or swap the provider backend.";

  return [
    "Lunaris Core health check",
    ...checks.map(mark),
    "",
    next,
  ].join("\n");
}
