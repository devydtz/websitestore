import { createFileRoute } from "@tanstack/react-router";
import { Package } from "lucide-react";
import { Starfield } from "@/components/Starfield";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { PageHero } from "@/components/PageHero";
import { ProductGrid, type Product } from "@/components/ProductGrid";

const bundles: Product[] = [
  {
    id: "bundles-coming-soon",
    category: "bundle",
    name: "Bundles",
    tagline: "Bundles are coming soon. Details will be added once the offers are finalized.",
    price: "₱0",
    Icon: Package,
    comingSoon: true,
    perks: [],
  },
];

export const Route = createFileRoute("/bundles")({
  head: () => ({
    meta: [
      { title: "Bundles - Lunaris Craft" },
      { name: "description", content: "Bundles are coming soon to the Lunaris Craft store." },
      { property: "og:title", content: "Bundles - Lunaris Craft" },
      { property: "og:description", content: "Bundles are coming soon to the Lunaris Craft store." },
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
          description="Bundles are coming soon. We will add the final bundle names, contents, and prices once they are ready."
        />
        <ProductGrid products={bundles} />
        <SiteFooter />
      </div>
    </div>
  );
}
