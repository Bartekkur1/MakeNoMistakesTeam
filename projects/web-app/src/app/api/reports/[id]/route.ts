// GET /api/reports/{id} — one report with its history and comments, panel scope only (D-11):
// the extension token (the child's device) never receives history or comments.
// A malformed id, an unknown id and a report the account may not see all answer 404 (D-15).

import { canView } from "@/lib/server/access";
import { requireSession } from "@/lib/server/auth";
import { apiError, handleRouteError, json, preflight } from "@/lib/server/http";
import { getReport, getReportTimeline } from "@/lib/server/reports";
import { isUuid } from "@/lib/server/validate";

export const dynamic = "force-dynamic";

export function OPTIONS(): Response {
  return preflight();
}

export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
  try {
    const auth = requireSession(request, { scopes: ["panel"] });
    if (!auth.ok) return auth.response;

    const { id } = await ctx.params;
    if (!isUuid(id)) return apiError("report_not_found");

    const report = await getReport(id.toLowerCase());
    if (!report || !canView(auth.session.account, report)) return apiError("report_not_found");

    const { history, comments } = await getReportTimeline(report.id);
    return json({ ...report, history, comments });
  } catch (err) {
    return handleRouteError(err);
  }
}
