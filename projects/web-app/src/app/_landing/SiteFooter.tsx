import { FOOTER, SOURCES } from "./content";

export function SiteFooter() {
  return (
    <footer className="bg-navy-slate px-4 py-12 text-sm text-white/75">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1fr_2fr]">
        <div>
          <p className="font-display text-base font-bold text-white">{FOOTER.brand}</p>
          <p className="mt-1">{FOOTER.team}</p>
          <p className="mt-4">{FOOTER.demoNotice}</p>
        </div>
        <div>
          <h2 className="font-bold text-white">{FOOTER.sourcesTitle}</h2>
          <ol className="mt-3 space-y-2">
            {SOURCES.map((source) => (
              <li key={source.id} id={`zrodlo-${source.id}`} className="scroll-mt-20">
                {source.id}.{" "}
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-white focus-visible:outline-2 focus-visible:outline-white"
                >
                  {source.text}
                </a>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </footer>
  );
}
