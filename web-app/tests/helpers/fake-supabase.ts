// In-memory fake of the supabase-js subset this phase uses. Tests replace createClient with
// a function returning `fakeSupabase.client` (vi.mock), so no test ever reaches a real
// Supabase project (D-06). Plans 01-04 and 01-05 extend this helper.
//
// Semantics follow PostgREST: every awaited query resolves { data, error } and never throws
// unless throwNext() was armed; single() on anything but exactly one row gives PGRST116;
// maybeSingle() on zero rows gives data null; an unknown rpc gives PGRST202.
//
// report_history and report_comments carry a `seq` counter like the SQL identity column
// (canonical order, never exposed by the API). The fake RPCs at the bottom mirror the
// Postgres functions in web-app/supabase/migrations.

import {
  ATTACK_TYPES,
  LIMITS,
  REPORT_SOURCES,
  TAKEN_ACTIONS,
  TRANSITIONS,
  TRANSITION_COMMENT_REQUIRED,
  type TransitionAction,
} from "@/lib/contract/types";

export type TableName = "reports" | "report_history" | "report_comments";
export type Row = Record<string, unknown>;

export interface FakeError {
  code?: string;
  message: string;
  details?: string | null;
  hint?: string | null;
}

export interface FakeResult {
  data: unknown;
  error: FakeError | null;
}

export interface FakeOp {
  method: string;
  args: unknown[];
}

export interface FakeCall {
  kind: "from" | "rpc";
  name: string;
  args: unknown;
  ops: FakeOp[];
}

export type RpcHandler = (args: Record<string, unknown>, fake: FakeSupabase) => FakeResult;
export type BeforeCallCallback = (fake: FakeSupabase) => void;

const TABLE_NAMES: readonly TableName[] = ["reports", "report_history", "report_comments"];

// Tables with a `seq bigint generated always as identity` column.
type SeqTable = "report_history" | "report_comments";
const SEQ_TABLES: readonly SeqTable[] = ["report_history", "report_comments"];

function isSeqTable(table: TableName): table is SeqTable {
  return (SEQ_TABLES as readonly string[]).includes(table);
}

// Columns the database fills when an insert leaves them out.
const TIMESTAMP_DEFAULTS: Record<TableName, readonly string[]> = {
  reports: ["created_at", "updated_at"],
  report_history: ["created_at"],
  report_comments: ["created_at"],
};

const DEFAULT_CLOCK = "2026-10-03T12:00:00.000Z";
const CONTRACT_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;

// "2026-10-03T08:40:00.000Z" -> "2026-10-03T08:40:00+00:00" (milliseconds kept when non-zero),
// which is how PostgREST returns timestamptz columns.
export function toPostgrestTimestamp(iso: string): string {
  const date = new Date(iso);
  const base = date.toISOString();
  const ms = date.getUTCMilliseconds();
  const head = base.slice(0, 19);
  return ms === 0 ? `${head}+00:00` : `${head}.${base.slice(20, 23)}+00:00`;
}

function storeValue(value: unknown): unknown {
  if (typeof value === "string" && CONTRACT_TIMESTAMP.test(value)) {
    return toPostgrestTimestamp(value);
  }
  return value;
}

function storeRow(row: Row): Row {
  const out: Row = {};
  for (const [key, value] of Object.entries(row)) {
    out[key] = storeValue(value);
  }
  return out;
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function project(row: Row, columns: string | undefined): Row {
  if (columns === undefined) return clone(row);
  const trimmed = columns.trim();
  if (trimmed === "" || trimmed === "*" || trimmed.includes("(")) return clone(row);
  const out: Row = {};
  for (const raw of trimmed.split(",")) {
    const column = raw.trim();
    if (column !== "" && column in row) out[column] = clone(row[column]);
  }
  return out;
}

function compare(a: unknown, b: unknown): number {
  if (a === b) return 0;
  if (a === null || a === undefined) return 1;
  if (b === null || b === undefined) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a) < String(b) ? -1 : 1;
}

function pgrst116(count: number): FakeError {
  return {
    code: "PGRST116",
    message: "JSON object requested, multiple (or no) rows returned",
    details: `The result contains ${count} rows`,
    hint: null,
  };
}

type Mode = "select" | "insert";
type Cardinality = "many" | "single" | "maybeSingle";

