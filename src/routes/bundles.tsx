import { createFileRoute } from "@tanstack/react-router";
import { Gift, Moon, Package, Sparkles } from "lucide-react";
import { Starfield } from "@/components/Starfield";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { PageHero } from "@/components/PageHero";
import { ProductGrid, type Product } from "@/components/ProductGrid";

const bundles: Product[] = [
  {
    id: "bundle-starter",
    category: "bundle",
    name: "Starter Bundle",
    tagline: "Crescent Rank + 3 Crate Keys + ₱120 store credit. Perfect start.",
    price: "₱499",
    Icon: Gift,
    comingSoon: true,
    perks: ["Crescent Rank", "3× Moon Keys", "₱120 store credit", "Welcome cosmetic"],
  },
  {
    id: "bundle-adventurer",
    category: "bundle",
    name: "Adventurer Bundle",
    tagline: "Everything you need to thrive across worlds.",
    price: "₱999",
    Icon: Package,
    featured: true,
    comingSoon: true,
    perks: ["Solstice Rank", "5× Moon Keys + 2× Star Keys", "₱300 store credit", "Exclusive cape"],
  },
  {
    id: "bundle-lunar",
    category: "bundle",
    name: "Lunar Bundle",
    tagline: "Walk in moonlight with the Lunar pack.",
    price: "₱1,749",
    Icon: Moon,
    comingSoon: true,
    perks: ["Celestial Rank", "3× Lunar Keys", "Custom particle trail", "₱600 store credit"],
  },
  {
    id: "bundle-monarch",
    category: "bundle",
    name: "Monarch Bundle",
    tagline: "The ultimate package for serious players.",
    price: "₱2,499",
    Icon: Sparkles,
    comingSoon: true,
    perks: ["Monarch Rank", "5× Lunar Keys", "1× Eclipse Key", "₱900 store credit", "Custom prefix"],
  },
  {
    id: "bundle-eclipse",
    category: "bundle",
    name: "Eclipse Bundle",
    tagline: "Limited. Powerful. Unforgettable.",
    price: "₱3,999",
    Icon: Sparkles,
    comingSoon: true,
    perks: ["Monarch Rank", "3× Eclipse Keys", "Eclipse wings cosmetic", "₱1,500 store credit", "Personal /warp"],
  },
  {
    id: "bundle-guild",
    category: "bundle",
    name: "Guild Bundle",
    tagline: "Equip your squad with ranks at a discount.",
    price: "₱799",
    Icon: Gift,
    comingSoon: true,
    perks: ["4× Crescent Ranks", "8× Moon Keys", "Shared guild vault unlock"],
  },
];

export const Route = createFileRoute("/bundles")({
  head: () => ({
    meta: [
      { title: "Bundles — Lunaris Craft" },
      { name: "description", content: "Curated packs combining ranks, keys, and exclusive items at unbeatable prices." },
      { property: "og:title", content: "Bundles — Lunaris Craft" },
      { property: "og:description", content: "Curated packs combining ranks, keys, and exclusive items at unbeatable prices." },
    ],
  }),
  component: BundlesPage,
});

function BundlesPage() {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <Starfield />
      <div className="relative z-10">
        <Navbar />
        <PageHero
          eyebrow="Maximum Value"
          title="Bundles"
          description="Curated packs combining ranks, keys, and exclusive items at unbeatable prices — designed to launch you into the adventure."
        />
        <ProductGrid products={bundles} />
        <SiteFooter />
      </div>
    </div>
  );
}
