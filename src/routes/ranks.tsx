import { createFileRoute } from "@tanstack/react-router";
import { Crown, Moon, Shield, Sparkles, Star } from "lucide-react";
import { Starfield } from "@/components/Starfield";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { PageHero } from "@/components/PageHero";
import { ProductGrid, type Product } from "@/components/ProductGrid";

const ranks: Product[] = [
  {
    id: "rank-crescent",
    category: "rank",
    name: "Crescent",
    tagline: "Your first step into the Lunaris realm.",
    price: "₱99",
    Icon: Shield,
    perks: ["Crescent chat prefix", "2 home points", "Starter monthly kit", "Discord member role"],
  },
  {
    id: "rank-nebula",
    category: "rank",
    name: "Nebula",
    tagline: "A stronger start with extra comfort perks.",
    price: "₱199",
    Icon: Star,
    perks: ["All Crescent perks", "4 home points", "Nebula monthly kit", "Access to extra cosmetics"],
  },
  {
    id: "rank-solstice",
    category: "rank",
    name: "Solstice",
    tagline: "A balanced upgrade for active players.",
    price: "₱299",
    Icon: Moon,
    featured: true,
    perks: ["All Nebula perks", "6 home points", "Solstice monthly kit", "Priority support queue"],
  },
  {
    id: "rank-celestial",
    category: "rank",
    name: "Celestial",
    tagline: "Premium perks for players who want to stand out.",
    price: "₱399",
    Icon: Sparkles,
    perks: ["All Solstice perks", "8 home points", "Celestial monthly kit", "Custom chat color access"],
  },
  {
    id: "rank-monarch",
    category: "rank",
    name: "Monarch",
    tagline: "The highest Lunaris rank package.",
    price: "₱499",
    Icon: Crown,
    perks: ["All Celestial perks", "10 home points", "Monarch monthly kit", "Exclusive Monarch cosmetics"],
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
