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
import {
  createRobloxIngestReport,
  findChildIdByRobloxUsername,
  getIngestSecret,
  ingestSecretMatches,
  ROBLOX_FALLBACK_CHILD_ID,
  RobloxIngestIdempotencyConflictError,
} from "@/lib/server/roblox";
import { parseRobloxIngest } from "@/lib/server/validate";

export const dynamic = "force-dynamic";

// One log line per request so a failing game call can be traced from the server logs. Never logs the
// secret, the Roblox nick or the message content: only ids, enums and error codes.
type IngestLogFields = Record<string, string | number | boolean | null | string[]>;

function logIngest(level: "info" | "warn" | "error", event: string, fields: IngestLogFields): void {
  console[level](`[api] ingest_${event}`, fields);
}

function errorCode(err: unknown): string | null {
  const cause: unknown = err instanceof Error ? err.cause : null;
  if (cause !== null && typeof cause === "object" && "code" in cause && typeof cause.code === "string") return cause.code;
  return null;
}

function ingestError(error: string, status: number, details?: FieldError[]): Response {
  const body: RobloxIngestErrorBody = { ok: false, error };
  if (details && details.length > 0) body.details = details;
  return json(body, status);
}

export async function POST(request: Request): Promise<Response> {
  const startedAt = Date.now();
  const ms = () => Date.now() - startedAt;
  let attemptId: string | null = null;
  try {
    const secret = getIngestSecret();
    if (secret === null) {
      logIngest("error", "not_configured", { status: 500 });
      return ingestError("ingest_not_configured", 500);
    }
    const sentSecret = request.headers.get("x-ingest-secret");
    if (!ingestSecretMatches(sentSecret, secret)) {
      logIngest("warn", "rejected", {
        status: 401,
        error: "invalid_ingest_secret",
        reason: sentSecret === null ? "header_missing" : "secret_mismatch",
      });
      return ingestError("invalid_ingest_secret", 401);
    }

    const body = await readJsonBody(request);
    if (!body.ok) {
      const status = body.response.status;
      const error = status === 413 ? "payload_too_large" : "invalid_json";
      logIngest("warn", "rejected", { status, error });
      return ingestError(error, status);
    }

    const parsed = parseRobloxIngest(body.value);
    if (!parsed.ok) {
      logIngest("warn", "rejected", {
        status: 400,
        error: "validation_error",
        fields: parsed.errors.map((e) => e.field),
        attempt_id: typeof body.value.attempt_id === "string" ? body.value.attempt_id : null,
      });
      return ingestError("validation_error", 400, parsed.errors);
    }
    const input = parsed.value;
    attemptId = input.attemptId;

    const linkedChildId = await findChildIdByRobloxUsername(input.robloxUsername);
    const child =
      DEMO_CHILDREN.find((c) => c.id === linkedChildId) ?? DEMO_CHILDREN.find((c) => c.id === ROBLOX_FALLBACK_CHILD_ID);
    const parent = child ? findDemoAccountById(child.parent_id) : null;
    if (!child || !parent) {
      // A configuration bug (the fallback child or its parent is missing), never a client error.
      throw new Error("no demo child for roblox ingest");
    }

    const result = await createRobloxIngestReport(input, {
      parentId: parent.id,
      childId: child.id,
      childName: child.display_name,
      parentName: parent.display_name,
      matched: linkedChildId !== null && child.id === linkedChildId,
    });

    const response: RobloxIngestResponse = {
      ok: true,
      ...result.ack,
    };
    const status = result.created ? 201 : 200;
    logIngest("info", "ok", {
      status,
      attempt_id: input.attemptId,
      report_id: result.ack.report_id,
      created: result.created,
      already_completed: result.ack.already_completed === true,
      matched: result.ack.matched,
      child_id: child.id,
      training_id: input.trainingId,
      attack_type: input.attackType,
      outcome: input.outcome,
      ms: ms(),
    });
    return json(response, status);
  } catch (err) {
    if (err instanceof RobloxIngestIdempotencyConflictError) {
      logIngest("warn", "rejected", { status: 409, error: "idempotency_conflict", attempt_id: attemptId, ms: ms() });
      return ingestError("idempotency_conflict", 409);
    }
    const fallback = handleRouteError(err);
    const error = fallback.status === 503 ? "storage_unavailable" : "internal_error";
    logIngest("error", "failed", {
      status: fallback.status,
      error,
      attempt_id: attemptId,
      error_name: err instanceof Error ? err.name : typeof err,
      error_message: err instanceof Error ? err.message : null,
      db_code: errorCode(err),
      ms: ms(),
    });
    return ingestError(error, fallback.status);
  }
}
