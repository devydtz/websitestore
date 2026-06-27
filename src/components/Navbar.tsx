import { Link } from "@tanstack/react-router";
import { ShoppingCart, User as UserIcon } from "lucide-react";
import logoAsset from "@/assets/lunaris.logo.png";
import { useAccount } from "@/lib/account";
import { useCart } from "@/lib/cart";
import { DISCORD_INVITE_URL } from "@/lib/store-config";

const nav = [
  { to: "/", label: "Home" },
  { to: "/ranks", label: "Ranks" },
  { to: "/keys", label: "Keys" },
  { to: "/bundles", label: "Bundles" },
  { to: "/account", label: "Account" },
] as const;

export function Navbar() {
  const { account } = useAccount();
  const { count, open } = useCart();
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#07020f]/85 shadow-[0_18px_60px_-35px_rgba(177,116,255,0.8)] backdrop-blur-2xl">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/80 to-transparent" />
      <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-4 px-4 md:px-8">
        <Link to="/" className="group flex min-w-0 items-center">
          <img
            src={logoAsset}
            alt="Lunaris Craft"
            className="h-14 w-auto max-w-[190px] object-contain drop-shadow-[0_0_22px_rgba(190,132,255,0.45)] transition duration-300 group-hover:scale-[1.03] sm:max-w-[240px]"
          />
        </Link>
        <nav className="hidden items-center rounded-full border border-white/10 bg-white/[0.035] p-1 shadow-inner shadow-black/20 md:flex">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-white/5 hover:text-foreground"
              activeProps={{
                className:
                  "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-[0_0_24px_-10px_rgba(220,190,255,0.9)]",
              }}
              activeOptions={{ exact: item.to === "/" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <a
            href={DISCORD_INVITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Join our Discord server"
            title="Join our Discord"
            className="hidden h-10 items-center gap-2 rounded-full border border-[#5865F2]/35 bg-[#5865F2]/10 px-4 text-sm font-bold text-[#9ea7ff] transition hover:border-[#5865F2]/70 hover:bg-[#5865F2]/20 hover:text-white sm:inline-flex"
          >
            <DiscordIcon className="h-4 w-4" />
            Discord
          </a>
          <button
            onClick={open}
            aria-label="Cart"
            className="relative grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-muted-foreground transition hover:border-accent/50 hover:text-foreground"
          >
            <ShoppingCart className="h-4 w-4" />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
                {count}
              </span>
            )}
          </button>
          {account ? (
            <Link
              to="/account"
              className="ml-1 inline-flex items-center gap-2 rounded-full border border-accent/40 bg-card/70 py-1 pl-1 pr-3 text-sm font-semibold text-foreground transition hover:border-accent hover:bg-card"
            >
              <img
                src={account.avatarUrl}
                alt=""
                className="h-7 w-7 rounded-full ring-1 ring-accent/50"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "https://mc-heads.net/avatar/MHF_Steve/64";
                }}
              />
              <span className="max-w-[8rem] truncate">{account.displayName}</span>
            </Link>
          ) : (
            <Link
              to="/account"
              className="ml-1 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-4 py-2 text-sm font-bold text-primary-foreground shadow-[0_0_28px_-12px_rgba(220,190,255,0.9)] transition hover:scale-105"
            >
              <UserIcon className="h-4 w-4" />
              Sign Up
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M20.317 4.369A19.79 19.79 0 0 0 16.558 3a.07.07 0 0 0-.074.035c-.32.57-.679 1.314-.93 1.898a18.27 18.27 0 0 0-5.512 0c-.252-.595-.62-1.327-.943-1.898A.077.077 0 0 0 9.025 3 19.74 19.74 0 0 0 5.27 4.369a.07.07 0 0 0-.032.027C2.92 7.86 2.28 11.24 2.59 14.58a.082.082 0 0 0 .031.056 19.9 19.9 0 0 0 5.993 3.027.077.077 0 0 0 .084-.027c.461-.63.873-1.295 1.226-1.994a.076.076 0 0 0-.041-.105 13.12 13.12 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.927 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.009c.12.099.246.198.373.292a.077.077 0 0 1-.006.128 12.3 12.3 0 0 1-1.873.891.077.077 0 0 0-.04.106c.36.699.772 1.364 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.027.077.077 0 0 0 .032-.054c.5-3.876-.838-7.228-3.548-10.184a.06.06 0 0 0-.031-.028zM8.02 12.645c-1.183 0-2.157-1.085-2.157-2.418 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.419 0 1.333-.956 2.418-2.157 2.418zm7.974 0c-1.183 0-2.157-1.085-2.157-2.418 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.419 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}
