// POST /api/reports/{id}/transitions - moves a report through the workflow (D-08, D-09) and
// appends its history entry atomically (D-10). Panel scope only; the actor always comes from
// the verified session, never from the body.
// Check order (contract "Błędy"): 401, 403 scope, 413/400 body, 400 validation, 404 (malformed
// id or not visible), 403 role may never do this action, 409 not from this state, 503/500.

import { canView } from "@/lib/server/access";
import { resolveTransition } from "@/lib/contract/workflow";
import { requireSession } from "@/lib/server/auth";
import { apiError, handleRouteError, json, preflight, readJsonBody } from "@/lib/server/http";
import { getReport, transitionReport } from "@/lib/server/reports";
import { isUuid, parseTransition } from "@/lib/server/validate";

export const dynamic = "force-dynamic";

export function OPTIONS(): Response {
  return preflight();
}

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
  try {
    const auth = requireSession(request, { scopes: ["panel"] });
    if (!auth.ok) return auth.response;

    const body = await readJsonBody(request);
    if (!body.ok) return body.response;

    const parsed = parseTransition(body.value);
    if (!parsed.ok) return apiError("validation_error", parsed.errors);

    const { id } = await ctx.params;
    if (!isUuid(id)) return apiError("report_not_found");

    const { account } = auth.session;
    const report = await getReport(id.toLowerCase());
    if (!report || !canView(account, report)) return apiError("report_not_found");

    const decision = resolveTransition(parsed.value.action, report.state, account.role);
    if (!decision.ok) return apiError(decision.code);

    const result = await transitionReport({
      reportId: report.id,
      action: parsed.value.action,
      fromState: report.state,
      toState: decision.rule.to,
      actorId: account.id,
      actorRole: account.role,
      comment: parsed.value.comment,
    });
    // The state changed between the read and the write: the other request won (D-17).
    if (!result) return apiError("invalid_transition");

    return json(result, 201);
  } catch (err) {
    return handleRouteError(err);
  }
}
