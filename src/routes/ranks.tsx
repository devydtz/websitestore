import { createFileRoute } from "@tanstack/react-router";
import { Shield, Star, Crown, Sparkles, Moon } from "lucide-react";
import { Starfield } from "@/components/Starfield";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { PageHero } from "@/components/PageHero";
import { ProductGrid, type Product } from "@/components/ProductGrid";

const ranks: Product[] = [
  {
    id: "rank-initiate", category: "rank", name: "Initiate", tagline: "First step into the moonlit realm.", price: "₱149", rarity: "Common", Icon: Shield,
    perks: ["Colored chat name", "/hat command", "2 home points", "Access to /kit initiate"],
  },
  {
    id: "rank-vip", category: "rank", name: "VIP", tagline: "Access exclusive commands, colored chat, and VIP-only areas.", price: "₱249", rarity: "Rare", Icon: Star,
    perks: ["All Initiate perks", "/fly in lobby", "5 home points", "VIP-only mining world", "Weekly VIP crate key"],
  },
  {
    id: "rank-knight", category: "rank", name: "Knight", tagline: "Earn your seat at the round table.", price: "₱499", rarity: "Epic", Icon: Crown, featured: true,
    perks: ["All VIP perks", "/nick custom nickname", "10 home points", "Private vault (54 slots)", "Monthly Lunar crate key"],
  },
  {
    id: "rank-lunar", category: "rank", name: "Lunar", tagline: "Touched by the moon's quiet power.", price: "₱749", rarity: "Legendary", Icon: Moon,
    perks: ["All Knight perks", "/fly in survival", "20 home points", "Custom particle trails", "2 Lunar crate keys monthly"],
  },
  {
    id: "rank-legend", category: "rank", name: "Legend", tagline: "The ultimate rank. Custom prefix, fly in survival, and more.", price: "₱999", rarity: "Legendary", Icon: Sparkles,
    perks: ["All Lunar perks", "Custom prefix in chat", "Unlimited homes", "Personal /warp", "Exclusive Legend cosmetics"],
  },
  {
    id: "rank-mythic", category: "rank", name: "Mythic", tagline: "Stories will be told.", price: "₱1,499", rarity: "Mythic", Icon: Sparkles,
    perks: ["All Legend perks", "Early access to new features", "Custom join message", "Mythic-only Discord channel", "Personal staff support"],
  },
];

export const Route = createFileRoute("/ranks")({
  head: () => ({
    meta: [
      { title: "Ranks — Lunaris Craft" },
      { name: "description", content: "Rise through the ranks and unlock exclusive perks, commands, and cosmetics on Lunaris Craft." },
      { property: "og:title", content: "Ranks — Lunaris Craft" },
      { property: "og:description", content: "Rise through the ranks and unlock exclusive perks, commands, and cosmetics on Lunaris Craft." },
    ],
  }),
  component: RanksPage,
});

function RanksPage() {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <Starfield />
      <div className="relative z-10">
        <Navbar />
        <PageHero
          eyebrow="Claim Your Title"
          title="Ranks"
          description="Rise through the ranks and unlock exclusive perks, commands, and cosmetics that set you apart beneath the moonlit skies."
        />
        <ProductGrid products={ranks} />
        <SiteFooter />
      </div>
    </div>
  );
}