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
    perks: [
      "5,000 Claim Blocks",
      "2 PWarps (/pw create)",
      "5 Sethomes (/sethome)",
      "3 vaults (/pv)",
      "/workbench",
    ],
  },
  {
    id: "rank-nebula",
    category: "rank",
    name: "Nebula",
    tagline: "A stronger start with extra comfort perks.",
    price: "₱199",
    Icon: Star,
    perks: [
      "7,500 Claim Blocks",
      "3 PWarps (/pw create)",
      "7 Sethomes (/sethome)",
      "5 vaults (/pv)",
      "/workbench",
    ],
  },
  {
    id: "rank-solstice",
    category: "rank",
    name: "Solstice",
    tagline: "A balanced upgrade for active players.",
    price: "₱299",
    Icon: Moon,
    featured: true,
    perks: [
      "10,000 Claim Blocks",
      "5 PWarps (/pw create)",
      "8 Sethomes (/sethome)",
      "7 vaults (/pv)",
      "/cfly (claim fly)",
      "/workbench",
      "/anvil",
      "Cosmetic Key draw",
    ],
  },
  {
    id: "rank-celestial",
    category: "rank",
    name: "Celestial",
    tagline: "Premium perks for players who want to stand out.",
    price: "₱399",
    Icon: Sparkles,
    perks: [
      "15,000 Claim Blocks",
      "7 PWarps (/pw create)",
      "10 Sethomes (/sethome)",
      "10 vaults (/pv)",
      "/nick",
      "/cfly (claim fly)",
      "/workbench",
      "/anvil",
      "/glow",
      "/cc (change chat colors)",
      "/repair",
      "3 orders (/orders)",
      "2x Cosmetic Key draw",
    ],
  },
  {
    id: "rank-monarch",
    category: "rank",
    name: "Monarch",
    tagline: "The highest Lunaris rank package.",
    price: "₱499",
    Icon: Crown,
    perks: [
      "20,000 Claim Blocks",
      "10 PWarps (/pw create)",
      "15 Sethomes (/sethome)",
      "15 vaults (/pv)",
      "/nick",
      "/cfly (claim fly)",
      "/workbench",
      "/anvil",
      "/smithingtable",
      "/glow",
      "/cc (change chat colors)",
      "/repair",
      "5 orders (/orders)",
      "/resize (change player attribute size)",
      "/itemname (change item's name)",
      "3x Cosmetic Key Draw",
    ],
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
