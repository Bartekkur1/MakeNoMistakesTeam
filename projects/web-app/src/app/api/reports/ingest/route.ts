// POST /api/reports/ingest — the Roblox game server files a training result straight into the
// parent's inbox (state pending_parent), authenticated by the shared x-ingest-secret header
// instead of a parent login. The child is found by the Roblox nick the parent linked in the panel
// (POST /api/roblox-accounts); an unlinked nick goes to the demo fallback child (Ola).
//
// This endpoint answers in the envelope agreed with the Roblox workstream ({ ok, ... }), not the
// panel's { error: { code } } envelope. Check order: 500 not configured, 401 secret, 413/400 body,
// 400 validation, then storage (503).

import { DEMO_CHILDREN, findDemoAccountById } from "@/lib/contract/demo-accounts";
import {
  type FieldError,
  type RobloxIngestErrorBody,
  type RobloxIngestResponse,
} from "@/lib/contract/types";
import { handleRouteError, json, readJsonBody } from "@/lib/server/http";
import { createReport } from "@/lib/server/reports";
import {
  findChildIdByRobloxUsername,
  getIngestSecret,
  ingestContent,
  ingestSecretMatches,
  ROBLOX_FALLBACK_CHILD_ID,
} from "@/lib/server/roblox";
import { parseRobloxIngest } from "@/lib/server/validate";

export const dynamic = "force-dynamic";

function ingestError(error: string, status: number, details?: FieldError[]): Response {
  const body: RobloxIngestErrorBody = { ok: false, error };
  if (details && details.length > 0) body.details = details;
  return json(body, status);
}

export async function POST(request: Request): Promise<Response> {
  try {
    const secret = getIngestSecret();
    if (secret === null) {
      console.error("[api] ingest_not_configured");
      return ingestError("ingest_not_configured", 500);
    }
    if (!ingestSecretMatches(request.headers.get("x-ingest-secret"), secret)) {
      return ingestError("invalid_ingest_secret", 401);
    }

    const body = await readJsonBody(request);
    if (!body.ok) {
      const status = body.response.status;
      return ingestError(status === 413 ? "payload_too_large" : "invalid_json", status);
    }

    const parsed = parseRobloxIngest(body.value);
    if (!parsed.ok) return ingestError("validation_error", 400, parsed.errors);
    const input = parsed.value;

    const linkedChildId = await findChildIdByRobloxUsername(input.robloxUsername);
    const child =
      DEMO_CHILDREN.find((c) => c.id === linkedChildId) ?? DEMO_CHILDREN.find((c) => c.id === ROBLOX_FALLBACK_CHILD_ID);
    const parent = child ? findDemoAccountById(child.parent_id) : null;
    if (!child || !parent) {
      // A configuration bug (the fallback child or its parent is missing), never a client error.
      throw new Error("no demo child for roblox ingest");
    }

    const report = await createReport({
      parent_id: parent.id,
      child_id: child.id,
      attack_type: input.attackType,
      taken_actions: input.takenActions,
      source: "game",
      content: ingestContent(input),
    });

    const response: RobloxIngestResponse = {
      ok: true,
      report_id: report.id,
      child_name: child.display_name,
      parent_name: parent.display_name,
      state: report.state,
      matched: linkedChildId !== null && child.id === linkedChildId,
    };
    return json(response, 201);
  } catch (err) {
    const fallback = handleRouteError(err);
    return ingestError(fallback.status === 503 ? "storage_unavailable" : "internal_error", fallback.status);
  }
}
