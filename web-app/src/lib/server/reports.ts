// All report data access (D-02, D-05). Every call goes through getSupabase(); the SDK itself is
// imported only in supabase.ts. Writes go through the Postgres functions in
// web-app/supabase/migrations, so a report and its history entry are stored together or not at all.
//
// No false confirmations (widget ERR-01): a storage error, a thrown call, a missing row or a row
// that does not match the contract becomes StorageUnavailableError (503), never a 2xx.

import {
  ACCOUNT_ROLES,
  ACTOR_ROLES,
  ATTACK_TYPES,
  COMMENT_FIELDS,
  HISTORY_ACTIONS,
  HISTORY_FIELDS,
  REPORT_FIELDS,
  REPORT_SOURCES,
  REPORT_STATES,
  TAKEN_ACTIONS,
  type AccountRole,
  type ActorRole,
  type AttackType,
  type HistoryAction,
  type HistoryEntry,
  type NewReportInput,
  type Report,
  type ReportComment,
  type ReportSource,
  type ReportState,
  type TakenAction,
  type TransitionAction,
  type TransitionResponse,
} from "@/lib/contract/types";
import type { ListScope } from "./access";
import { StorageUnavailableError } from "./errors";
import type { CursorPosition } from "./pagination";
import { getSupabase } from "./supabase";

export const REPORT_COLUMNS = REPORT_FIELDS.join(",");
export const HISTORY_COLUMNS = HISTORY_FIELDS.join(",");
export const COMMENT_COLUMNS = COMMENT_FIELDS.join(",");

// ---------------------------------------------------------------------------
// Row mapping
// ---------------------------------------------------------------------------

type DbRow = Record<string, unknown>;

function shapeError(): StorageUnavailableError {
  return new StorageUnavailableError("unexpected row shape");
}

function asRow(value: unknown): DbRow {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw shapeError();
  return value as DbRow;
}

function text(row: DbRow, field: string): string {
  const value = row[field];
  if (typeof value !== "string") throw shapeError();
  return value;
}

function nullableText(row: DbRow, field: string): string | null {
  const value = row[field];
  if (value === null) return null;
  if (typeof value !== "string") throw shapeError();
  return value;
}

function oneOf<T extends string>(row: DbRow, field: string, values: readonly T[]): T {
  const value = row[field];
  if (typeof value !== "string" || !(values as readonly string[]).includes(value)) throw shapeError();
  return value as T;
}

function nullableOneOf<T extends string>(row: DbRow, field: string, values: readonly T[]): T | null {
  if (row[field] === null) return null;
  return oneOf(row, field, values);
}

// PostgREST returns timestamptz as "2026-10-03T08:40:00+00:00"; the contract wants
// "2026-10-03T08:40:00.000Z".
export function toIsoUtc(value: unknown): string {
  if (typeof value !== "string" && !(value instanceof Date)) throw shapeError();
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw shapeError();
  return date.toISOString();
}

function timestamp(row: DbRow, field: string): string {
  if (!(field in row)) throw shapeError();
  return toIsoUtc(row[field]);
}

function takenActions(row: DbRow): TakenAction[] {
  const value = row.taken_actions;
  if (!Array.isArray(value)) throw shapeError();
  const actions = value.map((action: unknown) => {
    if (typeof action !== "string" || !(TAKEN_ACTIONS as readonly string[]).includes(action)) throw shapeError();
    return action as TakenAction;
  });
  return actions.sort((a, b) => TAKEN_ACTIONS.indexOf(a) - TAKEN_ACTIONS.indexOf(b));
}

// Exactly the contract fields, in REPORT_FIELDS order.
export function mapReport(value: unknown): Report {
  const row = asRow(value);
  return {
    id: text(row, "id"),
    child_id: text(row, "child_id"),
    parent_id: text(row, "parent_id"),
    attack_type: oneOf<AttackType>(row, "attack_type", ATTACK_TYPES),
    taken_actions: takenActions(row),
    source: oneOf<ReportSource>(row, "source", REPORT_SOURCES),
    content: text(row, "content"),
    state: oneOf<ReportState>(row, "state", REPORT_STATES),
    created_at: timestamp(row, "created_at"),
    updated_at: timestamp(row, "updated_at"),
  };
}

// Exactly the contract fields, in HISTORY_FIELDS order (seq is never exposed).
export function mapHistoryEntry(value: unknown): HistoryEntry {
  const row = asRow(value);
  if (!("from_state" in row) || !("comment" in row)) throw shapeError();
  return {
    id: text(row, "id"),
    report_id: text(row, "report_id"),
    action: oneOf<HistoryAction>(row, "action", HISTORY_ACTIONS),
    from_state: nullableOneOf<ReportState>(row, "from_state", REPORT_STATES),
    to_state: oneOf<ReportState>(row, "to_state", REPORT_STATES),
    actor_id: text(row, "actor_id"),
    actor_role: oneOf<ActorRole>(row, "actor_role", ACTOR_ROLES),
    comment: nullableText(row, "comment"),
    created_at: timestamp(row, "created_at"),
  };
}