export class FakeQueryBuilder implements PromiseLike<FakeResult> {
  private mode: Mode = "select";
  private columns: string | undefined = undefined;
  private returning = false;
  private pendingRows: Row[] = [];
  private readonly filters: Array<(row: Row) => boolean> = [];
  private readonly orders: Array<{ column: string; ascending: boolean }> = [];
  private limitCount: number | null = null;
  private cardinality: Cardinality = "many";
  private readonly ops: FakeOp[] = [];

  constructor(
    private readonly fake: FakeSupabase,
    private readonly table: string,
  ) {}

  select(columns?: string): this {
    this.ops.push({ method: "select", args: columns === undefined ? [] : [columns] });
    this.columns = columns;
    if (this.mode === "insert") this.returning = true;
    return this;
  }

  insert(rows: Row | Row[]): this {
    this.ops.push({ method: "insert", args: [clone(rows)] });
    this.mode = "insert";
    this.pendingRows = Array.isArray(rows) ? rows.map((r) => clone(r)) : [clone(rows)];
    return this;
  }

  eq(column: string, value: unknown): this {
    this.ops.push({ method: "eq", args: [column, value] });
    const wanted = storeValue(value);
    this.filters.push((row) => row[column] === wanted);
    return this;
  }

  in(column: string, values: readonly unknown[]): this {
    this.ops.push({ method: "in", args: [column, [...values]] });
    const wanted = values.map(storeValue);
    this.filters.push((row) => wanted.includes(row[column]));
    return this;
  }

  order(column: string, options: { ascending?: boolean } = {}): this {
    const ascending = options.ascending ?? true;
    this.ops.push({ method: "order", args: [column, { ascending }] });
    this.orders.push({ column, ascending });
    return this;
  }

  limit(count: number): this {
    this.ops.push({ method: "limit", args: [count] });
    this.limitCount = count;
    return this;
  }

  single(): this {
    this.ops.push({ method: "single", args: [] });
    this.cardinality = "single";
    return this;
  }

  maybeSingle(): this {
    this.ops.push({ method: "maybeSingle", args: [] });
    this.cardinality = "maybeSingle";
    return this;
  }

