import { Link } from "@tanstack/react-router";
import { Crown, KeyRound, Package, ArrowRight } from "lucide-react";

const paths = [
  {
    to: "/ranks",
    label: "Ranks",
    tagline: "Claim Your Title",
    title: "Ranks",
    copy: "Rise through the ranks and unlock exclusive perks, commands, and cosmetics that set you apart.",
    cta: "Browse Ranks",
    Icon: Crown,
  },
  {
    to: "/keys",
    label: "Crate Keys",
    tagline: "Coming Soon",
    title: "Crate Keys",
    copy: "Keys are not live yet. This section is parked until the final rewards and prices are ready.",
    cta: "Preview Keys",
    Icon: KeyRound,
  },
  {
    to: "/bundles",
    label: "Bundles",
    tagline: "Coming Soon",
    title: "Bundles",
    copy: "Bundles are not live yet. This section will open after the final bundle offers are finished.",
    cta: "Preview Bundles",
    Icon: Package,
  },
] as const;

export function PathCards() {
  return (
    <section className="relative px-6 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">The Store</p>
          <h2 className="mt-3 font-display text-5xl text-foreground md:text-6xl">Choose Your Path</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {paths.map(({ to, label, tagline, title, copy, cta, Icon }) => (
            <Link key={to} to={to} className="pixel-card group flex flex-col rounded-2xl p-7">
              <div className="mb-6 grid h-14 w-14 place-items-center rounded-xl bg-primary/15 text-accent ring-1 ring-accent/30">
                <Icon className="h-7 w-7" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">{tagline}</p>
              <h3 className="mt-1 text-2xl font-bold text-foreground">{title}</h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{copy}</p>
              <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-accent">
                {cta}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
              <span className="sr-only">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
