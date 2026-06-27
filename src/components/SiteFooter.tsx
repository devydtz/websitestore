import { Link } from "@tanstack/react-router";
import { type ReactNode } from "react";
import { ExternalLink } from "lucide-react";
import logoAsset from "@/assets/lunaris.logo.png";
import { DISCORD_INVITE_URL } from "@/lib/store-config";

export function SiteFooter() {
  return (
    <footer className="relative mt-10 overflow-hidden border-t border-white/10 bg-[#07020f]/85 px-6 py-10 backdrop-blur-2xl">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/70 to-transparent" />
      <div className="absolute -left-20 bottom-0 h-44 w-44 rounded-full bg-accent/10 blur-3xl" />
      <div className="absolute -right-20 top-0 h-44 w-44 rounded-full bg-[#5865F2]/10 blur-3xl" />

      <div className="relative mx-auto grid max-w-6xl gap-8 md:grid-cols-[1fr_auto_1fr] md:items-center">
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

        <nav className="flex flex-wrap items-center justify-start gap-2 text-sm font-semibold text-muted-foreground md:flex-nowrap md:justify-center">
          <FooterLink to="/ranks">Ranks</FooterLink>
          <FooterLink to="/keys">Keys</FooterLink>
          <FooterLink to="/bundles">Bundles</FooterLink>
          <FooterLink to="/account">Account</FooterLink>
          <a
            href={DISCORD_INVITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-[#5865F2]/30 bg-[#5865F2]/10 px-4 py-2 font-bold text-[#9ea7ff] transition hover:border-[#5865F2]/70 hover:text-white"
          >
            Discord <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </nav>

        <p className="text-sm text-muted-foreground md:text-right">
          © {new Date().getFullYear()} Lunaris Craft. Not affiliated with Mojang.
        </p>
      </div>
    </footer>
  );
}

function FooterLink({ to, children }: { to: "/" | "/ranks" | "/keys" | "/bundles" | "/account"; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="whitespace-nowrap rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 transition hover:border-accent/50 hover:text-foreground"
    >
      {children}
    </Link>
  );
}
