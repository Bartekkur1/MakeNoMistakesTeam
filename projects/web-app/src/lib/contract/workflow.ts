// Pure workflow rules derived from TRANSITIONS (D-08, D-09). Shared by the API (which decides
// 403 vs 409 before any write) and the phase-2 panel (which shows only the available buttons).
// Erasable TypeScript only, no server imports.

import {
  TRANSITIONS,
  TRANSITION_ACTIONS,
  type AccountRole,
  type ReportState,
  type TransitionAction,
  type TransitionRule,
} from "./types";

export type TransitionDecision =
  | { ok: true; rule: TransitionRule }
  | { ok: false; code: "forbidden" | "invalid_transition" };

// forbidden: no TRANSITIONS row for this action lists the role (it may never do it).
// invalid_transition: the role may do the action, but not from this state.
export function resolveTransition(action: TransitionAction, state: ReportState, role: AccountRole): TransitionDecision {
  const rows = TRANSITIONS.filter((rule) => rule.action === action);
  if (!rows.some((rule) => rule.roles.includes(role))) {
    return { ok: false, code: "forbidden" };
  }
  const rule = rows.find((row) => row.from.includes(state) && row.roles.includes(role));
  if (!rule) {
    return { ok: false, code: "invalid_transition" };
  }
  return { ok: true, rule };
}

// The actions this role can perform on a report in this state, in TRANSITION_ACTIONS order.
export function availableActions(state: ReportState, role: AccountRole): TransitionAction[] {
  return TRANSITION_ACTIONS.filter((action) => resolveTransition(action, state, role).ok);
}
