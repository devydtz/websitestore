import { Link } from "@tanstack/react-router";
import logoAsset from "@/assets/lunaris.logo.png";
import { DISCORD_INVITE_URL, SERVER_IP } from "@/lib/store-config";

export function SiteFooter() {
  return (
    <footer className="relative mt-10 border-t border-border/40 bg-background/40 px-6 py-10 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 md:flex-row">
        <div className="flex items-center gap-3">
          <img src={logoAsset} alt="Lunaris Craft" className="h-9 w-auto" />
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-5 text-sm text-muted-foreground">
          <Link to="/ranks" className="hover:text-foreground">
            Ranks
          </Link>
          <Link to="/keys" className="hover:text-foreground">
            Keys
          </Link>
          <Link to="/bundles" className="hover:text-foreground">
            Bundles
          </Link>
          <Link to="/account" className="hover:text-foreground">
            Account
          </Link>
          <Link to="/admin" className="hover:text-foreground">
            Admin
          </Link>
          <a
            href={DISCORD_INVITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-medium text-[#5865F2] transition hover:text-[#7289da]"
          >
            Discord
          </a>
        </nav>
        <div className="text-center md:text-right">
          <p className="font-mono text-xs text-muted-foreground">{SERVER_IP}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            © {new Date().getFullYear()} Lunaris Craft. Not affiliated with Mojang.
          </p>
        </div>
      </div>
    </footer>
  );
}
