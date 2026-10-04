"use client";

// The "Zmień stan" card on the report detail (D-12). It shows the current state and one button per
// action this role can take now, from availableActions() in the contract workflow, so a button the
// server would refuse never appears (the server still re-checks every transition). Approve and
// close are the filled buttons and come first. Each button opens the confirmation dialog; the
// "Zapisano. Obecny stan: …" line appears only after the server confirmed the change (201).

import { useState } from "react";
import { buttonLarge } from "@/app/_landing/styles";
import { availableActions } from "@/lib/contract/workflow";
import {
  REPORT_STATE_LABELS_PL,
  type AccountRole,
  type Report,
  type ReportState,
  type TransitionAction,
  type TransitionResponse,
} from "@/lib/contract/types";
import { StateBadge } from "./badges";
import { ACTIONS_CARD } from "./content";
import { actionButtonLabel, fillTemplate, isPrimaryAction, orderedActions, type UnconfirmedAttempt } from "./format";
import { alertSuccess, card, panelPrimaryButton, secondaryButton } from "./styles";
import { TransitionDialog } from "./TransitionDialog";

export interface ReportActionsCardProps {
  report: Report;
  role: AccountRole;
  token: string;
  // The state the last confirmed transition saved, or null.
  success: ReportState | null;
  onDone: (response: TransitionResponse) => void;
  onConflict: (note: string, attempt: UnconfirmedAttempt | null) => void;
  onNotFound: () => void;
}

export function ReportActionsCard({ report, role, token, success, onDone, onConflict, onNotFound }: ReportActionsCardProps) {
  const [openAction, setOpenAction] = useState<TransitionAction | null>(null);
  const actions = orderedActions(availableActions(report.state, role));

  return (
    <section
      aria-labelledby="report-actions-title"
      className={`${card} p-4 md:p-6 lg:col-start-2 lg:row-start-1 lg:row-span-3 lg:self-start lg:sticky lg:top-24`}
    >
      <h2 id="report-actions-title" className="font-display text-xl font-semibold leading-tight">
        {ACTIONS_CARD.title}
      </h2>
      <p className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-slate">{ACTIONS_CARD.current}</span>
        <StateBadge state={report.state} />
      </p>

      {success !== null ? (
        <div role="status" className={`${alertSuccess} mt-4`}>
          <p>{fillTemplate(ACTIONS_CARD.success, { state: REPORT_STATE_LABELS_PL[success] })}</p>
        </div>
      ) : null}

      {actions.length === 0 ? (
        <p className="mt-4 text-base text-muted-slate">{ACTIONS_CARD.none}</p>
      ) : (
        <div className="mt-4 flex flex-col gap-2">
          {actions.map((action) => (
            <button
              key={action}
              type="button"
              className={`${isPrimaryAction(action) ? panelPrimaryButton : secondaryButton} ${buttonLarge} w-full`}
              onClick={() => setOpenAction(action)}
            >
              {actionButtonLabel(action)}
            </button>
          ))}
        </div>
      )}

      {openAction !== null ? (
        <TransitionDialog
          key={`${report.id}:${openAction}`}
          reportId={report.id}
          token={token}
          action={openAction}
          fromState={report.state}
          onDone={onDone}
          onConflict={onConflict}
          onNotFound={onNotFound}
          onClose={() => setOpenAction(null)}
        />
      ) : null}
    </section>
  );
}
