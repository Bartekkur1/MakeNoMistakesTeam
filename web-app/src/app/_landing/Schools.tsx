import { SCHOOLS, SECTION_IDS, TRAINING_FACT } from "./content";
import { Footnote } from "./Footnote";
import { Section } from "./Section";

export function Schools() {
  return (
    <Section id={SECTION_IDS.schools} title={SCHOOLS.title}>
      <div className="grid gap-12 md:grid-cols-[1.2fr_1fr]">
        <ul className="list-disc space-y-4 pl-5 text-lg text-navy-slate marker:text-shark-blue">
          {SCHOOLS.points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
        <figure className="rounded-xl bg-sky-wash p-6 md:p-8">
          <h3 className="font-display text-lg font-bold text-navy-slate">{TRAINING_FACT.title}</h3>
          <p className="mt-3 text-navy-slate">
            {TRAINING_FACT.text}
            <Footnote id={TRAINING_FACT.sourceId} />
          </p>
          <dl className="mt-6 grid grid-cols-3 gap-3 text-center">
            {TRAINING_FACT.steps.map((step) => (
              <div key={step.label} className="rounded-lg bg-white p-3">
                <dt className="text-xs text-muted-slate">{step.label}</dt>
                <dd className="mt-1 font-display text-sm font-bold text-shark-blue-dark">{step.value}</dd>
              </div>
            ))}
          </dl>
        </figure>
      </div>
    </Section>
  );
}
