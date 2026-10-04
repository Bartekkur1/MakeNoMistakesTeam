import { STAT_PAIRS, STATS } from "./content";
import { Footnote } from "./Footnote";

export function Stats() {
  return (
    <section className="border-b border-titanium-border bg-white px-4 py-14">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-display text-xl font-bold text-navy-slate md:text-2xl">{STATS.title}</h2>
        <dl className="mt-8 grid gap-10 md:grid-cols-2">
          {STAT_PAIRS.map((pair) => (
            <div key={pair.first.value} className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-4">
              <dt className="font-display text-4xl font-bold text-shark-blue">{pair.first.value}</dt>
              <dd className="pt-1 text-navy-slate">{pair.first.label}</dd>
              <dt className="font-display text-4xl font-bold text-hook-crimson">{pair.second.value}</dt>
              <dd className="pt-1 text-navy-slate">
                {pair.second.label}
                <Footnote id={pair.sourceId} />
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-8 text-sm text-muted-slate">{STATS.note}</p>
      </div>
    </section>
  );
}
