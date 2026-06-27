import type { ReactNode } from "react";

export function PageHero({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <section className="px-6 pt-20 pb-10 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">{eyebrow}</p>
      <h1 className="mt-3 font-display text-6xl text-foreground md:text-7xl">{title}</h1>
      <p className="mx-auto mt-5 max-w-xl text-balance text-muted-foreground">{description}</p>
      {children}
    </section>
  );
}