import { Link } from "@tanstack/react-router";
import { type ReactNode } from "react";
import { Copy, ExternalLink, Sparkles } from "lucide-react";
import logoAsset from "@/assets/lunaris.logo.png";
import { DISCORD_INVITE_URL, SERVER_IP } from "@/lib/store-config";

export function SiteFooter() {
  const copyServer = async () => {
    try {
      await navigator.clipboard.writeText(SERVER_IP);
    } catch {}
  };

  return (
    <footer className="relative mt-10 overflow-hidden border-t border-white/10 bg-[#07020f]/85 px-6 py-10 backdrop-blur-2xl">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/70 to-transparent" />
      <div className="absolute -left-20 bottom-0 h-44 w-44 rounded-full bg-accent/10 blur-3xl" />
      <div className="absolute -right-20 top-0 h-44 w-44 rounded-full bg-[#5865F2]/10 blur-3xl" />

      <div className="relative mx-auto grid max-w-6xl gap-8 md:grid-cols-[1.2fr_1fr_1.2fr] md:items-center">
        <div>
          <img
            src={logoAsset}
            alt="Lunaris Craft"
            className="h-14 w-auto drop-shadow-[0_0_18px_rgba(190,132,255,0.45)]"
          />
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Moonlit Minecraft adventures, ranks, keys, and rewards for the Lunaris community.
          </p>
        </div>

        <nav className="flex flex-wrap items-center justify-start gap-3 text-sm font-semibold text-muted-foreground md:justify-center">
          <FooterLink to="/ranks">Ranks</FooterLink>
          <FooterLink to="/keys">Keys</FooterLink>
          <FooterLink to="/bundles">Bundles</FooterLink>
          <FooterLink to="/account">Account</FooterLink>
          <a
            href={DISCORD_INVITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-[#5865F2]/30 bg-[#5865F2]/10 px-4 py-2 font-bold text-[#9ea7ff] transition hover:border-[#5865F2]/70 hover:text-white"
          >
            Discord <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </nav>

        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 shadow-inner shadow-black/20">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.28em] text-accent/80">
            <Sparkles className="h-3.5 w-3.5" /> Server Address
          </div>
          <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/50 px-4 py-3">
            <span className="truncate font-mono text-sm font-bold text-foreground">{SERVER_IP}</span>
            <button
              type="button"
              onClick={copyServer}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs font-bold text-accent transition hover:bg-accent/20"
            >
              <Copy className="h-3.5 w-3.5" /> Copy
            </button>
          </div>
          <p className="mt-3 text-right text-xs text-muted-foreground">
            © {new Date().getFullYear()} Lunaris Craft. Not affiliated with Mojang.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ to, children }: { to: "/" | "/ranks" | "/keys" | "/bundles" | "/account"; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 transition hover:border-accent/50 hover:text-foreground"
    >
      {children}
    </Link>
  );
}
