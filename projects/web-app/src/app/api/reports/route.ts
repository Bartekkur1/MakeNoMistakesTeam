// /api/reports — POST files a report, GET lists the visible reports page by page.
// Check order (contract "Błędy"): 401, 403, 413/400 body, 400 validation, then storage (503).

import { childForNewReport, listScopeFor } from "@/lib/server/access";
import { requireSession } from "@/lib/server/auth";
import { apiError, handleRouteError, json, preflight, readJsonBody } from "@/lib/server/http";
import { paginate } from "@/lib/server/pagination";
import { createReport, listReports } from "@/lib/server/reports";
import { parseListQuery, parseNewReport } from "@/lib/server/validate";

export const dynamic = "force-dynamic";

export function OPTIONS(): Response {
  return preflight();
}

// POST /api/reports — a parent files a report for their demo child (extension or panel scope).
export async function POST(request: Request): Promise<Response> {
  try {
    const auth = requireSession(request, { roles: ["parent"] });
    if (!auth.ok) return auth.response;

    const body = await readJsonBody(request);
    if (!body.ok) return body.response;

    const parsed = parseNewReport(body.value);
    if (!parsed.ok) return apiError("validation_error", parsed.errors);

    const { account } = auth.session;
    const child = childForNewReport(account);
    const report = await createReport({ ...parsed.value, parent_id: account.id, child_id: child.id });
    return json(report, 201);
  } catch (err) {
    return handleRouteError(err);
  }
}


// GET /api/reports — one page of the reports the account may see (D-15, D-16), both scopes and
// both roles. Query: ?limit= (1-100, default 20), ?cursor= (next_cursor), ?state=.
export async function GET(request: Request): Promise<Response> {
  try {
    const auth = requireSession(request);
    if (!auth.ok) return auth.response;

    const query = parseListQuery(new URL(request.url).searchParams);
    if (!query.ok) return apiError("validation_error", query.errors);

    const { limit, cursor, state } = query.value;
    const rows = await listReports({
      scope: listScopeFor(auth.session.account),
      state,
      cursor,
      fetchLimit: limit + 1,
    });
    const { page, nextCursor } = paginate(rows, limit);
    return json({ reports: page, next_cursor: nextCursor });
  } catch (err) {
    return handleRouteError(err);
  }
}
