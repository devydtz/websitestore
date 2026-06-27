import { createFileRoute } from "@tanstack/react-router";
import { KeyRound, Key, Sparkles, Moon } from "lucide-react";
import { Starfield } from "@/components/Starfield";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { PageHero } from "@/components/PageHero";
import { ProductGrid, type Product } from "@/components/ProductGrid";

const keys: Product[] = [
  {
    id: "key-common", category: "key", name: "Common Key", tagline: "Open the Common Crate. Reliable, useful loot.", price: "₱99", rarity: "Common", Icon: Key,
    perks: ["Enchanted tools", "Building blocks", "Food bundles", "Small chance of rare drops"],
  },
  {
    id: "key-rare", category: "key", name: "Rare Key", tagline: "Unlock the Rare Crate for upgraded gear.", price: "₱199", rarity: "Rare", Icon: KeyRound,
    perks: ["Diamond gear (enchanted)", "Rare cosmetics", "XP boosters", "Chance at Epic drops"],
  },
  {
    id: "key-epic", category: "key", name: "Epic Key", tagline: "Crack the Epic Crate. Powerful rewards await.", price: "₱299", rarity: "Epic", Icon: KeyRound, featured: true,
    perks: ["Netherite gear", "Custom enchants", "Pet eggs", "Particle trails"],
  },
  {
    id: "key-lunar", category: "key", name: "Lunar Key", tagline: "Open the Lunar Crate for a chance at the rarest gear on the server.", price: "₱399", rarity: "Legendary", Icon: Moon,
    perks: ["Mythic enchants", "Exclusive Lunar cosmetics", "Rare pet eggs", "Chance at Mythic gear"],
  },
  {
    id: "key-eclipse", category: "key", name: "Eclipse Key", tagline: "The rarest crate of all. Open at your own risk.", price: "₱649", rarity: "Mythic", Icon: Sparkles,
    perks: ["Guaranteed Mythic item", "Custom particle wings", "Eclipse-only cosmetics", "Bonus 1,000 server coins"],
  },
  {
    id: "key-bundle-10", category: "key", name: "Key Bundle ×10", tagline: "10 Rare Keys at a discount.", price: "₱1,499", rarity: "Epic", Icon: KeyRound,
    perks: ["10× Rare Keys", "Bonus 1 Epic Key", "Stacks with rank multipliers"],
  },
];

export const Route = createFileRoute("/keys")({
  head: () => ({
    meta: [
      { title: "Crate Keys — Lunaris Craft" },
      { name: "description", content: "Open mystical crates and discover rare loot, enchanted gear, and legendary treasures." },
      { property: "og:title", content: "Crate Keys — Lunaris Craft" },
      { property: "og:description", content: "Open mystical crates and discover rare loot, enchanted gear, and legendary treasures." },
    ],
  }),
  component: KeysPage,
});

function KeysPage() {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <Starfield />
      <div className="relative z-10">
        <Navbar />
        <PageHero
          eyebrow="Unlock the Unknown"
          title="Crate Keys"
          description="Open mystical crates and discover rare loot, enchanted gear, and legendary treasures pulled straight from the moonlit vaults."
        />
        <ProductGrid products={keys} />
        <SiteFooter />
      </div>
    </div>
  );
}