import { PARENTS, SECTION_IDS } from "./content";
import { Section } from "./Section";

export function Parents() {
  return (
    <Section id={SECTION_IDS.parents} title={PARENTS.title} intro={PARENTS.intro} tone="wash">
      <div className="grid overflow-hidden rounded-xl border border-titanium-border bg-white md:grid-cols-2">
        <div className="p-6 md:p-8">
          <h3 className="font-display text-lg font-bold text-shark-blue">{PARENTS.visibleTitle}</h3>
          <ul className="mt-4 list-disc space-y-3 pl-5 text-navy-slate marker:text-shark-blue">
            {PARENTS.visible.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="border-t border-titanium-border p-6 md:border-l md:border-t-0 md:p-8">
          <h3 className="font-display text-lg font-bold text-navy-slate">{PARENTS.hiddenTitle}</h3>
          <ul className="mt-4 list-disc space-y-3 pl-5 text-navy-slate marker:text-muted-slate">
            {PARENTS.hidden.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
      <ul className="mt-10 grid gap-6 md:grid-cols-3">
        {PARENTS.rules.map((rule) => (
          <li key={rule} className="border-l-2 border-padlock-gold pl-4 text-navy-slate">
            {rule}
          </li>
        ))}
      </ul>
    </Section>
  );
}
