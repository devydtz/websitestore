import { HeadContent, Outlet, Scripts, createRootRoute, useLocation, useRouter } from "@tanstack/react-router";
import { ShoppingCart } from "lucide-react";
import appCss from "../styles.css?url";
import { AccountProvider } from "@/lib/account";
import { CartProvider, useCart } from "@/lib/cart";
import { CartDrawer } from "@/components/CartDrawer";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#bda7ff" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-title", content: "Lunaris Admin" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "description", content: "Lunaris Craft - Official Minecraft Server Store" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@LunarisCraft" },
    ],
    links: [
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", type: "image/png", href: "/pwa-192.png" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Inter:wght@300;400;500;600;700;800&family=VT323&display=swap",
      },
      { rel: "stylesheet", href: appCss },
    ],
  }),
  component: RootComponent,
  errorComponent: ErrorComponent,
});

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <h1 className="font-display text-4xl">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-accent"
          >
            Try again
          </button>
          <button
            onClick={() => router.navigate({ to: "/" })}
            className="rounded-full border border-border px-5 py-2 text-sm font-semibold text-foreground transition hover:border-accent"
          >
            Go home
          </button>
        </div>
      </div>
    </div>
  );
}

function RootComponent() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  return (
    <AccountProvider>
      <CartProvider>
        {!isAdminRoute && (
          <>
            <CartButton />
            <CartDrawer />
          </>
        )}
        <div className="relative">
          <HeadContent />
          <Outlet />
          <Scripts />
        </div>
      </CartProvider>
    </AccountProvider>
  );
}

function CartButton() {
  const { open, count } = useCart();
  return (
    <button
      onClick={open}
      className="fixed bottom-6 right-6 z-50 grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg transition hover:bg-accent hover:scale-105"
      aria-label="Cart"
    >
      <ShoppingCart className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
          {count}
        </span>
      )}
    </button>
  );
}
