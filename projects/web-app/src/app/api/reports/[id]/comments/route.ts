// POST /api/reports/{id}/comments - adds a comment to the parent+teacher thread (D-11).
// Panel scope only: the extension token (the child's device) never reaches the thread. Both roles
// may comment on any report they can see; the author always comes from the verified session.
// Not idempotent (D-17): a retried POST may add the comment twice, so clients retry by hand.
// Check order (contract "Błędy"): 401, 403 scope, 413/400 body, 400 validation, 404, 503/500.

import { canView } from "@/lib/server/access";
import { requireSession } from "@/lib/server/auth";
import { apiError, handleRouteError, json, preflight, readJsonBody } from "@/lib/server/http";
import { addComment, getReport } from "@/lib/server/reports";
import { isUuid, parseComment } from "@/lib/server/validate";

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

    const parsed = parseComment(body.value);
    if (!parsed.ok) return apiError("validation_error", parsed.errors);

    const { id } = await ctx.params;
    if (!isUuid(id)) return apiError("report_not_found");

    const { account } = auth.session;
    const report = await getReport(id.toLowerCase());
    if (!report || !canView(account, report)) return apiError("report_not_found");

    const comment = await addComment({
      reportId: report.id,
      authorId: account.id,
      authorRole: account.role,
      body: parsed.value.body,
    });
    return json(comment, 201);
  } catch (err) {
    return handleRouteError(err);
  }
}
