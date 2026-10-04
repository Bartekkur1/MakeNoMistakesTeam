// A single training entry in the "Szkolenia Roblox" tab. Extracts the training name and outcome
// from the ingested report content (set by ingestContent() in roblox.ts) and presents it as an
// educational achievement card rather than a security incident row.
//
// Content format written by ingestContent():
//   "Szkolenie: <name> [<id>]. Ćwiczenie Roblox, gracz <nick>. Wynik ćwiczenia: bezpieczna odmowa (zaliczone)…"
//   or: "…Wynik ćwiczenia: fikcyjne przekazanie hasła (bez rzeczywistego wycieku — wymaga powtórzenia)…"

import Link from "next/link";
import type { ChildInfo, Report } from "@/lib/contract/types";
import { reportHref } from "./content";
import { TRAININGS } from "./content";
import { childName, formatDateTime } from "./format";
import { badgeBase, card } from "./styles";

export interface TrainingRowProps {
  report: Report;
  sessionChildren: readonly ChildInfo[];
}

/** Extracts "Szkolenie: <name> [<id>]" → name, falling back to a generic label. */
function extractTrainingName(content: string): string {
  const match = content.match(/^Szkolenie:\s+(.+?)\s+\[/);
  return match ? match[1].trim() : "Szkolenie Roblox";
}

/** Returns true when the content indicates a safe refusal (passed). */
function isPassed(content: string): boolean {
  return content.includes("bezpieczna odmowa");
}

export function TrainingRow({ report, sessionChildren }: TrainingRowProps) {
  const passed = isPassed(report.content);
  const trainingName = extractTrainingName(report.content);
  const child = childName(report.child_id, sessionChildren);

  const badgeClasses = passed
    ? `${badgeBase} border-shark-blue bg-sky-wash text-shark-blue-dark`
    : `${badgeBase} border-siren-amber bg-siren-amber/15 text-navy-slate`;

  return (
    <li>
      <Link
        href={reportHref(report.id)}
        className="block px-4 py-4 md:px-6 hover:bg-ice-surface focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-shark-blue"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className={badgeClasses}>
            {passed ? `✓ ${TRAININGS.statusPassed}` : `⚠ ${TRAININGS.statusFailed}`}
          </span>
          <time dateTime={report.created_at} className="ml-auto text-sm text-muted-slate">
            {formatDateTime(report.created_at)}
          </time>
        </div>
        <p className="mt-2 text-base font-medium text-navy-slate">{trainingName}</p>
        <p className="mt-1 text-sm text-muted-slate">{child}</p>
      </Link>
    </li>
  );
}
