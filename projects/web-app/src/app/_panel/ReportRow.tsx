// One report in the list (D-10), hook-free. Line 1 carries the state badge and, when the child
// clicked, gave data or paid, the risk badge. The whole row is one link to the detail. The content
// was written by a child or a scammer, so it is rendered only as React text: never as HTML and
// never turned into links.

import Link from "next/link";
import type { ChildInfo, Report } from "@/lib/contract/types";
import { RiskBadge, StateBadge } from "./badges";
import { reportHref } from "./content";
import { excerpt, formatDateTime, rowMeta } from "./format";

export interface ReportRowProps {
  report: Report;
  sessionChildren: readonly ChildInfo[];
}

export function ReportRow({ report, sessionChildren }: ReportRowProps) {
  return (
    <li>
      <Link
        href={reportHref(report.id)}
        className="block px-4 py-4 md:px-6 hover:bg-ice-surface focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-shark-blue"
      >
        <div className="flex flex-wrap items-center gap-2">
          <StateBadge state={report.state} />
          <RiskBadge actions={report.taken_actions} />
          <time dateTime={report.created_at} className="ml-auto text-sm text-muted-slate">
            {formatDateTime(report.created_at)}
          </time>
        </div>
        <p className="mt-2 text-base text-navy-slate line-clamp-2 [overflow-wrap:anywhere]">{excerpt(report.content)}</p>
        <p className="mt-1 text-sm text-muted-slate">{rowMeta(report, sessionChildren)}</p>
      </Link>
    </li>
  );
}
