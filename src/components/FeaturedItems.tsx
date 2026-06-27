import { Crown, KeyRound, Package, Plus, Sparkles } from "lucide-react";
import { useCart, priceToCents } from "@/lib/cart";

const items: Array<{
  id: string;
  category: "rank" | "key" | "bundle";
  name: string;
  copy: string;
  price: string;
  Icon: typeof Crown;
}> = [
  { id: "rank-crescent", category: "rank", name: "Crescent Rank", copy: "Your first step into the Lunaris realm.", price: "₱99", Icon: Crown },
  { id: "rank-monarch", category: "rank", name: "Monarch Rank", copy: "The highest Lunaris rank package.", price: "₱499", Icon: Sparkles },
  { id: "key-lunar", category: "key", name: "Lunar Key", copy: "Open the Lunar Crate for premium moonlit rewards.", price: "₱399", Icon: KeyRound },
  { id: "bundle-starter", category: "bundle", name: "Starter Bundle", copy: "Crescent Rank + 3 Crate Keys + ₱120 store credit. Perfect start.", price: "₱499", Icon: Package },
];

export function FeaturedItems() {
  const { add } = useCart();
  return (
    <section className="relative px-6 py-20 md:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Most Popular</p>
          <h2 className="mt-3 font-display text-5xl text-foreground md:text-6xl">Featured Items</h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <article key={item.name} className="pixel-card flex flex-col rounded-2xl p-6">
              <div className="grid h-12 w-12 place-items-center rounded-lg bg-primary/10 text-accent ring-1 ring-accent/30">
                <item.Icon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-lg font-bold text-foreground">{item.name}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{item.copy}</p>
              <div className="mt-5 flex flex-col items-center gap-3">
                <span className="text-xl font-bold text-foreground">{item.price}</span>
                <button
                  onClick={() =>
                    add({
                      id: item.id,
                      name: item.name,
                      category: item.category,
                      price: item.price,
                      priceCents: priceToCents(item.price),
                    })
                  }
                  className="group inline-flex items-center gap-1 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground transition hover:bg-accent hover:scale-105"
                >
                  <Plus className="h-3 w-3 transition-transform group-hover:rotate-90" />
                  Add
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
