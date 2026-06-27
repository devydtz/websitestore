import { createFileRoute } from "@tanstack/react-router";
import { Package, Gift, Sparkles, Moon } from "lucide-react";
import { Starfield } from "@/components/Starfield";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { PageHero } from "@/components/PageHero";
import { ProductGrid, type Product } from "@/components/ProductGrid";

const bundles: Product[] = [
  {
    id: "bundle-starter", category: "bundle", name: "Starter Bundle", tagline: "VIP Rank + 3 Crate Keys + ₱120 store credit. Perfect start.", price: "₱499", rarity: "Rare", Icon: Gift,
    perks: ["VIP Rank (lifetime)", "3× Rare Keys", "₱120 store credit", "Welcome cosmetic"],
  },
  {
    id: "bundle-adventurer", category: "bundle", name: "Adventurer Bundle", tagline: "Everything you need to thrive across worlds.", price: "₱999", rarity: "Epic", Icon: Package, featured: true,
    perks: ["Knight Rank", "5× Rare + 2× Epic Keys", "₱300 store credit", "Exclusive cape"],
  },
  {
    id: "bundle-lunar", category: "bundle", name: "Lunar Bundle", tagline: "Walk in moonlight with the Lunar pack.", price: "₱1,749", rarity: "Legendary", Icon: Moon,
    perks: ["Lunar Rank", "3× Lunar Keys", "Custom particle trail", "₱600 store credit"],
  },
  {
    id: "bundle-legend", category: "bundle", name: "Legend Bundle", tagline: "The ultimate package for serious players.", price: "₱2,499", rarity: "Legendary", Icon: Sparkles,
    perks: ["Legend Rank", "5× Lunar Keys", "1× Eclipse Key", "₱900 store credit", "Custom prefix"],
  },
  {
    id: "bundle-eclipse", category: "bundle", name: "Eclipse Bundle", tagline: "Limited. Devastating. Unforgettable.", price: "₱3,999", rarity: "Mythic", Icon: Sparkles,
    perks: ["Mythic Rank", "3× Eclipse Keys", "Eclipse wings cosmetic", "₱1,500 store credit", "Personal /warp"],
  },
  {
    id: "bundle-guild", category: "bundle", name: "Guild Bundle", tagline: "Equip your squad — 4 VIP ranks at a discount.", price: "₱799", rarity: "Rare", Icon: Gift,
    perks: ["4× VIP Ranks", "8× Rare Keys", "Shared guild vault unlock"],
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