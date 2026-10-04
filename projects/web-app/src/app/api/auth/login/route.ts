// POST /api/auth/login — demo login with e-mail + code 0000 (D-14, API-06).
// An unknown e-mail and a wrong code answer the same invalid_credentials body (no enumeration).
// Never logs the e-mail, the code or the token.

import { DEMO_LOGIN_CODE, findDemoAccountByEmail } from "@/lib/contract/demo-accounts";
import { issueToken, sessionInfo } from "@/lib/server/auth";
import { apiError, handleRouteError, json, preflight, readJsonBody } from "@/lib/server/http";
import { parseLogin } from "@/lib/server/validate";

export const dynamic = "force-dynamic";

export function OPTIONS(): Response {
  return preflight();
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await readJsonBody(request);
    if (!body.ok) return body.response;

    const parsed = parseLogin(body.value);
    if (!parsed.ok) return apiError("validation_error", parsed.errors);
    const { email, code, scope } = parsed.value;

    const account = findDemoAccountByEmail(email);
    if (!account || code !== DEMO_LOGIN_CODE) return apiError("invalid_credentials");
    if (scope === "extension" && account.role !== "parent") return apiError("forbidden");

    const { token, expiresAt } = issueToken(account, scope);
    return json({ token, ...sessionInfo({ account, scope, expiresAt }) });
  } catch (err) {
    return handleRouteError(err);
  }
}
