// Pure display helpers for the panel (no React, no browser globals), so vitest can test them
// directly: names, dates and clock times, copy templates, the list excerpt, the row meta line and
// the risk marker.

import {
  ACTOR_ROLE_LABELS_PL,
  ATTACK_TYPE_LABELS_PL,
  REPORT_SOURCE_LABELS_PL,
  REPORT_STATE_LABELS_PL,
  TRANSITION_ACTION_LABELS_PL,
  TRANSITION_COMMENT_REQUIRED,
  type ActorRole,
  type ChildInfo,
  type HistoryEntry,
  type Report,
  type ReportComment,
  type ReportDetail,
  type ReportState,
  type TakenAction,
  type TransitionAction,
  type TransitionResponse,
} from "@/lib/contract/types";
import { errorMessage, isUnauthorized, type ApiResult } from "./api";
import { ACTIONS_CARD, DIALOG, LIST, NAMES, RISK, TIMELINE } from "./content";
import { CHILD_NAMES, PERSON_NAMES } from "./names";

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

// A child's name without the demo suffix: the known children first (names.ts), then the children
// the login returned, else the neutral fallback. A row never shows an empty name.
export function childName(childId: string, sessionChildren: readonly ChildInfo[]): string {
  const known = CHILD_NAMES.get(childId);
  const child = known === undefined ? sessionChildren.find((c) => c.id === childId) : undefined;
  const name = (known ?? (child ? displayName(child.display_name) : "")).trim();
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
// parent or teacher through the known names (names.ts), else the capitalized role label. Never empty.
export function actorName(actorId: string, actorRole: ActorRole, sessionChildren: readonly ChildInfo[]): string {
  if (actorRole === "child") return childName(actorId, sessionChildren);
  const name = (PERSON_NAMES.get(actorId) ?? "").trim();
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

// The "Zmień stan" card (D-12): approve and close are the filled, primary buttons.
const PRIMARY_ACTIONS: readonly TransitionAction[] = ["approve", "close"];

export function isPrimaryAction(action: TransitionAction): boolean {
  return PRIMARY_ACTIONS.includes(action);
}

// The available actions with the primary ones first, otherwise in the given order. Returns a new array.
export function orderedActions(actions: readonly TransitionAction[]): TransitionAction[] {
  return [...actions.filter(isPrimaryAction), ...actions.filter((action) => !isPrimaryAction(action))];
}

// "Zatwierdź zgłoszenie": the contract verb with a capital letter plus the noun.
export function actionButtonLabel(action: TransitionAction): string {
  return capitalize(TRANSITION_ACTION_LABELS_PL[action]) + ACTIONS_CARD.buttonSuffix;
}

export interface DialogCopy {
  title: string;
  body: string;
  noteLabel: string;
  noteRequired: boolean;
}

function dialogVariant(action: TransitionAction, fromState: ReportState): { title: string; body: string } {
  switch (action) {
    case "approve":
      return DIALOG.approve;
    case "reject":
      return fromState === "with_teacher" ? DIALOG.rejectTeacher : DIALOG.rejectPending;
    case "escalate":
      return DIALOG.escalate;
    case "close":
      return DIALOG.close;
    case "reopen":
      return fromState === "rejected" ? DIALOG.reopenRejected : DIALOG.reopenClosed;
  }
}

// The dialog's title, consequence and note label for this action from this state. Escalation must
// name its recipient (TRANSITION_COMMENT_REQUIRED); every other note is optional.
export function dialogCopy(action: TransitionAction, fromState: ReportState): DialogCopy {
  const noteRequired = TRANSITION_COMMENT_REQUIRED[action];
  return {
    ...dialogVariant(action, fromState),
    noteLabel: noteRequired ? DIALOG.noteRequired : DIALOG.noteOptional,
    noteRequired,
  };
}

// What the dialog does with a transition response. Only the server's 201 is "done"; every other
// status or a network failure means nothing was saved (CONTRACT "Potwierdzenie zapisu").
export type TransitionOutcome =
  | { kind: "done"; response: TransitionResponse }
  | { kind: "expired" }
  | { kind: "conflict" }
  | { kind: "not-found" }
  | { kind: "field"; message: string }
  | { kind: "alert"; message: string };

export function transitionOutcome(
  result: ApiResult<TransitionResponse>,
  networkMessage: string = DIALOG.networkError,
): TransitionOutcome {
  if (result.ok) return { kind: "done", response: result.value };
  if (isUnauthorized(result)) return { kind: "expired" };
  if (result.kind === "http") {
    // D-15: the other party changed the report first (or this is a repeated click).
    if (result.code === "invalid_transition") return { kind: "conflict" };
    // The report is gone or no longer visible (e.g. the parent rejected it and the teacher lost access).
    if (result.code === "report_not_found") return { kind: "not-found" };
    if (result.code === "validation_error") {
      const field = result.details.find((detail) => detail.field === "comment");
      if (field) return { kind: "field", message: field.message };
    }
  }
  return { kind: "alert", message: errorMessage(result, networkMessage) };
}

// A failure after which the server may still have saved the request: a dropped connection or a
// timeout, or a server-side error. A 4xx answer means the request was refused, so nothing was saved.
export function isUnconfirmedFailure(result: ApiResult<unknown>): boolean {
  if (result.ok) return false;
  return result.kind === "network" || result.status >= 500 || result.code === "internal_error";
}

// Transition attempts in one dialog whose result stayed unknown (isUnconfirmedFailure): the same
// action from the same state, with the note (trimmed, or null) each attempt sent.
export interface UnconfirmedAttempt {
  action: TransitionAction;
  fromState: ReportState;
  comments: readonly (string | null)[];
}

export type RetriedConflict =
  | { kind: "saved"; entry: HistoryEntry }
  | { kind: "saved-then-changed"; entry: HistoryEntry }
  | { kind: "conflict" };

// A 409 for a retry can answer the user's own earlier attempt whose 201 was lost (WR-02). Decided
// from the refetched detail: a history entry that was not known before the attempt, by this
// account, with the same action from the same state and one of the notes that were sent, proves the
// earlier attempt was saved ("saved", or "saved-then-changed" when a later entry moved the report
// on). Anything else is a real conflict (D-15). History is oldest first (CONTRACT).
export function retriedConflict(
  detail: ReportDetail,
  knownEntryIds: ReadonlySet<string>,
  attempt: UnconfirmedAttempt,
  accountId: string,
): RetriedConflict {
  const fresh = detail.history.filter((entry) => !knownEntryIds.has(entry.id));
  const own = fresh.find(
    (entry) =>
      entry.actor_id === accountId &&
      entry.action === attempt.action &&
      entry.from_state === attempt.fromState &&
      attempt.comments.includes(entry.comment),
  );
  if (own === undefined) return { kind: "conflict" };
  const newest = detail.history.at(-1);
  return newest?.id === own.id && detail.state === own.to_state
    ? { kind: "saved", entry: own }
    : { kind: "saved-then-changed", entry: own };
}

// Escalation must name its recipient (TRANSITION_COMMENT_REQUIRED): true when the note is blank
// for such an action, so the dialog blocks it before any request. Other actions may go without one.
export function missingRequiredNote(action: TransitionAction, note: string): boolean {
  return TRANSITION_COMMENT_REQUIRED[action] && note.trim() === "";
}

// The note as sent: trimmed, or null when blank.
export function transitionComment(note: string): string | null {
  const trimmed = note.trim();
  return trimmed === "" ? null : trimmed;
}

// After a 409 (D-15) the unsent note moves into the new-comment field: a blank note leaves the
// draft as it is, an empty draft takes the note, otherwise the note follows after a blank line.
export function mergeDraft(draft: string, note: string): string {
  if (note.trim() === "") return draft;
  if (draft.trim() === "") return note;
  return `${draft}\n\n${note}`;
}

// The comment field after the server confirmed a comment: only the text that was sent goes away.
// `sent` is the field as it was when the comment was submitted. A transition note that a 409 moved
// in while the comment was sending (mergeDraft appends it) stays, as the conflict banner promised.
export function draftAfterSent(current: string, sent: string): string {
  if (current === sent) return "";
  if (current.startsWith(sent)) return current.slice(sent.length).replace(/^\s+/, "");
  return current;
}

