import Image from "next/image";
import { HOW_IT_WORKS, PLUGIN_SCREENSHOT, SECTION_IDS } from "./content";
import { Section } from "./Section";

export function HowItWorks() {
  return (
    <Section id={SECTION_IDS.howItWorks} title={HOW_IT_WORKS.title}>
      <ol className="grid gap-8 md:grid-cols-4 md:gap-6">
        {HOW_IT_WORKS.steps.map((step, index) => (
          <li key={step.title} className="border-t-4 border-shark-blue pt-5">
            <span className="font-display text-sm font-bold text-shark-blue">0{index + 1}</span>
            <h3 className="mt-2 text-lg font-bold text-navy-slate">{step.title}</h3>
            <p className="mt-2 text-muted-slate">{step.text}</p>
          </li>
        ))}
      </ol>
      <figure className="mt-12">
        <Image
          src={PLUGIN_SCREENSHOT.src}
          alt={PLUGIN_SCREENSHOT.alt}
          width={PLUGIN_SCREENSHOT.width}
          height={PLUGIN_SCREENSHOT.height}
          sizes="(min-width: 1152px) 1152px, 100vw"
          className="h-auto w-full rounded-xl border border-titanium-border shadow-lg"
        />
        <figcaption className="mt-3 max-w-2xl text-sm text-muted-slate">{PLUGIN_SCREENSHOT.caption}</figcaption>
      </figure>
      <p className="mt-10 max-w-2xl text-navy-slate">{HOW_IT_WORKS.trainingNote}</p>
    </Section>
  );
}
