// The workflow resolver against the matrix written out by hand (D-08, D-09). This test does not
// import TRANSITIONS: the 10 allowed "action:from:role" combinations below are the six TRANSITIONS
// rows expanded per from state and role (2+2+1+2+2+1), so a wrong edit of the matrix fails here.

import { describe, expect, it } from "vitest";
import { availableActions, resolveTransition } from "@/lib/contract/workflow";
import {
  ACCOUNT_ROLES,
  REPORT_STATES,
  TRANSITION_ACTIONS,
  type AccountRole,
  type ReportState,
  type TransitionAction,
} from "@/lib/contract/types";

// "action:from:role" -> target state.
const ALLOWED: Record<string, ReportState> = {
  "approve:pending_parent:parent": "with_teacher",
  "approve:rejected:parent": "with_teacher",
  "reject:pending_parent:parent": "rejected",
  "reject:with_teacher:parent": "rejected",
  "escalate:with_teacher:teacher": "escalated",
  "close:with_teacher:teacher": "closed",
  "close:escalated:teacher": "closed",
  "reopen:closed:parent": "with_teacher",
  "reopen:closed:teacher": "with_teacher",
  "reopen:rejected:parent": "pending_parent",
};

// A role that may never perform the action, whatever the state.
function neverAllowed(action: TransitionAction, role: AccountRole): boolean {
  if (role === "teacher") return action === "approve" || action === "reject";
  return action === "escalate" || action === "close";
}

interface Combination {
  key: string;
  action: TransitionAction;
  state: ReportState;
  role: AccountRole;
}

const COMBINATIONS: Combination[] = TRANSITION_ACTIONS.flatMap((action) =>
  REPORT_STATES.flatMap((state) =>
    ACCOUNT_ROLES.map((role) => ({ key: `${action}:${state}:${role}`, action, state, role })),
  ),
);

describe("resolveTransition", () => {
  it("covers 50 combinations of 5 actions x 5 states x 2 roles", () => {
    expect(COMBINATIONS).toHaveLength(50);
    expect(Object.keys(ALLOWED)).toHaveLength(10);
  });

  it.each(COMBINATIONS)("resolves $key", ({ key, action, state, role }) => {
    const result = resolveTransition(action, state, role);
    if (key in ALLOWED) {
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.rule.action).toBe(action);
        expect(result.rule.from).toContain(state);
        expect(result.rule.roles).toContain(role);
        expect(result.rule.to).toBe(ALLOWED[key]);
      }
    } else if (neverAllowed(action, role)) {
      expect(result).toEqual({ ok: false, code: "forbidden" });
    } else {
      expect(result).toEqual({ ok: false, code: "invalid_transition" });
    }
  });

  it("gives 10 ok, 20 forbidden and 20 invalid_transition results", () => {
    const tally = { ok: 0, forbidden: 0, invalid_transition: 0 };
    const okKeys: string[] = [];
    for (const { key, action, state, role } of COMBINATIONS) {
      const result = resolveTransition(action, state, role);
      if (result.ok) {
        tally.ok += 1;
        okKeys.push(key);
      } else {
        tally[result.code] += 1;
      }
    }
    expect(tally).toEqual({ ok: 10, forbidden: 20, invalid_transition: 20 });
    expect(okKeys.sort()).toEqual(Object.keys(ALLOWED).sort());
  });
});

describe("availableActions", () => {
  it.each([
    ["pending_parent", "parent", ["approve", "reject"]],
    ["rejected", "parent", ["approve", "reopen"]],
    ["with_teacher", "parent", ["reject"]],
    ["with_teacher", "teacher", ["escalate", "close"]],
    ["escalated", "teacher", ["close"]],
    ["escalated", "parent", []],
    ["closed", "parent", ["reopen"]],
    ["closed", "teacher", ["reopen"]],
    ["pending_parent", "teacher", []],
    ["rejected", "teacher", []],
  ] as const)("(%s, %s) -> %j", (state, role, expected) => {
    expect(availableActions(state, role)).toEqual(expected);
  });

  it("lists every action at most once, in TRANSITION_ACTIONS order", () => {
    for (const state of REPORT_STATES) {
      for (const role of ACCOUNT_ROLES) {
        const actions = availableActions(state, role);
        expect(new Set(actions).size).toBe(actions.length);
        const positions = actions.map((action) => TRANSITION_ACTIONS.indexOf(action));
        expect(positions).toEqual([...positions].sort((a, b) => a - b));
      }
    }
  });
});
