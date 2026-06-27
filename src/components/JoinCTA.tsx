import { useState } from "react";
import { Copy, Check, Pickaxe } from "lucide-react";
import { DISCORD_INVITE_URL, SERVER_IP } from "@/lib/store-config";

export function JoinCTA() {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(SERVER_IP);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <section className="relative px-6 py-24">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Ready to Play?</p>
        <h2 className="mt-3 font-display text-5xl text-foreground md:text-6xl">Join the Adventure</h2>
        <p className="mx-auto mt-5 max-w-xl text-balance text-muted-foreground">
          Step into the world of Lunaris Craft and write your own story beneath the moonlit skies.
        </p>

        <div className="mx-auto mt-10 flex max-w-md flex-col items-stretch gap-3 rounded-2xl border border-border bg-card/60 p-3 backdrop-blur md:flex-row md:items-center">
          <div className="flex flex-1 items-center gap-3 px-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Server IP</span>
            <span className="font-mono text-base font-semibold text-foreground">{SERVER_IP}</span>
          </div>
          <button
            onClick={copy}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background/40 px-4 py-2 text-sm font-medium text-foreground transition hover:border-accent hover:text-accent"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <a
            href={`minecraft://${SERVER_IP}`}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground shadow-[0_0_40px_-8px_oklch(0.85_0.13_295/0.7)] transition hover:scale-[1.03] hover:bg-accent"
          >
            <Pickaxe className="h-4 w-4" />
            Connect Now
          </a>
          <a
            href={DISCORD_INVITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-[#5865F2]/40 bg-[#5865F2]/10 px-7 py-3 text-sm font-semibold text-[#5865F2] transition hover:border-[#5865F2] hover:bg-[#5865F2]/20"
          >
            Join Discord
          </a>
        </div>
        <p className="mt-5 text-xs text-muted-foreground">Java Edition 1.20+ · Bedrock supported</p>
      </div>
    </section>
  );
}