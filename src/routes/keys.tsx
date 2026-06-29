import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Starfield } from "@/components/Starfield";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { PageHero } from "@/components/PageHero";
import { ProductGrid, type Product } from "@/components/ProductGrid";
import { fallbackKeys, loadProductsForCategory } from "@/lib/products";

export const Route = createFileRoute("/keys")({
  head: () => ({
    meta: [
      { title: "Crate Keys - Lunaris Craft" },
      { name: "description", content: "Crate keys for the Lunaris Craft store." },
      { property: "og:title", content: "Crate Keys - Lunaris Craft" },
      { property: "og:description", content: "Crate keys for the Lunaris Craft store." },
    ],
  }),
  component: KeysPage,
});

function KeysPage() {
  const [products, setProducts] = useState<Product[]>(fallbackKeys);

  useEffect(() => {
    let cancelled = false;
    void loadProductsForCategory("key", fallbackKeys).then((res) => {
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
          eyebrow="Unlock the Unknown"
          title="Crate Keys"
          description="Browse available crate keys once they are added by the admin team."
        />
        <ProductGrid products={products} />
        <SiteFooter />
      </div>
    </div>
  );
}