// Exactly the contract fields, in COMMENT_FIELDS order (seq is never exposed).
export function mapComment(value: unknown): ReportComment {
  const row = asRow(value);
  return {
    id: text(row, "id"),
    report_id: text(row, "report_id"),
    author_id: text(row, "author_id"),
    author_role: oneOf<AccountRole>(row, "author_role", ACCOUNT_ROLES),
    body: text(row, "body"),
    created_at: timestamp(row, "created_at"),
  };
}

function mapList<T>(data: unknown, mapper: (value: unknown) => T): T[] {
  if (!Array.isArray(data)) throw shapeError();
  return data.map(mapper);
}

// ---------------------------------------------------------------------------
// Storage calls
// ---------------------------------------------------------------------------

interface StorageResult {
  data: unknown;
  error: unknown;
}

// Awaits one supabase-js call. A thrown call or a returned error becomes StorageUnavailableError;
// the cause keeps only the storage error object (http.ts logs nothing but its code).
async function run(label: string, call: () => PromiseLike<StorageResult>): Promise<unknown> {
  let result: StorageResult;
  try {
    result = await call();
  } catch (err) {
    if (err instanceof StorageUnavailableError) throw err;
    throw new StorageUnavailableError(`${label} threw`, { cause: err });
  }
  if (result.error) {
    throw new StorageUnavailableError(`${label} failed`, { cause: result.error });
  }
  return result.data;
}

export interface CreateReportInput extends NewReportInput {
  parent_id: string;
  child_id: string;
}

// public.create_report stores the report and its "submit" history entry in one transaction.
// Only the row Supabase returned is ever confirmed to the client.
export async function createReport(input: CreateReportInput): Promise<Report> {
  const data = await run("create_report", () =>
    getSupabase().rpc("create_report", {
      p_parent_id: input.parent_id,
      p_child_id: input.child_id,
      p_attack_type: input.attack_type,
      p_taken_actions: input.taken_actions,
      p_source: input.source,
      p_content: input.content,
    }),
  );
  if (data === null || data === undefined) {
    throw new StorageUnavailableError("create_report returned no row");
  }
  return mapReport(data);
}

export async function getReport(id: string): Promise<Report | null> {
  const data = await run("get_report", () =>
    getSupabase().from("reports").select(REPORT_COLUMNS).eq("id", id).maybeSingle(),
  );
  if (data === null || data === undefined) return null;
  return mapReport(data);
}

export interface ReportTimeline {
  history: HistoryEntry[];
  comments: ReportComment[];
}

// History and comments of one report, oldest first (seq order).
export async function getReportTimeline(id: string): Promise<ReportTimeline> {
  const [historyData, commentData] = await Promise.all([
    run("get_history", () =>
      getSupabase()
        .from("report_history")
        .select(HISTORY_COLUMNS)
        .eq("report_id", id)
        .order("seq", { ascending: true }),
    ),
    run("get_comments", () =>
      getSupabase()
        .from("report_comments")
        .select(COMMENT_COLUMNS)
        .eq("report_id", id)
        .order("seq", { ascending: true }),
    ),
  ]);
  return {
    history: mapList(historyData, mapHistoryEntry),
    comments: mapList(commentData, mapComment),
  };
}

export interface ListReportsInput {
  scope: ListScope;
  state: ReportState | null;
  cursor: CursorPosition | null;
  // The page size + 1, so paginate() can tell whether another page exists.
  fetchLimit: number;
}

// One page of visible reports, newest first (created_at desc, id desc), via public.list_reports.
export async function listReports({ scope, state, cursor, fetchLimit }: ListReportsInput): Promise<Report[]> {
  if (scope.parentId === null && scope.childIds === null) {
    // A programming error, never "all reports" (T-01-26).
    throw new Error("list scope required");
  }
  if (scope.childIds !== null && scope.childIds.length === 0) return [];

  const data = await run("list_reports", () =>
    getSupabase().rpc("list_reports", {
      p_parent_id: scope.parentId,
      p_child_ids: scope.childIds,
      p_states: scope.states === null ? null : [...scope.states],
      p_state: state,
      p_cursor_created_at: cursor === null ? null : cursor.createdAt,
      p_cursor_id: cursor === null ? null : cursor.id,
      p_limit: fetchLimit,
    }),
  );
  return mapList(data, mapReport);
}

export interface TransitionReportInput {
  reportId: string;
  action: TransitionAction;
  fromState: ReportState;
  toState: ReportState;
  actorId: string;
  actorRole: AccountRole;
  comment: string | null;
}

// RED skeleton (plan 01-05 Task 1): not implemented yet.
export async function transitionReport(_input: TransitionReportInput): Promise<TransitionResponse | null> {
  throw new Error("not implemented");
}
