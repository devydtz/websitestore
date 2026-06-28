import { centsToDisplay } from "@/lib/cart";

export type PromoCode = {
  code: string;
  label: string;
  description: string;
  apply: (subtotalCents: number) => number;
};

export const PROMO_CODES: PromoCode[] = [
  {
    code: "LAUNCH10",
    label: "Launch 10%",
    description: "10% off your whole order.",
    apply: (subtotalCents) => Math.round(subtotalCents * 0.1),
  },
  {
    code: "LUNARIS25",
    label: "Lunaris 25",
    description: "PHP 25 off orders PHP 150+.",
    apply: (subtotalCents) => (subtotalCents >= 15000 ? 2500 : 0),
  },
  {
    code: "MONARCH50",
    label: "Monarch 50",
    description: "PHP 50 off orders PHP 400+.",
    apply: (subtotalCents) => (subtotalCents >= 40000 ? 5000 : 0),
  },
];

export function findPromo(code: string): PromoCode | null {
  const clean = code.trim().toUpperCase();
  return PROMO_CODES.find((promo) => promo.code === clean) ?? null;
}

export function applyPromo(code: string, subtotalCents: number) {
  const promo = findPromo(code);
  if (!promo) {
    return { ok: false as const, error: "Promo code not found." };
  }

  const discountCents = Math.min(subtotalCents, promo.apply(subtotalCents));
  if (discountCents <= 0) {
    return { ok: false as const, error: `${promo.code} does not apply to this cart.` };
  }

  return {
    ok: true as const,
    code: promo.code,
    label: promo.label,
    description: promo.description,
    discountCents,
    discountDisplay: centsToDisplay(discountCents),
    totalCents: subtotalCents - discountCents,
    totalDisplay: centsToDisplay(subtotalCents - discountCents),
  };
}

export function applyPromoRule(
  promo: {
    code: string;
    label: string;
    description?: string | null;
    kind: "percent" | "fixed";
    amount: number;
    min_subtotal_cents?: number | null;
    max_uses?: number | null;
    used_count?: number | null;
    expires_at?: string | null;
  },
  subtotalCents: number,
) {
  if ((promo.min_subtotal_cents ?? 0) > subtotalCents) {
    return { ok: false as const, error: `${promo.code} does not apply to this cart.` };
  }
  if (promo.max_uses !== null && promo.max_uses !== undefined && (promo.used_count ?? 0) >= promo.max_uses) {
    return { ok: false as const, error: `${promo.code} has already reached its use limit.` };
  }
  if (promo.expires_at && new Date(promo.expires_at).getTime() < Date.now()) {
    return { ok: false as const, error: `${promo.code} has expired.` };
  }

  const discountCents =
    promo.kind === "percent" ? Math.round(subtotalCents * (promo.amount / 100)) : promo.amount;
  const safeDiscount = Math.min(subtotalCents, Math.max(0, discountCents));
  if (safeDiscount <= 0) {
    return { ok: false as const, error: `${promo.code} does not apply to this cart.` };
  }

  return {
    ok: true as const,
    code: promo.code,
    label: promo.label,
    description: promo.description ?? "",
    discountCents: safeDiscount,
    discountDisplay: centsToDisplay(safeDiscount),
    totalCents: subtotalCents - safeDiscount,
    totalDisplay: centsToDisplay(subtotalCents - safeDiscount),
  };
}
