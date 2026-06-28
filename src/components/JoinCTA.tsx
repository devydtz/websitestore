import { useState } from "react";
import { Check, Copy, MonitorSmartphone, Pickaxe } from "lucide-react";
import { DISCORD_INVITE_URL, SERVER_HOST, SERVER_PORT } from "@/lib/store-config";

export function JoinCTA() {
  const [copied, setCopied] = useState<"ip" | "port" | "server" | null>(null);
  const [connectHelp, setConnectHelp] = useState(false);

  const copy = async (value: string, type: "ip" | "port" | "server") => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(type);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // Ignore clipboard failures. The visible IP and port stay on screen.
    }
  };

  const connectNow = () => {
    const fullAddress = `${SERVER_HOST}:${SERVER_PORT}`;
    const launchUrl = `minecraft://?addExternalServer=${encodeURIComponent(`Lunaris Craft|${fullAddress}`)}`;

    void copy(fullAddress, "server");
    setConnectHelp(true);
    window.location.href = launchUrl;
  };

  return (
    <section className="relative px-6 py-24">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Ready to Play?</p>
        <h2 className="mt-3 font-display text-5xl text-foreground md:text-6xl">Join the Adventure</h2>
        <p className="mx-auto mt-5 max-w-xl text-balance text-muted-foreground">
          Step into the world of Lunaris Craft and write your own story beneath the moonlit skies.
        </p>

        <div className="mx-auto mt-10 grid max-w-xl gap-3 sm:grid-cols-2">
          <ServerInfoCard
            label="Server IP"
            value={SERVER_HOST}
            copied={copied === "ip"}
            onCopy={() => copy(SERVER_HOST, "ip")}
          />
          <ServerInfoCard
            label="Port"
            value={SERVER_PORT}
            copied={copied === "port"}
            onCopy={() => copy(SERVER_PORT, "port")}
          />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={connectNow}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground shadow-[0_0_40px_-8px_oklch(0.85_0.13_295/0.7)] transition hover:scale-[1.03] hover:bg-accent"
          >
            <Pickaxe className="h-4 w-4" />
            {copied === "server" ? "Copied Server" : "Connect Now"}
          </button>
          <a
            href={DISCORD_INVITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-[#5865F2]/40 bg-[#5865F2]/10 px-7 py-3 text-sm font-semibold text-[#5865F2] transition hover:border-[#5865F2] hover:bg-[#5865F2]/20"
          >
            Join Discord
          </a>
        </div>

        {connectHelp && (
          <div className="mx-auto mt-5 max-w-xl rounded-2xl border border-accent/25 bg-accent/10 p-4 text-left">
            <div className="flex items-start gap-3">
              <MonitorSmartphone className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
              <div>
                <p className="text-sm font-semibold text-foreground">Opening Minecraft if your browser allows it.</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  If nothing opens on PC, the server address was copied. Open Minecraft manually, add a server, then use
                  IP <span className="font-mono text-foreground">{SERVER_HOST}</span> and port{" "}
                  <span className="font-mono text-foreground">{SERVER_PORT}</span>.
                </p>
              </div>
            </div>
          </div>
        )}

        <p className="mt-5 text-xs text-muted-foreground">Java Edition 1.20+ / Bedrock supported</p>
      </div>
    </section>
  );
}

function ServerInfoCard({
  label,
  value,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card/60 p-4 text-left backdrop-blur">
      <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="truncate font-mono text-base font-semibold text-foreground">{value}</span>
        <button
          onClick={onCopy}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-border bg-background/40 px-3 py-2 text-xs font-medium text-foreground transition hover:border-accent hover:text-accent"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
