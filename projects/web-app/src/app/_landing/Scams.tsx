import { HONEST_EXAMPLE, SCAMS, SCAMS_SECTION } from "./content";
import { Footnote } from "./Footnote";

export function Scams() {
  return (
    <section className="bg-sky-wash px-4 py-16 md:py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="max-w-3xl font-display text-2xl font-bold leading-tight text-navy-slate md:text-4xl">
          {SCAMS_SECTION.title}
        </h2>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-slate">
          {SCAMS_SECTION.intro}
          <Footnote id={SCAMS_SECTION.sourceId} />
        </p>
        <ul className="mt-10 grid gap-x-8 gap-y-10 md:grid-cols-2">
          {SCAMS.map((scam) => (
            <li key={scam.title}>
              <p className="flex items-center gap-2 text-sm font-semibold text-navy-slate">
                <span className="rounded bg-hook-crimson px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-white">
                  {SCAMS_SECTION.scamLabel}
                </span>
                {scam.title}
              </p>
              <blockquote className="mt-3 rounded-2xl rounded-tl-sm bg-white px-5 py-4 text-navy-slate shadow-sm">
                {scam.message}
              </blockquote>
              <p className="mt-3 text-sm font-semibold text-navy-slate">{SCAMS_SECTION.signalsLabel}:</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {scam.signals.map((signal) => (
                  <li key={signal} className="rounded-full border border-siren-amber bg-white px-3 py-1 text-sm text-navy-slate">
                    {signal}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm text-navy-slate">
                <span className="font-semibold">{SCAMS_SECTION.actionLabel}:</span> {scam.action}
              </p>
            </li>
          ))}
          <li>
            <p className="flex items-center gap-2 text-sm font-semibold text-navy-slate">
              <span className="rounded bg-shark-blue px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-white">
                {SCAMS_SECTION.honestLabel}
              </span>
              {HONEST_EXAMPLE.title}
            </p>
            <blockquote className="mt-3 rounded-2xl rounded-tl-sm bg-white px-5 py-4 text-navy-slate shadow-sm">
              {HONEST_EXAMPLE.message}
            </blockquote>
            <p className="mt-3 text-sm leading-6 text-navy-slate">{HONEST_EXAMPLE.note}</p>
          </li>
        </ul>
      </div>
    </section>
  );
}
