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
