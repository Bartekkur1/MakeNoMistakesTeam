import {
  DEMO_LOGIN_CODE,
  EXTENSION_DOWNLOAD_URL,
  INSTALL,
  LOGIN_HREF,
  PANEL,
  RELEASES_URL,
  ROLE_LABELS,
  SECTION_IDS,
  presentableDemoAccounts,
} from "./content";
import { Section } from "./Section";
import { buttonLarge, primaryButton, textLink } from "./styles";

export function Install() {
  const accounts = presentableDemoAccounts();

  return (
    <Section id={SECTION_IDS.install} title={INSTALL.title} intro={INSTALL.intro}>
      <div className="grid gap-12 md:grid-cols-[1.3fr_1fr]">
        <div>
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <a href={EXTENSION_DOWNLOAD_URL} className={`${primaryButton} ${buttonLarge}`}>
              {INSTALL.downloadLabel}
            </a>
            <a href={RELEASES_URL} target="_blank" rel="noopener noreferrer" className={textLink}>
              {INSTALL.releasesLabel}
            </a>
          </div>
          <ol className="mt-8 list-decimal space-y-3 pl-6 text-navy-slate marker:font-bold marker:text-shark-blue">
            {INSTALL.steps.map((step) => (
              <li key={step.text} className="pl-1">
                {step.text}
                {step.code && (
                  <>
                    {" "}
                    <code className="select-all break-all rounded bg-sky-wash px-2 py-0.5 font-semibold">{step.code}</code>
                  </>
                )}
              </li>
            ))}
          </ol>
        </div>
        <aside className="rounded-xl border border-titanium-border p-6">
          <h3 className="font-display text-lg font-bold text-navy-slate">{PANEL.title}</h3>
          <p className="mt-2 text-muted-slate">{PANEL.text}</p>
          <a href={LOGIN_HREF} className={`${primaryButton} ${buttonLarge} mt-5 w-full`}>
            {PANEL.loginLabel}
          </a>
          <h4 className="mt-6 text-sm font-bold text-navy-slate">{PANEL.demoTitle}</h4>
          <ul className="mt-2 space-y-1.5 text-sm">
            {accounts.map((account) => (
              <li key={account.id} className="flex flex-col sm:flex-row sm:gap-2">
                <span className="text-muted-slate sm:w-24 sm:shrink-0">{ROLE_LABELS[account.role]}</span>
                <span className="min-w-0 break-all text-navy-slate">{account.email}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-navy-slate">
            {PANEL.demoCodeLabel} <strong>{DEMO_LOGIN_CODE}</strong>
          </p>
          <p className="mt-1 text-sm text-muted-slate">{PANEL.demoNote}</p>
        </aside>
      </div>
    </Section>
  );
}
