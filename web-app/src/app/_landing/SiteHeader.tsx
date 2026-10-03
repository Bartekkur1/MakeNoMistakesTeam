import Image from "next/image";
import { LOGIN_HREF, NAV_LINKS } from "./content";
import { buttonSmall, primaryButton } from "./styles";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-titanium-border bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <a href="#" className="flex items-center gap-2 font-display text-base font-bold text-navy-slate">
          <Image src="/scamerino-head-128.png" alt="" width={40} height={40} className="h-10 w-10" />
          BezpiecznaAura
        </a>
        <nav aria-label="Sekcje strony" className="hidden md:block">
          <ul className="flex gap-6 text-sm font-semibold text-muted-slate">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="hover:text-shark-blue">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <a href={LOGIN_HREF} className={`${primaryButton} ${buttonSmall}`}>
          Zaloguj się
        </a>
      </div>
    </header>
  );
}
