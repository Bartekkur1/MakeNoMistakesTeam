import { HOW_IT_WORKS, PLUGIN_SCREENSHOTS, SECTION_IDS } from "./content";
import { PluginCarousel } from "./PluginCarousel";
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
      <PluginCarousel slides={PLUGIN_SCREENSHOTS} />
      <p className="mt-10 max-w-2xl text-navy-slate">{HOW_IT_WORKS.trainingNote}</p>
    </Section>
  );
}
