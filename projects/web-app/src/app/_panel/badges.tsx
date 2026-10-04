// Hook-free panel badges, safe to render on the server and in tests.

import { REPORT_STATE_LABELS_PL, type ReportState, type TakenAction } from "@/lib/contract/types";
import { riskLabel } from "./format";
import { badgeBase, riskBadgeClasses, STATE_BADGE_CLASSES } from "./styles";

// The colored state label (D-09). The contract label is always shown, so color is never the only cue.
export function StateBadge({ state }: { state: ReportState }) {
  return <span className={`${badgeBase} ${STATE_BADGE_CLASSES[state]}`}>{REPORT_STATE_LABELS_PL[state]}</span>;
}

// The risk marker (D-04, D-10): "Ryzyko: " and the categories present, after a decorative crimson
// dot. Nothing renders when the child neither clicked, gave data nor paid.
export function RiskBadge({ actions }: { actions: readonly TakenAction[] }) {
  const label = riskLabel(actions);
  if (label === null) return null;
  return (
    <span className={`${badgeBase} ${riskBadgeClasses} gap-2`}>
      <span aria-hidden="true" className="size-2 rounded-full bg-hook-crimson" />
      {label}
    </span>
  );
}