  then<TResult1 = FakeResult, TResult2 = never>(
    onfulfilled?: ((value: FakeResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  private async execute(): Promise<FakeResult> {
    if (this.mode === "insert") this.fake.runBeforeInsert();
    const injected = this.fake.beginCall({ kind: "from", name: this.table, args: null, ops: this.ops });
    if (injected) return injected;

    const rows = this.fake.tableRows(this.table);
    if (!rows) {
      return {
        data: null,
        error: { code: "42P01", message: `relation "public.${this.table}" does not exist` },
      };
    }

    let result: Row[];
    if (this.mode === "insert") {
      const violation = this.fake.foreignKeyViolation(this.table as TableName, this.pendingRows);
      if (violation) return { data: null, error: violation };
      const inserted = this.pendingRows.map((row) => this.fake.prepareInsert(this.table as TableName, row));
      rows.push(...inserted);
      if (!this.returning) return { data: null, error: null };
      result = inserted;
    } else {
      result = rows.filter((row) => this.filters.every((f) => f(row)));
      if (this.orders.length > 0) {
        result = [...result].sort((a, b) => {
          for (const { column, ascending } of this.orders) {
            const c = compare(a[column], b[column]);
            if (c !== 0) return ascending ? c : -c;
          }
          return 0;
        });
      }
      if (this.limitCount !== null) result = result.slice(0, this.limitCount);
    }

    const projected = result.map((row) => project(row, this.columns));
    if (this.cardinality === "single") {
      if (projected.length !== 1) return { data: null, error: pgrst116(projected.length) };
      return { data: projected[0], error: null };
    }
    if (this.cardinality === "maybeSingle") {
      if (projected.length === 0) return { data: null, error: null };
      if (projected.length > 1) return { data: null, error: pgrst116(projected.length) };
      return { data: projected[0], error: null };
    }
    return { data: projected, error: null };
  }
}

export class FakeRpcCall implements PromiseLike<FakeResult> {
  constructor(
    private readonly fake: FakeSupabase,
    private readonly name: string,
    private readonly args: Record<string, unknown>,
  ) {}

  then<TResult1 = FakeResult, TResult2 = never>(
    onfulfilled?: ((value: FakeResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  private async execute(): Promise<FakeResult> {
    this.fake.runBeforeRpc();
    const injected = this.fake.beginCall({ kind: "rpc", name: this.name, args: clone(this.args), ops: [] });
    if (injected) return injected;
    const handler = this.fake.rpcHandlers[this.name];
    if (!handler) {
      return {
        data: null,
        error: {
          code: "PGRST202",
          message: `Could not find the function public.${this.name} in the schema cache`,
        },
      };
    }
    return handler(clone(this.args), this.fake);
  }
}

export class FakeSupabase {
  tables: Record<TableName, Row[]> = { reports: [], report_history: [], report_comments: [] };
  callCount = 0;
  calls: FakeCall[] = [];
  // Registry name -> handler. reset() leaves it alone; a test that registers a handler
  // only for itself deletes it afterwards.
  readonly rpcHandlers: Record<string, RpcHandler> = {};

  private clockMs = Date.parse(DEFAULT_CLOCK);
  private seqCounters: Record<SeqTable, number> = { report_history: 0, report_comments: 0 };
  private idQueue: string[] = [];
  private pendingFailure: FakeError | null = null;
  private pendingThrow: { error: unknown } | null = null;
  private beforeRpc: BeforeCallCallback | null = null;
  private beforeInsert: BeforeCallCallback | null = null;

  readonly client = {
    from: (table: string): FakeQueryBuilder => new FakeQueryBuilder(this, table),
    rpc: (name: string, args: Record<string, unknown> = {}): FakeRpcCall => new FakeRpcCall(this, name, args),
  };

  // Rows given here keep their `seq`; rows without one get the next value in array order,
  // and later inserts continue after the highest seq.
  reset(initial: Partial<Record<TableName, Row[]>> = {}): void {
    this.seqCounters = { report_history: 0, report_comments: 0 };
    this.tables = {
      reports: (initial.reports ?? []).map(storeRow),
      report_history: this.withSeq("report_history", (initial.report_history ?? []).map(storeRow)),
      report_comments: this.withSeq("report_comments", (initial.report_comments ?? []).map(storeRow)),
    };
    this.callCount = 0;
    this.calls = [];
    this.clockMs = Date.parse(DEFAULT_CLOCK);
    this.idQueue = [];
    this.pendingFailure = null;
    this.pendingThrow = null;
    this.beforeRpc = null;
    this.beforeInsert = null;
  }

  private withSeq(table: SeqTable, rows: Row[]): Row[] {
    for (const row of rows) {
      if (typeof row.seq === "number") {
        this.seqCounters[table] = Math.max(this.seqCounters[table], row.seq);
      }
    }
    for (const row of rows) {
      if (typeof row.seq !== "number") row.seq = this.nextSeq(table);
    }
    return rows;
  }

  nextSeq(table: SeqTable): number {
    this.seqCounters[table] += 1;
    return this.seqCounters[table];
  }

  failNext(error: FakeError): void {
    this.pendingFailure = { ...error };
  }

  throwNext(error: unknown): void {
    this.pendingThrow = { error };
  }

  // Runs `callback` on the fake just before the next rpc executes (before an armed failure is
  // applied), e.g. to simulate a concurrent change between a route's read and its write.
  beforeNextRpc(callback: BeforeCallCallback): void {
    this.beforeRpc = callback;
  }

  runBeforeRpc(): void {
    const callback = this.beforeRpc;
    this.beforeRpc = null;
    if (callback) callback(this);
  }

  // The same for the next table insert, e.g. to fail the comment insert but not the report read.
  beforeNextInsert(callback: BeforeCallCallback): void {
    this.beforeInsert = callback;
  }

  runBeforeInsert(): void {
    const callback = this.beforeInsert;
    this.beforeInsert = null;
    if (callback) callback(this);
  }

  // report_history.report_id and report_comments.report_id reference public.reports(id):
  // an insert naming an unknown report fails with 23503 and stores nothing.
  foreignKeyViolation(table: TableName, rows: Row[]): FakeError | null {
    if (!isSeqTable(table)) return null;
    const known = new Set(this.tables.reports.map((report) => report.id));
    const orphan = rows.find((row) => !known.has(row.report_id));
    if (!orphan) return null;
    return {
      code: "23503",
      message: `insert or update on table "${table}" violates foreign key constraint "${table}_report_id_fkey"`,
    };
  }

  setClock(iso: string): void {
    const ms = Date.parse(iso);
    if (Number.isNaN(ms)) throw new Error(`fakeSupabase.setClock: invalid timestamp ${iso}`);
    this.clockMs = ms;
  }

  // Current fake time in PostgREST form; advances 1 ms per call so writes stay ordered.
  now(): string {
    const iso = new Date(this.clockMs).toISOString();
    this.clockMs += 1;
    return toPostgrestTimestamp(iso);
  }

  queueIds(...ids: string[]): void {
    this.idQueue.push(...ids);
  }

  nextId(): string {
    return this.idQueue.shift() ?? crypto.randomUUID();
  }

  tableRows(table: string): Row[] | null {
    return (TABLE_NAMES as readonly string[]).includes(table) ? this.tables[table as TableName] : null;
  }

  prepareInsert(table: TableName, row: Row): Row {
    const stored = storeRow(row);
    if (stored.id === undefined) stored.id = this.nextId();
    if (isSeqTable(table)) {
      // Like `generated always as identity`: the database assigns seq, never the caller.
      stored.seq = this.nextSeq(table);
    }
    const missing = TIMESTAMP_DEFAULTS[table].filter((column) => stored[column] === undefined);
    if (missing.length > 0) {
      const stamp = this.now();
      for (const column of missing) stored[column] = stamp;
    }
    return stored;
  }

  // Records an awaited query or rpc and applies an armed failure. Returns the injected
  // result, or null when the call should run normally. Throws when throwNext() was armed.
  beginCall(call: FakeCall): FakeResult | null {
    this.callCount += 1;
    this.calls.push({ ...call, ops: call.ops.map((op) => ({ method: op.method, args: [...op.args] })) });
    if (this.pendingThrow) {
      const { error } = this.pendingThrow;
      this.pendingThrow = null;
      throw error;
    }
    if (this.pendingFailure) {
      const error = this.pendingFailure;
      this.pendingFailure = null;
      return { data: null, error };
    }
    return null;
  }
}

export const fakeSupabase = new FakeSupabase();

// ---------------------------------------------------------------------------
// Fake Postgres functions (mirror web-app/supabase/migrations/20261003170000_reports.sql)
// ---------------------------------------------------------------------------

function checkViolation(constraint: string): FakeResult {
  return {
    data: null,
    error: {
      code: "23514",
      message: `new row for relation "reports" violates check constraint "${constraint}"`,
    },
  };
}

function inList(list: readonly string[], value: unknown): boolean {
  return typeof value === "string" && list.includes(value);
}

// public.create_report: inserts the report (state pending_parent) and its "submit" history
// entry with one timestamp, in one transaction, and returns to_jsonb(report row).
fakeSupabase.rpcHandlers.create_report = (args, fake) => {
  const attackType = args.p_attack_type;
  const takenActions = args.p_taken_actions;
  const source = args.p_source;
  const content = args.p_content;
  if (!inList(ATTACK_TYPES, attackType)) return checkViolation("reports_attack_type_check");
  if (!Array.isArray(takenActions) || !takenActions.every((a) => inList(TAKEN_ACTIONS, a))) {
    return checkViolation("reports_taken_actions_check");
  }
  if (!inList(REPORT_SOURCES, source)) return checkViolation("reports_source_check");
  if (typeof content !== "string") return checkViolation("reports_content_check");
  const length = [...content.trim()].length;
  if (length < 1 || length > LIMITS.contentMaxChars) return checkViolation("reports_content_check");
  if (typeof args.p_parent_id !== "string" || typeof args.p_child_id !== "string") {
    return { data: null, error: { code: "23502", message: "null value violates not-null constraint" } };
  }

  const now = fake.now();
  const report: Row = {
    id: fake.nextId(),
    parent_id: args.p_parent_id,
    child_id: args.p_child_id,
    attack_type: attackType,
    taken_actions: [...takenActions],
    source,
    content,
    state: "pending_parent",
    created_at: now,
    updated_at: now,
  };
  fake.tables.reports.push(report);
  fake.tables.report_history.push({
    id: crypto.randomUUID(),
    seq: fake.nextSeq("report_history"),
    report_id: report.id,
    action: "submit",
    from_state: null,
    to_state: "pending_parent",
    actor_id: args.p_child_id,
    actor_role: "child",
    comment: null,
    created_at: now,
  });
  return { data: clone(report), error: null };
};

function raise(message: string): FakeResult {
  return { data: null, error: { code: "P0001", message } };
}

function stringList(value: unknown): string[] | null {
  if (value === null || value === undefined) return null;
  if (!Array.isArray(value)) return null;
  return value.map(String);
}

function timeMs(value: unknown): number {
  return Date.parse(String(value));
}

// Row comparison (a.created_at, a.id) vs (b.created_at, b.id), like Postgres on timestamptz and uuid.
function compareCreatedId(aCreated: unknown, aId: unknown, bCreated: unknown, bId: unknown): number {
  const diff = timeMs(aCreated) - timeMs(bCreated);
  if (diff !== 0) return diff;
  const a = String(aId);
  const b = String(bId);
  return a < b ? -1 : a > b ? 1 : 0;
}

// public.list_reports: every non-null filter applies; the cursor keeps rows strictly after it in
// (created_at desc, id desc) order; an empty scope or a bad limit raises (never "all reports").
fakeSupabase.rpcHandlers.list_reports = (args, fake) => {
  const parentId = args.p_parent_id ?? null;
  const childIds = stringList(args.p_child_ids);
  const states = stringList(args.p_states);
  const state = args.p_state ?? null;
  const cursorCreated = args.p_cursor_created_at ?? null;
  const cursorId = args.p_cursor_id ?? null;
  const limit = args.p_limit;

  if (parentId === null && childIds === null) return raise("list_reports: parent or child scope required");
  if (typeof limit !== "number" || !Number.isInteger(limit) || limit < 1 || limit > 101) {
    return raise("list_reports: limit must be between 1 and 101");
  }
  if ((cursorCreated === null) !== (cursorId === null)) {
    return raise("list_reports: cursor needs both created_at and id");
  }

  const rows = fake.tables.reports
    .filter((r) => parentId === null || r.parent_id === parentId)
    .filter((r) => childIds === null || childIds.includes(String(r.child_id)))
    .filter((r) => states === null || states.includes(String(r.state)))
    .filter((r) => state === null || r.state === state)
    .filter((r) => cursorCreated === null || compareCreatedId(r.created_at, r.id, cursorCreated, cursorId) < 0)
    .sort((a, b) => compareCreatedId(b.created_at, b.id, a.created_at, a.id))
    .slice(0, limit);
  return { data: rows.map((r) => clone(r)), error: null };
};

// ---------------------------------------------------------------------------
// Fake public.transition_report (mirrors web-app/supabase/migrations/20261003170100_report_transitions.sql)
// ---------------------------------------------------------------------------

// The (action, from, to, role) tuples report_history_transition_check allows for transitions.
function transitionTupleAllowed(action: unknown, from: unknown, to: unknown, role: unknown): boolean {
  return TRANSITIONS.some(
    (rule) =>
      rule.action === action &&
      rule.to === to &&
      (rule.from as readonly unknown[]).includes(from) &&
      (rule.roles as readonly unknown[]).includes(role),
  );
}

function historyViolation(constraint: string): FakeResult {
  return {
    data: null,
    error: {
      code: "23514",
      message: `new row for relation "report_history" violates check constraint "${constraint}"`,
    },
  };
}

// Updates the report only when it is still in p_from_state (data null otherwise, nothing
// changed), then inserts the history entry with the same timestamp. A tuple outside the matrix,
// a missing escalation comment or a bad comment length fails like the CHECK constraints and
// rolls everything back. Returns { report, entry } as jsonb_build_object would.
fakeSupabase.rpcHandlers.transition_report = (args, fake) => {
  const report = fake.tables.reports.find((row) => row.id === args.p_report_id);
  if (!report || report.state !== args.p_from_state) return { data: null, error: null };

  const action = args.p_action;
  const comment = args.p_comment ?? null;
  if (!transitionTupleAllowed(action, args.p_from_state, args.p_to_state, args.p_actor_role)) {
    return historyViolation("report_history_transition_check");
  }
  if (comment !== null) {
    const length = typeof comment === "string" ? [...comment.trim()].length : 0;
    if (length < 1 || length > LIMITS.transitionCommentMaxChars) {
      return historyViolation("report_history_comment_check");
    }
  }
  if (TRANSITION_COMMENT_REQUIRED[action as TransitionAction] && comment === null) {
    return historyViolation("report_history_escalate_comment_check");
  }
  if (typeof args.p_actor_id !== "string") {
    return { data: null, error: { code: "23502", message: "null value violates not-null constraint" } };
  }

  const now = fake.now();
  report.state = args.p_to_state;
  report.updated_at = now;
  const entry: Row = {
    id: fake.nextId(),
    seq: fake.nextSeq("report_history"),
    report_id: report.id,
    action,
    from_state: args.p_from_state,
    to_state: args.p_to_state,
    actor_id: args.p_actor_id,
    actor_role: args.p_actor_role,
    comment,
    created_at: now,
  };
  fake.tables.report_history.push(entry);
  return { data: { report: clone(report), entry: clone(entry) }, error: null };
};
