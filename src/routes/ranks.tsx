import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Starfield } from "@/components/Starfield";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { PageHero } from "@/components/PageHero";
import { ProductGrid, type Product } from "@/components/ProductGrid";
import { fallbackRanks, loadProductsForCategory } from "@/lib/products";

export const Route = createFileRoute("/ranks")({
  head: () => ({
    meta: [
      { title: "Ranks - Lunaris Craft" },
      { name: "description", content: "Rise through the ranks and unlock exclusive perks, commands, and cosmetics on Lunaris Craft." },
      { property: "og:title", content: "Ranks - Lunaris Craft" },
      { property: "og:description", content: "Rise through the ranks and unlock exclusive perks, commands, and cosmetics on Lunaris Craft." },
    ],
  }),
  component: RanksPage,
});

function RanksPage() {
  const [products, setProducts] = useState<Product[]>(fallbackRanks);

  useEffect(() => {
    let cancelled = false;
    void loadProductsForCategory("rank", fallbackRanks).then((res) => {
      if (!cancelled) setProducts(res.products);
    });
    return () => {
      cancelled = true;
    };
  }, []);

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
        <ProductGrid products={products} />
        <SiteFooter />
      </div>
    </div>
  );
}
