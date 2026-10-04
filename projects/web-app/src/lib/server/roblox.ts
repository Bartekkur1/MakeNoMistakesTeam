// Roblox nicks of demo children (table public.child_roblox_accounts) and the shared secret of the
// Roblox ingest endpoint. Same rules as reports.ts: every call goes through getSupabase(), and a
// storage error, a thrown call or a row that does not match the contract becomes
// StorageUnavailableError (503), never a 2xx.

import { createHash, timingSafeEqual } from "node:crypto";
import { ROBLOX_ACCOUNT_FIELDS, ROBLOX_MAX_SCORE, REPORT_STATES, type RobloxAccount, type RobloxIngestResponse } from "@/lib/contract/types";
import { StorageUnavailableError } from "./errors";
import { toIsoUtc } from "./reports";
import { getSupabase } from "./supabase";
import { isUuid, type RobloxIngestInput } from "./validate";

const ROBLOX_ACCOUNT_COLUMNS = ROBLOX_ACCOUNT_FIELDS.join(",");

function shapeError(): StorageUnavailableError {
  return new StorageUnavailableError("unexpected row shape");
}

function mapRobloxAccount(value: unknown): RobloxAccount {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw shapeError();
  const row = value as Record<string, unknown>;
  if (typeof row.child_id !== "string" || typeof row.roblox_username !== "string") throw shapeError();
  return { child_id: row.child_id, roblox_username: row.roblox_username, updated_at: toIsoUtc(row.updated_at) };
}

interface StorageResult {
  data: unknown;
  error: unknown;
}

async function run(label: string, call: () => PromiseLike<StorageResult>): Promise<unknown> {
  let result: StorageResult;
  try {
    result = await call();
  } catch (err) {
    throw new StorageUnavailableError(`${label} threw`, { cause: err });
  }
  if (result.error) {
    throw new StorageUnavailableError(`${label} failed`, { cause: result.error });
  }
  return result.data;
}

// The linked nicks of the given children, in no particular order.
export async function listRobloxAccounts(childIds: readonly string[]): Promise<RobloxAccount[]> {
  if (childIds.length === 0) return [];
  const data = await run("list_roblox_accounts", () =>
    getSupabase().from("child_roblox_accounts").select(ROBLOX_ACCOUNT_COLUMNS).in("child_id", [...childIds]),
  );
  if (!Array.isArray(data)) throw shapeError();
  return data.map(mapRobloxAccount);
}

export interface SetRobloxAccountInput {
  childId: string;
  parentId: string;
  robloxUsername: string;
}

// Links the nick to the child (replacing the previous one). null when the nick already belongs to
// another child.
export async function setRobloxAccount(input: SetRobloxAccountInput): Promise<RobloxAccount | null> {
  const data = await run("set_child_roblox_account", () =>
    getSupabase().rpc("set_child_roblox_account", {
      p_child_id: input.childId,
      p_parent_id: input.parentId,
      p_roblox_username: input.robloxUsername,
    }),
  );
  if (data === null || data === undefined) return null;
  return mapRobloxAccount(data);
}

// The child the nick is linked to, or null. Case-insensitive, like Roblox itself.
export async function findChildIdByRobloxUsername(username: string): Promise<string | null> {
  const data = await run("find_roblox_account", () =>
    getSupabase()
      .from("child_roblox_accounts")
      .select("child_id")
      .eq("roblox_username_key", username.toLowerCase())
      .maybeSingle(),
  );
  if (data === null || data === undefined) return null;
  if (typeof data !== "object" || typeof (data as Record<string, unknown>).child_id !== "string") throw shapeError();
  return (data as { child_id: string }).child_id;
}

// ---------------------------------------------------------------------------
// Ingest secret
// ---------------------------------------------------------------------------

const MIN_INGEST_SECRET_CHARS = 16;

