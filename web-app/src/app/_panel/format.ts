// Pure display helpers for the panel (no React, no browser globals), so vitest can test them
// directly: names, dates and clock times, copy templates, the list excerpt, the row meta line and
// the risk marker.

import { DEMO_CHILDREN, findDemoAccountById } from "@/lib/contract/demo-accounts";
import {
  ACTOR_ROLE_LABELS_PL,
  ATTACK_TYPE_LABELS_PL,
  REPORT_SOURCE_LABELS_PL,
  REPORT_STATE_LABELS_PL,
  type ActorRole,
  type ChildInfo,
  type HistoryEntry,
  type Report,
  type ReportComment,
  type TakenAction,
} from "@/lib/contract/types";
import { LIST, NAMES, RISK, TIMELINE } from "./content";

// The data files mark fictional names with a trailing suffix; the panel never shows it (D-02).
const NAME_SUFFIX = /\s*\((demo|smoke)\)$/;

export function displayName(name: string): string {
  return name.replace(NAME_SUFFIX, "");
}

// Contract labels are lowercase; a label that starts a line or a button gets a capital letter.
export function capitalize(text: string): string {
  return text.length === 0 ? text : text.charAt(0).toLocaleUpperCase("pl-PL") + text.slice(1);
}

// Every panel date is Polish and in the school's time zone, whatever the viewer's zone is.
const DATE_TIME_FORMAT = new Intl.DateTimeFormat("pl-PL", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Warsaw",
});

// "3 paź 2026, 10:40" for 2026-10-03T08:40:00.000Z. Show it inside <time dateTime={iso}>.
export function formatDateTime(iso: string): string {
  return DATE_TIME_FORMAT.format(new Date(iso));
}

const CLOCK_FORMAT = new Intl.DateTimeFormat("pl-PL", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Warsaw",
});

// "10:05": the time of day only, for notes such as "Odświeżono {time}".
export function formatClock(date: Date): string {
  return CLOCK_FORMAT.format(date);
}

// Replaces every {key} in a copy template; a key without a value stays as written.
export function fillTemplate(template: string, values: Readonly<Record<string, string>>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (Object.hasOwn(values, key) ? values[key] : match));
}

// The list row shows the start of the message: whitespace runs collapse to one space, and
// anything longer than max is cut at max characters and ends with "…".
export function excerpt(content: string, max: number = 140): string {
  const text = content.replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}…`;
}

// A child's name without the demo suffix: the demo children first, then the children the login
// returned, else the neutral fallback. A row never shows an empty name.
export function childName(childId: string, sessionChildren: readonly ChildInfo[]): string {
  const child = DEMO_CHILDREN.find((c) => c.id === childId) ?? sessionChildren.find((c) => c.id === childId);
  const name = child ? displayName(child.display_name).trim() : "";
  return name === "" ? NAMES.childFallback : name;
}

// Row line 3: "{child} · {source} · {attack type}" with the contract labels.
export function rowMeta(report: Report, sessionChildren: readonly ChildInfo[]): string {
  return [
    childName(report.child_id, sessionChildren),
    REPORT_SOURCE_LABELS_PL[report.source],
    ATTACK_TYPE_LABELS_PL[report.attack_type],
  ].join(LIST.metaSeparator);
}


// A report id from the address bar is used only when it is exactly one UUID; anything else shows
// the not-found view without a request (T-02-12). The panel cannot import the server's isUuid.
const REPORT_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isReportId(id: string): boolean {
  return REPORT_ID.test(id);
}

// One entry of the detail timeline (D-13): a state change or a comment.
export type TimelineItem =
  | { kind: "history"; id: string; created_at: string; entry: HistoryEntry }
  | { kind: "comment"; id: string; created_at: string; comment: ReportComment };

const KIND_ORDER: Record<TimelineItem["kind"], number> = { history: 0, comment: 1 };

// History and comments on one axis, oldest first; on equal times a state change comes before a
// comment, then the lower id. Returns a new array; the inputs are left as they are.
export function mergeTimeline(history: readonly HistoryEntry[], comments: readonly ReportComment[]): TimelineItem[] {
  const items: TimelineItem[] = [
    ...history.map((entry): TimelineItem => ({ kind: "history", id: entry.id, created_at: entry.created_at, entry })),
    ...comments.map(
      (comment): TimelineItem => ({ kind: "comment", id: comment.id, created_at: comment.created_at, comment }),
    ),
  ];
  return items.sort((a, b) => {
    const byTime = Date.parse(a.created_at) - Date.parse(b.created_at);
    if (byTime !== 0) return byTime;
    const byKind = KIND_ORDER[a.kind] - KIND_ORDER[b.kind];
    if (byKind !== 0) return byKind;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
}

// The author of a timeline entry without the demo suffix: a child through the child lookup, a
// parent or teacher through the demo accounts, else the capitalized role label. Never empty.
export function actorName(actorId: string, actorRole: ActorRole, sessionChildren: readonly ChildInfo[]): string {
  if (actorRole === "child") return childName(actorId, sessionChildren);
  const account = findDemoAccountById(actorId);
  const name = account ? displayName(account.display_name).trim() : "";
  return name === "" ? capitalize(ACTOR_ROLE_LABELS_PL[actorRole]) : name;
}

// "Dziecko przekazało zgłoszenie. Stan: „…”." for the submit, "Zmiana z „…” na „…”." otherwise.
export function historyEntryBody(entry: HistoryEntry): string {
  const to = REPORT_STATE_LABELS_PL[entry.to_state];
  if (entry.action === "submit" || entry.from_state === null) {
    return fillTemplate(TIMELINE.submitBody, { to });
  }
  return fillTemplate(TIMELINE.transitionBody, { from: REPORT_STATE_LABELS_PL[entry.from_state], to });
}

// The risk marker (D-04, D-10): the actions that answer "did the child click, give data or pay",
// grouped into the three categories in badge order. downloaded_file and replied are shown on the
// detail page but are not highlighted (UI-SPEC A5). The marker describes one report only; nothing
// counts or ranks children.
export const RISK_CATEGORIES: readonly { label: string; actions: readonly TakenAction[] }[] = [
  { label: RISK.click, actions: ["clicked_link"] },
  { label: RISK.data, actions: ["entered_password", "shared_code", "shared_personal_data"] },
  { label: RISK.payment, actions: ["paid"] },
];

// The labels of the categories present, in badge order.
export function riskCategories(actions: readonly TakenAction[]): string[] {
  return RISK_CATEGORIES.filter((category) => category.actions.some((action) => actions.includes(action))).map(
    (category) => category.label,
  );
}

export function isRiskyAction(action: TakenAction): boolean {
  return RISK_CATEGORIES.some((category) => category.actions.includes(action));
}

// "Ryzyko: kliknięcie, podanie danych", or null when no risky action was taken.
export function riskLabel(actions: readonly TakenAction[]): string | null {
  const labels = riskCategories(actions);
  return labels.length === 0 ? null : RISK.prefix + labels.join(RISK.separator);
}
