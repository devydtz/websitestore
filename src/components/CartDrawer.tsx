import { Link } from "@tanstack/react-router";
import { X, Minus, Plus, ShoppingCart, Trash2, ArrowRight } from "lucide-react";
import { useCart, lineTotalDisplay } from "@/lib/cart";

export function CartDrawer() {
  const { isOpen, close, items, setQty, remove, totalDisplay, count, clear } = useCart();

  return (
    <>
      <div
        aria-hidden={!isOpen}
        onClick={close}
        className={`fixed inset-0 z-40 bg-background/70 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        aria-label="Shopping cart"
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-border bg-card/95 backdrop-blur-xl shadow-2xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between border-b border-border/60 px-5 py-4">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-accent" />
            <h2 className="font-display text-2xl text-foreground">Cart</h2>
            <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-bold text-accent">{count}</span>
          </div>
          <button
            onClick={close}
            aria-label="Close cart"
            className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-muted text-muted-foreground">
                <ShoppingCart className="h-7 w-7" />
              </div>
              <p className="mt-4 text-sm text-muted-foreground">Your cart is empty.</p>
              <Link
                to="/ranks"
                onClick={close}
                className="mt-5 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-accent"
              >
                Browse Ranks
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="animate-fade-in flex items-center gap-3 rounded-xl border border-border/60 bg-background/40 p-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{item.category} · {item.rarity}</p>
                    <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-border/60 px-1 py-0.5">
                      <button
                        onClick={() => setQty(item.id, item.qty - 1)}
                        aria-label="Decrease"
                        className="grid h-6 w-6 place-items-center rounded-full text-muted-foreground hover:text-foreground"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold tabular-nums">{item.qty}</span>
                      <button
                        onClick={() => setQty(item.id, item.qty + 1)}
                        aria-label="Increase"
                        className="grid h-6 w-6 place-items-center rounded-full text-muted-foreground hover:text-foreground"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-sm font-bold text-foreground">
                      {lineTotalDisplay(item.priceCents, item.qty)}
                    </span>
                    <button
                      onClick={() => remove(item.id)}
                      aria-label="Remove"
                      className="text-muted-foreground transition hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <footer className="border-t border-border/60 px-5 py-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-xl font-bold text-foreground">{totalDisplay}</span>
            </div>
            <Link
              to="/checkout"
              onClick={close}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[0_0_30px_-5px_oklch(0.85_0.13_295/0.6)] transition hover:bg-accent hover:scale-[1.01]"
            >
              Checkout
              <ArrowRight className="h-4 w-4" />
            </Link>
            <button
              onClick={clear}
              className="mt-2 w-full rounded-full px-5 py-2 text-xs text-muted-foreground transition hover:text-destructive"
            >
              Clear cart
            </button>
          </footer>
        )}
      </aside>
    </>
  );
}
