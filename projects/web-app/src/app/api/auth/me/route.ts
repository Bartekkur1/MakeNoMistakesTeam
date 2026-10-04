// GET /api/auth/me — the current session for a valid bearer token (panel or extension scope).

import { requireSession, sessionInfo } from "@/lib/server/auth";
import { handleRouteError, json, preflight } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export function OPTIONS(): Response {
  return preflight();
}

export async function GET(request: Request): Promise<Response> {
  try {
    const result = requireSession(request);
    if (!result.ok) return result.response;
    return json(sessionInfo(result.session));
  } catch (err) {
    return handleRouteError(err);
  }
}
