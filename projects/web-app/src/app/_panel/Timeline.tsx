// The "Historia i komentarze" card (D-13), hook-free so it renders on the server and in tests:
// state changes and comments on one axis, oldest first, each with its type word, author ("(Ty)" for
// the logged-in account), role and time. Notes and comments were written by people and may quote
// the scam, so they are rendered only as React text, never as HTML and never turned into links.
// The card's children slot holds the new-comment form under the timeline.

import type { ReactNode } from "react";
import { ACTOR_ROLE_LABELS_PL, type ChildInfo, type ReportDetail } from "@/lib/contract/types";
import { TIMELINE } from "./content";
import { actorName, formatDateTime, historyEntryBody, mergeTimeline, type TimelineItem } from "./format";
import { card } from "./styles";

const TIMELINE_TITLE_ID = "report-timeline-title";

export interface TimelineProps {
  items: readonly TimelineItem[];
  sessionChildren: readonly ChildInfo[];
  ownAccountId: string;
}

interface EntryHeaderProps {
  typeWord: string;
  author: string;
  own: boolean;
  roleLabel: string;
  createdAt: string;
}

// "Zmiana stanu · Mama Oli (Ty) · rodzic · 3 paź 2026, 10:52". The meta part is one text node, so
// the author and "(Ty)" stay together in the markup.
function EntryHeader({ typeWord, author, own, roleLabel, createdAt }: EntryHeaderProps) {
  const meta = `${TIMELINE.separator}${own ? author + TIMELINE.own : author}${TIMELINE.separator}${roleLabel}${TIMELINE.separator}`;
  return (
    <p className="text-sm">
      <span className="font-semibold text-navy-slate">{typeWord}</span>
      <span className="text-muted-slate">
        {meta}
        <time dateTime={createdAt}>{formatDateTime(createdAt)}</time>
      </span>
    </p>
  );
}

function Marker({ kind }: { kind: TimelineItem["kind"] }) {
  const look = kind === "history" ? "bg-navy-slate" : "border-2 border-titanium-border bg-white";
  return <span aria-hidden="true" className={`absolute mt-1 -ml-[31px] size-3 rounded-full ${look}`} />;
}

function TimelineEntry({ item, sessionChildren, ownAccountId }: { item: TimelineItem } & Omit<TimelineProps, "items">) {
  if (item.kind === "history") {
    const { entry } = item;
    return (
      <li className="relative">
        <Marker kind="history" />
        <EntryHeader
          typeWord={TIMELINE.stateChange}
          author={actorName(entry.actor_id, entry.actor_role, sessionChildren)}
          own={entry.actor_id === ownAccountId}
          roleLabel={ACTOR_ROLE_LABELS_PL[entry.actor_role]}
          createdAt={entry.created_at}
        />
        <p className="mt-1 text-base">{historyEntryBody(entry)}</p>
        {entry.comment !== null ? (
          <p className="mt-2 rounded-lg bg-ice-surface px-4 py-2 text-base whitespace-pre-wrap [overflow-wrap:anywhere]">
            <span className="font-semibold">{TIMELINE.notePrefix}</span>
            {entry.comment}
          </p>
        ) : null}
      </li>
    );
  }
  const { comment } = item;
  return (
    <li className="relative">
      <Marker kind="comment" />
      <EntryHeader
        typeWord={TIMELINE.comment}
        author={actorName(comment.author_id, comment.author_role, sessionChildren)}
        own={comment.author_id === ownAccountId}
        roleLabel={ACTOR_ROLE_LABELS_PL[comment.author_role]}
        createdAt={comment.created_at}
      />
      <p className="mt-2 rounded-lg border border-titanium-border bg-white px-4 py-2 text-base whitespace-pre-wrap [overflow-wrap:anywhere]">
        {comment.body}
      </p>
    </li>
  );
}

export function Timeline({ items, sessionChildren, ownAccountId }: TimelineProps) {
  return (
    <ol className="mt-6 space-y-6 border-l-2 border-shield-silver pl-6">
      {items.map((item) => (
        <TimelineEntry key={`${item.kind}:${item.id}`} item={item} sessionChildren={sessionChildren} ownAccountId={ownAccountId} />
      ))}
    </ol>
  );
}

export interface TimelineCardProps {
  report: ReportDetail;
  sessionChildren: readonly ChildInfo[];
  ownAccountId: string;
  children?: ReactNode;
}

export function TimelineCard({ report, sessionChildren, ownAccountId, children }: TimelineCardProps) {
  return (
    <section aria-labelledby={TIMELINE_TITLE_ID} className={`${card} p-4 md:p-6 lg:col-start-1`}>
      <h2 id={TIMELINE_TITLE_ID} className="font-display text-xl font-semibold leading-tight">
        {TIMELINE.title}
      </h2>
      <Timeline
        items={mergeTimeline(report.history, report.comments)}
        sessionChildren={sessionChildren}
        ownAccountId={ownAccountId}
      />
      {children}
    </section>
  );
}
