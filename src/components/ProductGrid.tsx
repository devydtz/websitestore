import type { LucideIcon } from "lucide-react";
import { Check, Plus } from "lucide-react";
import { useCart, priceToCents } from "@/lib/cart";

type Rarity = "Common" | "Rare" | "Epic" | "Legendary" | "Mythic";

export type Product = {
  id: string;
  category: "rank" | "key" | "bundle";
  name: string;
  tagline: string;
  price: string;
  rarity: Rarity;
  Icon: LucideIcon;
  perks: string[];
  featured?: boolean;
};

const rarityClass: Record<Rarity, string> = {
  Common: "bg-muted text-muted-foreground ring-1 ring-border",
  Rare: "bg-rare/15 text-rare ring-1 ring-rare/40",
  Epic: "bg-accent/15 text-accent ring-1 ring-accent/40",
  Legendary: "bg-legendary/15 text-legendary ring-1 ring-legendary/40",
  Mythic: "bg-destructive/15 text-destructive ring-1 ring-destructive/40",
};

export function ProductGrid({ products }: { products: Product[] }) {
  const { add } = useCart();
  return (
    <section className="px-6 pb-24">
      <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <article
            key={p.name}
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
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${rarityClass[p.rarity]}`}>
                {p.rarity}
              </span>
            </div>
            <h3 className="mt-5 text-xl font-bold text-foreground">{p.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{p.tagline}</p>
            <ul className="mt-5 space-y-2 text-sm text-foreground/85">
              {p.perks.map((perk) => (
                <li key={perk} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <span>{perk}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-col items-center gap-3 border-t border-border/40 pt-5">
              <span className="text-2xl font-bold text-foreground">{p.price}</span>
              <button
                onClick={() =>
                  add({
                    id: p.id,
                    name: p.name,
                    category: p.category,
                    price: p.price,
                    priceCents: priceToCents(p.price),
                    rarity: p.rarity,
                  })
                }
                className="group inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-accent hover:scale-105 active:scale-95"
              >
                <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
                Add
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
