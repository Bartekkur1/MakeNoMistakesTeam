// In-memory fake of the supabase-js subset this phase uses. Tests replace createClient with
// a function returning `fakeSupabase.client` (vi.mock), so no test ever reaches a real
// Supabase project (D-06). Plans 01-04 and 01-05 extend this helper.
//
// Semantics follow PostgREST: every awaited query resolves { data, error } and never throws
// unless throwNext() was armed; single() on anything but exactly one row gives PGRST116;
// maybeSingle() on zero rows gives data null; an unknown rpc gives PGRST202.

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

const TABLE_NAMES: readonly TableName[] = ["reports", "report_history", "report_comments"];

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
  private idQueue: string[] = [];
  private pendingFailure: FakeError | null = null;
  private pendingThrow: { error: unknown } | null = null;

  readonly client = {
    from: (table: string): FakeQueryBuilder => new FakeQueryBuilder(this, table),
    rpc: (name: string, args: Record<string, unknown> = {}): FakeRpcCall => new FakeRpcCall(this, name, args),
  };

  reset(initial: Partial<Record<TableName, Row[]>> = {}): void {
    this.tables = {
      reports: (initial.reports ?? []).map(storeRow),
      report_history: (initial.report_history ?? []).map(storeRow),
      report_comments: (initial.report_comments ?? []).map(storeRow),
    };
    this.callCount = 0;
    this.calls = [];
    this.clockMs = Date.parse(DEFAULT_CLOCK);
    this.idQueue = [];
    this.pendingFailure = null;
    this.pendingThrow = null;
  }

  failNext(error: FakeError): void {
    this.pendingFailure = { ...error };
  }

  throwNext(error: unknown): void {
    this.pendingThrow = { error };
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
