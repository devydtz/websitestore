import { createFileRoute } from "@tanstack/react-router";
import { Key, KeyRound, Moon, Sparkles } from "lucide-react";
import { Starfield } from "@/components/Starfield";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { PageHero } from "@/components/PageHero";
import { ProductGrid, type Product } from "@/components/ProductGrid";

const keys: Product[] = [
  {
    id: "key-starter",
    category: "key",
    name: "Starter Key",
    tagline: "Open the starter crate for useful survival rewards.",
    price: "₱99",
    Icon: Key,
    comingSoon: true,
    perks: ["Enchanted tools", "Building blocks", "Food bundles", "Bonus reward chance"],
  },
  {
    id: "key-moon",
    category: "key",
    name: "Moon Key",
    tagline: "Unlock upgraded gear and cosmetics.",
    price: "₱199",
    Icon: KeyRound,
    comingSoon: true,
    perks: ["Diamond gear", "Cosmetics", "XP boosters", "Bonus crate drops"],
  },
  {
    id: "key-star",
    category: "key",
    name: "Star Key",
    tagline: "Crack the star crate for stronger rewards.",
    price: "₱299",
    Icon: KeyRound,
    featured: true,
    comingSoon: true,
    perks: ["Netherite gear", "Custom enchants", "Pet eggs", "Particle trails"],
  },
  {
    id: "key-lunar",
    category: "key",
    name: "Lunar Key",
    tagline: "Open the Lunar Crate for premium moonlit rewards.",
    price: "₱399",
    Icon: Moon,
    comingSoon: true,
    perks: ["Powerful enchants", "Exclusive Lunar cosmetics", "Pet eggs", "High-tier gear chance"],
  },
  {
    id: "key-eclipse",
    category: "key",
    name: "Eclipse Key",
    tagline: "The strongest crate key in the store.",
    price: "₱649",
    Icon: Sparkles,
    comingSoon: true,
    perks: ["Guaranteed premium item", "Custom particle wings", "Eclipse-only cosmetics", "Bonus 1,000 server coins"],
  },
  {
    id: "key-bundle-10",
    category: "key",
    name: "Key Bundle ×10",
    tagline: "10 Moon Keys at a discount.",
    price: "₱1,499",
    Icon: KeyRound,
    comingSoon: true,
    perks: ["10× Moon Keys", "Bonus 1 Star Key", "Stacks with rank multipliers"],
  },
];

export const Route = createFileRoute("/keys")({
  head: () => ({
    meta: [
      { title: "Crate Keys - Lunaris Craft" },
      { name: "description", content: "Open mystical crates and discover loot, enchanted gear, and premium treasures." },
      { property: "og:title", content: "Crate Keys - Lunaris Craft" },
      { property: "og:description", content: "Open mystical crates and discover loot, enchanted gear, and premium treasures." },
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
          description="Open mystical crates and discover loot, enchanted gear, and premium treasures pulled straight from the moonlit vaults."
        />
        <ProductGrid products={keys} />
        <SiteFooter />
      </div>
    </div>
  );
}
