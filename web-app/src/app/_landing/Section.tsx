import type { ReactNode } from "react";

interface SectionProps {
  id?: string;
  title: string;
  intro?: string;
  tone?: "white" | "wash";
  children: ReactNode;
}

// scroll-mt-20 (5rem) keeps the heading clear of the 4rem sticky header when jumping to an anchor.
export function Section({ id, title, intro, tone = "white", children }: SectionProps) {
  const background = tone === "wash" ? "bg-sky-wash" : "bg-white";

  return (
    <section id={id} className={`scroll-mt-20 px-4 py-16 md:py-24 ${background}`}>
      <div className="mx-auto max-w-6xl">
        <h2 className="max-w-3xl font-display text-2xl font-bold leading-tight text-navy-slate md:text-4xl">{title}</h2>
        {intro && <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-slate">{intro}</p>}
        <div className="mt-10">{children}</div>
      </div>
    </section>
  );
}
