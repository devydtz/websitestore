import { Link } from "@tanstack/react-router";
import { Crown, KeyRound, Package, Plus, Sparkles } from "lucide-react";
import { useCart } from "@/lib/cart";
import { LIVE_PRODUCT_DETAILS } from "@/lib/products";

const bestSellers = [
  {
    category: "Ranks",
    badge: "Most Bought",
    id: "rank-solstice",
    name: "Solstice Rank",
    copy: "Best value pick with claim fly, /anvil, extra homes, vaults, and a Cosmetic Key draw.",
    price: "PHP 299",
    Icon: Sparkles,
    live: true,
    to: "/ranks" as const,
  },
  {
    category: "Keys",
    badge: "Coming Soon",
    id: "keys-coming-soon",
    name: "Crate Keys",
    copy: "Key rewards are being finalized. This slot will show the top key once keys go live.",
    price: "Soon",
    Icon: KeyRound,
    live: false,
    to: "/keys" as const,
  },
  {
    category: "Bundles",
    badge: "Coming Soon",
    id: "bundles-coming-soon",
    name: "Bundles",
    copy: "Bundle offers are being built. This slot will show the top bundle once bundles go live.",
    price: "Soon",
    Icon: Package,
    live: false,
    to: "/bundles" as const,
  },
] as const;

export function FeaturedItems() {
  const { add } = useCart();

  return (
    <section className="relative px-6 py-20 md:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Store Highlights</p>
          <h2 className="mt-3 font-display text-5xl text-foreground md:text-6xl">Best Sellers</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
            The top pick in each store category. Keys and bundles are parked until their final rewards are ready.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {bestSellers.map((item) => (
            <article key={item.id} className="pixel-card relative flex flex-col overflow-hidden rounded-2xl p-6">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/70 to-transparent" />
              <div className="flex items-start justify-between gap-4">
                <div className="grid h-12 w-12 place-items-center rounded-lg bg-primary/10 text-accent ring-1 ring-accent/30">
                  <item.Icon className="h-6 w-6" />
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${
                    item.live ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {item.badge}
                </span>
              </div>

              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                {item.category}
              </p>
              <h3 className="mt-1 text-2xl font-bold text-foreground">{item.name}</h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{item.copy}</p>

              <div className="mt-6 flex items-center justify-between gap-3 border-t border-border/40 pt-5">
                <span className="text-xl font-bold text-foreground">{item.price}</span>
                {item.live ? (
                  <button
                    onClick={() =>
                      add({
                        id: item.id,
                        name: item.name,
                        category: "rank",
                        price: item.price,
                        priceCents: LIVE_PRODUCT_DETAILS[item.id]?.priceCents ?? 0,
                      })
                    }
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition hover:scale-105 hover:bg-accent"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add
                  </button>
                ) : (
                  <Link
                    to={item.to}
                    className="rounded-full border border-border bg-card/60 px-4 py-2 text-xs font-semibold text-foreground transition hover:border-accent hover:text-accent"
                  >
                    Preview
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>

        <div className="mt-6 text-center">
          <Link
            to="/ranks"
            className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-5 py-2.5 text-sm font-semibold text-accent transition hover:bg-accent/20"
          >
            <Crown className="h-4 w-4" />
            Compare All Ranks
          </Link>
        </div>
      </div>
    </section>
  );
}
