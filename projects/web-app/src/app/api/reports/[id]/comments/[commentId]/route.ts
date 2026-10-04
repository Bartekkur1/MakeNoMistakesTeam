// DELETE /api/reports/{id}/comments/{commentId} - the author removes their own comment (D-11,
// amended 2026-10-04). Panel scope only, like the thread itself. Hard delete: the comment is gone
// for both the parent and the teacher. Idempotent: a comment that no longer exists answers 204 as
// well, so a retry after a lost response is safe. A comment written by someone else answers 403.
// Check order (contract "Błędy"): 401, 403 scope, 404 report, 403 author, 503/500.

import { canView } from "@/lib/server/access";
import { requireSession } from "@/lib/server/auth";
import { apiError, handleRouteError, noContent, preflight } from "@/lib/server/http";
import { deleteComment, getReport } from "@/lib/server/reports";
import { isUuid } from "@/lib/server/validate";

export const dynamic = "force-dynamic";

export function OPTIONS(): Response {
  return preflight();
}

export async function DELETE(
  request: Request,
  ctx: { params: Promise<{ id: string; commentId: string }> },
): Promise<Response> {
  try {
    const auth = requireSession(request, { scopes: ["panel"] });
    if (!auth.ok) return auth.response;

    const { id, commentId } = await ctx.params;
    if (!isUuid(id)) return apiError("report_not_found");

    const { account } = auth.session;
    const report = await getReport(id.toLowerCase());
    if (!report || !canView(account, report)) return apiError("report_not_found");

    // A malformed comment id names no comment of this report.
    if (!isUuid(commentId)) return noContent();

    const outcome = await deleteComment({
      reportId: report.id,
      commentId: commentId.toLowerCase(),
      authorId: account.id,
    });
    if (outcome === "not_author") return apiError("forbidden");
    return noContent();
  } catch (err) {
    return handleRouteError(err);
  }
}
