import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { isLiveCategory, isLiveProduct } from "@/lib/products";

export type CartItem = {
  id: string;
  name: string;
  category: "rank" | "key" | "bundle";
  price: string; // display, e.g. "PHP 249"
  priceCents: number;
  qty: number;
};

type CartCtx = {
  items: CartItem[];
  count: number;
  totalCents: number;
  totalDisplay: string;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  add: (item: Omit<CartItem, "qty">) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = "lunaris.cart.v1";

const phpFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function priceToCents(price: string): number {
  const n = Number(price.replace(/[^0-9.]/g, ""));
  return Math.round((isNaN(n) ? 0 : n) * 100);
}

export function centsToDisplay(cents: number): string {
  return phpFormatter.format(cents / 100);
}

export function lineTotalDisplay(priceCents: number, qty: number): string {
  return centsToDisplay(priceCents * qty);
}

function sanitizeCartItems(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is CartItem => {
      if (!item || typeof item !== "object") return false;
      const candidate = item as Partial<CartItem>;
      return (
        typeof candidate.id === "string" &&
        typeof candidate.name === "string" &&
        typeof candidate.price === "string" &&
        typeof candidate.priceCents === "number" &&
        typeof candidate.qty === "number" &&
        (candidate.category === "rank" || candidate.category === "key" || candidate.category === "bundle") &&
        isLiveCategory(candidate.category) &&
        isLiveProduct(candidate.id) &&
        candidate.priceCents > 0
      );
    })
    .map((item) => ({ ...item, qty: Math.max(1, Math.floor(item.qty)) }));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(sanitizeCartItems(JSON.parse(raw)));
    } catch {
      // Ignore corrupt cart storage and start with an empty cart.
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      // Cart still works in memory when browser storage is blocked.
    }
  }, [items]);

  const add = useCallback((item: Omit<CartItem, "qty">) => {
    if (!isLiveCategory(item.category) || !isLiveProduct(item.id) || item.priceCents <= 0) return;
    setItems((prev) => {
      const existing = prev.find((x) => x.id === item.id);
      if (existing) return prev.map((x) => (x.id === item.id ? { ...x, qty: x.qty + 1 } : x));
      return [...prev, { ...item, qty: 1 }];
    });
    setIsOpen(true);
  }, []);

  const remove = useCallback((id: string) => setItems((p) => p.filter((x) => x.id !== id)), []);
  const setQty = useCallback((id: string, qty: number) => {
    setItems((p) => p.map((x) => (x.id === id ? { ...x, qty: Math.max(1, qty) } : x)));
  }, []);
  const clear = useCallback(() => setItems([]), []);

  const totalCents = items.reduce((s, x) => s + x.priceCents * x.qty, 0);
  const count = items.reduce((s, x) => s + x.qty, 0);

  const value = useMemo<CartCtx>(() => ({
    items, count, totalCents,
    totalDisplay: centsToDisplay(totalCents),
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((v) => !v),
    add, remove, setQty, clear,
  }), [items, count, totalCents, isOpen, add, remove, setQty, clear]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
