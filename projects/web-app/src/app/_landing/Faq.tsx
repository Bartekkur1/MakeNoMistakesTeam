import { FAQ, SECTION_IDS } from "./content";
import { Section } from "./Section";

export function Faq() {
  return (
    <Section id={SECTION_IDS.faq} title={FAQ.title} tone="wash">
      <div className="max-w-3xl divide-y divide-titanium-border border-y border-titanium-border">
        {FAQ.items.map((item) => (
          <details key={item.question} className="group py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-bold text-navy-slate focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-shark-blue [&::-webkit-details-marker]:hidden">
              {item.question}
              <span className="text-2xl text-shark-blue transition-transform group-open:rotate-45" aria-hidden="true">
                +
              </span>
            </summary>
            <p className="mt-3 text-navy-slate">{item.answer}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}
