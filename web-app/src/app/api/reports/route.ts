// POST /api/reports — a parent files a report for their demo child (extension or panel scope).
// Check order (contract "Błędy"): 401, 403, 413/400 body, 400 validation, then storage (503).

import { childForNewReport } from "@/lib/server/access";
import { requireSession } from "@/lib/server/auth";
import { apiError, handleRouteError, json, preflight, readJsonBody } from "@/lib/server/http";
import { createReport } from "@/lib/server/reports";
import { parseNewReport } from "@/lib/server/validate";

export const dynamic = "force-dynamic";

export function OPTIONS(): Response {
  return preflight();
}

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
