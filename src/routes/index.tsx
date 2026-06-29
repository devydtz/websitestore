import { createFileRoute, Link } from "@tanstack/react-router";
import logoAsset from "@/assets/lunaris.logo.png";
import { Starfield } from "@/components/Starfield";
import { Navbar } from "@/components/Navbar";
import { PathCards } from "@/components/PathCards";
import { FeaturedItems } from "@/components/FeaturedItems";
import { JoinCTA } from "@/components/JoinCTA";
import { SiteFooter } from "@/components/SiteFooter";
import { Sparkle } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lunaris Craft - Official Minecraft Server Store" },
      { name: "description", content: "Support the server and unlock Lunaris Craft ranks. Keys and bundles are coming soon." },
      { property: "og:title", content: "Lunaris Craft - Official Minecraft Server Store" },
      { property: "og:description", content: "Support the server and unlock Lunaris Craft ranks. Keys and bundles are coming soon." },
      { property: "og:image", content: logoAsset },
      { name: "twitter:image", content: logoAsset },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <Starfield />
      <div className="relative z-10">
        <Navbar />
        <Hero />
        <PathCards />
        <FeaturedItems />
        <JoinCTA />
        <SiteFooter />
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative flex flex-col items-center justify-center px-6 pt-16 pb-28 text-center md:pt-24 md:pb-36">
      <img
        src={logoAsset}
        alt="Lunaris Craft"
        className="logo-float w-full max-w-3xl select-none"
        draggable={false}
      />
      <div className="mt-10 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground backdrop-blur">
        <Sparkle className="h-3 w-3 text-accent" />
        Official Store
      </div>
      <h1 className="sr-only">Lunaris Craft - Official Minecraft Server Store</h1>
      <p className="mt-6 max-w-xl text-balance text-base text-muted-foreground md:text-lg">
        Support the server and unlock ranks for your adventure. Keys and bundles are coming soon.
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <Link to="/ranks" className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[0_0_30px_-5px_oklch(0.85_0.13_295/0.6)] transition hover:scale-[1.03] hover:bg-accent">
          Browse Ranks
        </Link>
        <Link to="/keys" className="rounded-full border border-border bg-card/60 px-6 py-3 text-sm font-semibold text-foreground backdrop-blur transition hover:border-accent hover:text-accent">
          Keys Coming Soon
        </Link>
        <Link to="/bundles" className="rounded-full border border-border bg-card/60 px-6 py-3 text-sm font-semibold text-foreground backdrop-blur transition hover:border-accent hover:text-accent">
          Bundles Coming Soon
        </Link>
      </div>
    </section>
  );
}