// ROBLOX_INGEST_SECRET (server env only, never logged). null when missing or too short: the
// endpoint then fails closed instead of accepting a guessable default.
export function getIngestSecret(): string | null {
  const secret = process.env.ROBLOX_INGEST_SECRET;
  if (typeof secret !== "string" || secret.trim().length < MIN_INGEST_SECRET_CHARS) return null;
  return secret.trim();
}

// Constant-time comparison; both sides are hashed first so their lengths always match.
export function ingestSecretMatches(given: string | null, expected: string): boolean {
  if (given === null) return false;
  const a = createHash("sha256").update(given, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}

// ---------------------------------------------------------------------------
// Ingest report
// ---------------------------------------------------------------------------

// Ola (demo): receives results from nicks no parent has linked yet.
export const ROBLOX_FALLBACK_CHILD_ID = "00000000-0000-4000-8000-0000000c0001";

// The header line the parent sees above the game's own summary.
export function ingestContent(input: RobloxIngestInput): string {
  const parts = [`Ćwiczenie Roblox, gracz ${input.robloxUsername}.`];
  if (input.outcome === "safe_refusal") parts.push("Wynik ćwiczenia: bezpieczna odmowa.");
  if (input.outcome === "compromised_password") parts.push("Wynik ćwiczenia: fikcyjne przekazanie hasła (bez rzeczywistego wycieku).");
  if (input.score !== null) parts.push(`Wynik szkolenia: ${input.score}/${ROBLOX_MAX_SCORE} pkt.`);
  if (input.hintsUsed !== null) parts.push(`Użyte wskazówki: ${input.hintsUsed}.`);
  return `${parts.join(" ")}\n\n${input.content}`;
}

export type RobloxIngestAck = Omit<RobloxIngestResponse, "ok">;

export class RobloxIngestIdempotencyConflictError extends Error {
  constructor() {
    super("idempotency_conflict");
    this.name = "RobloxIngestIdempotencyConflictError";
  }
}

// Fixed field order, normalized values only; recipient mappings and unknown JSON keys are
// deliberately excluded so linking a nick later cannot rewrite a completed attempt's ack.
function requestFingerprint(input: RobloxIngestInput): string {
  return createHash("sha256").update(JSON.stringify([
    input.robloxUsername, input.robloxUserId, input.attackType, "game", input.takenActions,
    input.content, input.hintsUsed, input.score, input.outcome,
  ]), "utf8").digest("hex");
}

export async function createRobloxIngestReport(
  input: RobloxIngestInput,
  recipient: { childId: string; parentId: string; childName: string; parentName: string; matched: boolean },
): Promise<{ created: boolean; ack: RobloxIngestAck }> {
  const data = await run("create_roblox_ingest_report", () => getSupabase().rpc("create_roblox_ingest_report", {
    p_attempt_id: input.attemptId,
    p_request_fingerprint: requestFingerprint(input),
    p_parent_id: recipient.parentId,
    p_child_id: recipient.childId,
    p_attack_type: input.attackType,
    p_taken_actions: input.takenActions,
    p_content: ingestContent(input),
    p_child_name: recipient.childName,
    p_parent_name: recipient.parentName,
    p_matched: recipient.matched,
  }));
  if (data === null || typeof data !== "object" || Array.isArray(data)) throw shapeError();
  const row = data as Record<string, unknown>;
  if (row.result === "conflict") {
    if (Object.keys(row).length !== 1) throw shapeError();
    throw new RobloxIngestIdempotencyConflictError();
  }
  if ((row.result !== "created" && row.result !== "replayed") || !isUuid(row.report_id) ||
    typeof row.child_name !== "string" || !row.child_name.trim() ||
    typeof row.parent_name !== "string" || !row.parent_name.trim() ||
    typeof row.state !== "string" || !(REPORT_STATES as readonly string[]).includes(row.state) ||
    typeof row.matched !== "boolean") throw shapeError();
  return {
    created: row.result === "created",
    ack: {
      report_id: row.report_id,
      child_name: row.child_name,
      parent_name: row.parent_name,
      state: row.state as RobloxIngestAck["state"],
      matched: row.matched,
    },
  };
}
