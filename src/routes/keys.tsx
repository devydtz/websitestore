import { createFileRoute } from "@tanstack/react-router";
import { KeyRound } from "lucide-react";
import { Starfield } from "@/components/Starfield";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { PageHero } from "@/components/PageHero";
import { ProductGrid, type Product } from "@/components/ProductGrid";

const keys: Product[] = [
  {
    id: "keys-coming-soon",
    category: "key",
    name: "Crate Keys",
    tagline: "Keys are coming soon. Details will be added once the rewards are finalized.",
    price: "PHP 0",
    Icon: KeyRound,
    comingSoon: true,
    perks: [],
  },
];

export const Route = createFileRoute("/keys")({
  head: () => ({
    meta: [
      { title: "Crate Keys - Lunaris Craft" },
      { name: "description", content: "Crate keys are coming soon to the Lunaris Craft store." },
      { property: "og:title", content: "Crate Keys - Lunaris Craft" },
      { property: "og:description", content: "Crate keys are coming soon to the Lunaris Craft store." },
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
          description="Crate keys are coming soon. We will add the final key names, rewards, and prices once they are ready."
        />
        <ProductGrid products={keys} />
        <SiteFooter />
      </div>
    </div>
  );
}
