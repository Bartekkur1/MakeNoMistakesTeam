// Visibility rules (D-11, D-15). A parent sees every report of their own child; a teacher sees
// the reports of children in their own classes, and only once a parent approved them
// (TEACHER_VISIBLE_STATES). Anything an account may not see answers 404 like a missing report.

import {
  TEACHER_VISIBLE_STATES,
  type AccountInfo,
  type ChildInfo,
  type Report,
  type ReportState,
} from "@/lib/contract/types";
import { demoChildOfParent, demoChildrenForAccount, teacherTeachesChild } from "@/lib/contract/demo-accounts";

type ReportAccess = Pick<Report, "parent_id" | "child_id" | "state">;

export function canView(account: AccountInfo, report: ReportAccess): boolean {
  if (account.role === "parent") {
    return report.parent_id === account.id;
  }
  if (account.role === "teacher") {
    return (
      teacherTeachesChild(account.id, report.child_id) &&
      (TEACHER_VISIBLE_STATES as readonly string[]).includes(report.state)
    );
  }
  return false;
}

// Reports are always filed for the logged-in parent's demo child (D-14). A parent account
// without a child is a configuration bug, never a client error: handleRouteError maps it to 500.
export function childForNewReport(account: AccountInfo): ChildInfo {
  const child = account.role === "parent" ? demoChildOfParent(account.id) : null;
  if (!child) {
    throw new Error("no demo child for this account");
  }
  return child;
}

// What GET /api/reports may return for an account (D-15). The same rule as canView, expressed as
// filters for public.list_reports. A scope always names a parent or a list of children; an empty
// scope is never "all reports" (listReports rejects it).
export interface ListScope {
  parentId: string | null;
  childIds: string[] | null;
  states: readonly ReportState[] | null;
}

export function listScopeFor(account: AccountInfo): ListScope {
  if (account.role === "parent") {
    return { parentId: account.id, childIds: null, states: null };
  }
  return {
    parentId: null,
    childIds: demoChildrenForAccount(account).map((child) => child.id),
    states: TEACHER_VISIBLE_STATES,
  };
}
