// /api/roblox-accounts — the Roblox nicks a parent linked to their children (panel scope only).
// GET lists them, POST links or relinks one. The Roblox game reports by nick to
// POST /api/reports/ingest, which files the result for the linked child.
// Check order: 401, 403, 413/400 body, 400 validation, 403 foreign child, then storage (503).

import { requireSession } from "@/lib/server/auth";
import { demoChildrenForAccount } from "@/lib/contract/demo-accounts";
import type { RobloxAccountListResponse } from "@/lib/contract/types";
import { apiError, handleRouteError, json, preflight, readJsonBody } from "@/lib/server/http";
import { listRobloxAccounts, setRobloxAccount } from "@/lib/server/roblox";
import { parseRobloxAccount } from "@/lib/server/validate";

export const dynamic = "force-dynamic";

export function OPTIONS(): Response {
  return preflight();
}

export async function GET(request: Request): Promise<Response> {
  try {
    const auth = requireSession(request, { scopes: ["panel"], roles: ["parent"] });
    if (!auth.ok) return auth.response;

    const childIds = demoChildrenForAccount(auth.session.account).map((child) => child.id);
    const accounts = await listRobloxAccounts(childIds);
    const response: RobloxAccountListResponse = { accounts };
    return json(response);
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const auth = requireSession(request, { scopes: ["panel"], roles: ["parent"] });
    if (!auth.ok) return auth.response;

    const body = await readJsonBody(request);
    if (!body.ok) return body.response;

    const parsed = parseRobloxAccount(body.value);
    if (!parsed.ok) return apiError("validation_error", parsed.errors);

    const { account } = auth.session;
    const { childId, robloxUsername } = parsed.value;
    if (!demoChildrenForAccount(account).some((child) => child.id === childId)) {
      return apiError("forbidden");
    }

    const saved = await setRobloxAccount({ childId, parentId: account.id, robloxUsername });
    if (saved === null) {
      return apiError("validation_error", [
        { field: "roblox_username", message: "Ten nick jest już przypisany do innego dziecka." },
      ]);
    }
    return json(saved);
  } catch (err) {
    return handleRouteError(err);
  }
}
