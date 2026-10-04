// The first two cards of the report detail (D-04), hook-free so they render on the server and in
// tests. The content was written by a child or a scammer and is a suspected scam: it is rendered
// only as React text, never as HTML, and URLs in it are never turned into links. "Co dziecko już
// zrobiło" answers "czy już kliknąłeś, podałeś dane lub zapłaciłeś" with the selected
// taken_actions, the risky ones highlighted. There is no signals section and no slot for one.

import {
  ATTACK_TYPE_LABELS_PL,
  REPORT_SOURCE_LABELS_PL,
  TAKEN_ACTION_LABELS_PL,
  TAKEN_ACTIONS,
  type Report,
  type TakenAction,
} from "@/lib/contract/types";
import { DETAIL } from "./content";
import { capitalize, formatDateTime, isRiskyAction } from "./format";
import { badgeBase, card } from "./styles";

const sectionClasses = `${card} p-4 md:p-6 lg:col-start-1`;
const titleClasses = "font-display text-xl font-semibold leading-tight";

const CONTENT_TITLE_ID = "report-content-title";
const TAKEN_TITLE_ID = "report-taken-title";

export interface ReportContentCardProps {
  report: Report;
  childLabel: string;
}

export function ReportContentCard({ report, childLabel }: ReportContentCardProps) {
  const isTraining = report.source === "game";
  return (
    <section aria-labelledby={CONTENT_TITLE_ID} className={sectionClasses}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id={CONTENT_TITLE_ID} className={titleClasses}>
          {isTraining ? "Szczegóły szkolenia" : DETAIL.contentTitle}
        </h2>
        {isTraining ? (
          <span className={`${badgeBase} border-shark-blue bg-sky-wash text-shark-blue-dark`}>
            🎓 Szkolenie Roblox
          </span>
        ) : null}
      </div>
      <blockquote className="mt-4 rounded-dashboard bg-sky-wash p-4 text-base whitespace-pre-wrap [overflow-wrap:anywhere]">
        {report.content}
      </blockquote>
      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted-slate">{DETAIL.terms.child}</dt>
        <dd className="text-navy-slate">{childLabel}</dd>
        <dt className="text-muted-slate">{DETAIL.terms.source}</dt>
        <dd className="text-navy-slate">{capitalize(REPORT_SOURCE_LABELS_PL[report.source])}</dd>
        <dt className="text-muted-slate">{DETAIL.terms.attackType}</dt>
        <dd className="text-navy-slate">{capitalize(ATTACK_TYPE_LABELS_PL[report.attack_type])}</dd>
        <dt className="text-muted-slate">{DETAIL.terms.createdAt}</dt>
        <dd className="text-navy-slate">
          <time dateTime={report.created_at}>{formatDateTime(report.created_at)}</time>
        </dd>
        <dt className="text-muted-slate">{DETAIL.terms.updatedAt}</dt>
        <dd className="text-navy-slate">
          <time dateTime={report.updated_at}>{formatDateTime(report.updated_at)}</time>
        </dd>
      </dl>
    </section>
  );
}

export interface TakenActionsCardProps {
  actions: readonly TakenAction[];
}

export function TakenActionsCard({ actions }: TakenActionsCardProps) {
  const selected = TAKEN_ACTIONS.filter((action) => actions.includes(action));
  return (
    <section aria-labelledby={TAKEN_TITLE_ID} className={sectionClasses}>
      <h2 id={TAKEN_TITLE_ID} className={titleClasses}>
        {DETAIL.takenTitle}
      </h2>
      <p className="mt-2 text-sm text-muted-slate">{DETAIL.takenHelper}</p>
      {selected.length === 0 ? (
        <p className="mt-4 text-base text-navy-slate">{DETAIL.takenEmpty}</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {selected.map((action) =>
            isRiskyAction(action) ? (
              <li
                key={action}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border-l-4 border-hook-crimson bg-hook-crimson/10 px-4 py-2 text-base"
              >
                <span>{capitalize(TAKEN_ACTION_LABELS_PL[action])}</span>
                <span className={`${badgeBase} border-hook-crimson bg-white text-navy-slate`}>{DETAIL.riskyTag}</span>
              </li>
            ) : (
              <li key={action} className="rounded-lg border border-titanium-border px-4 py-2 text-base">
                {capitalize(TAKEN_ACTION_LABELS_PL[action])}
              </li>
            ),
          )}
        </ul>
      )}
    </section>
  );
}
