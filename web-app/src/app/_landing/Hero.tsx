import Image from "next/image";
import { HERO, SECTION_IDS } from "./content";
import { buttonLarge, focusOnBrand } from "./styles";

export function HeroActions() {
  return (
    <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
      <a
        href={`#${SECTION_IDS.install}`}
        className={`${buttonLarge} ${focusOnBrand} inline-flex items-center justify-center rounded-lg bg-white font-semibold text-shark-blue-dark transition-colors hover:bg-sky-wash focus-visible:outline-2 focus-visible:outline-offset-2`}
      >
        {HERO.primaryLabel}
      </a>
      <a
        href={`#${SECTION_IDS.howItWorks}`}
        className={`${focusOnBrand} font-semibold text-white underline decoration-2 underline-offset-4 hover:text-sky-wash focus-visible:outline-2 focus-visible:outline-offset-2`}
      >
        {HERO.secondaryLabel}
      </a>
    </div>
  );
}

export function Hero() {
  return (
    <section className="bg-shark-blue-dark px-4 py-16 text-white md:py-20">
      <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-[1.4fr_1fr]">
        <div>
          <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">{HERO.title}</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-white/85">{HERO.subtitle}</p>
          <HeroActions />
        </div>
        <div className="flex justify-center md:justify-end">
          <Image
            src="/landing/scamerino-alertinio.png"
            alt={HERO.imageAlt}
            width={456}
            height={547}
            priority
            sizes="(min-width: 768px) 360px, 220px"
            className="h-auto w-56 md:w-[360px]"
          />
        </div>
      </div>
    </section>
  );
}
