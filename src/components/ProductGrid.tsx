import type { LucideIcon } from "lucide-react";
import { Check, Clock, Plus } from "lucide-react";
import { useCart, priceToCents } from "@/lib/cart";

export type Product = {
  id: string;
  category: "rank" | "key" | "bundle";
  name: string;
  tagline: string;
  price: string;
  Icon: LucideIcon;
  perks: string[];
  featured?: boolean;
  comingSoon?: boolean;
};

export function ProductGrid({ products }: { products: Product[] }) {
  const { add } = useCart();
  return (
    <section className="px-6 pb-24">
      <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <article
            key={p.id}
            className={`pixel-card relative flex flex-col rounded-2xl p-7 animate-fade-in ${
              p.featured ? "ring-2 ring-accent/60 shadow-[0_0_60px_-20px_oklch(0.78_0.13_295/0.8)]" : ""
            }`}
          >
            {p.featured && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-accent-foreground">
                Most Popular
              </span>
            )}
            <div className="flex items-start justify-between">
              <div className="grid h-12 w-12 place-items-center rounded-lg bg-primary/10 text-accent ring-1 ring-accent/30">
                <p.Icon className="h-6 w-6" />
              </div>
            </div>
            <h3 className="mt-5 text-xl font-bold text-foreground">{p.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{p.tagline}</p>
            {p.comingSoon ? (
              <div className="mt-5 rounded-xl border border-accent/20 bg-accent/10 px-4 py-5 text-center text-sm font-semibold text-accent">
                <Clock className="mx-auto mb-2 h-5 w-5" />
                Details will be announced soon.
              </div>
            ) : (
              <ul className="mt-5 space-y-2 text-sm text-foreground/85">
                {p.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <span>{perk}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-6 flex flex-col items-center gap-3 border-t border-border/40 pt-5">
              <span className="text-2xl font-bold text-foreground">{p.comingSoon ? "Coming Soon" : p.price}</span>
              <button
                disabled={p.comingSoon}
                onClick={() =>
                  add({
                    id: p.id,
                    name: p.name,
                    category: p.category,
                    price: p.price,
                    priceCents: priceToCents(p.price),
                  })
                }
                className="group inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition hover:scale-105 hover:bg-accent active:scale-95 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:hover:scale-100"
              >
                {!p.comingSoon && <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />}
                {p.comingSoon ? "Coming Soon" : "Add"}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
