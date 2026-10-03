// RED skeleton (plan 01-05 Task 1): not implemented yet.
import type { AccountRole, ReportState, TransitionAction, TransitionRule } from "./types";

export type TransitionDecision =
  | { ok: true; rule: TransitionRule }
  | { ok: false; code: "forbidden" | "invalid_transition" };

export function resolveTransition(_action: TransitionAction, _state: ReportState, _role: AccountRole): TransitionDecision {
  return { ok: false, code: "invalid_transition" };
}

export function availableActions(_state: ReportState, _role: AccountRole): TransitionAction[] {
  return [];
}
