// Locks the SQL schema in web-app/supabase/migrations to the contract constants in types.ts.
// When an assertion here fails, fix the migration (with a new migration once applied), never
// this test or the contract.

import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  ACCOUNT_ROLES,
  ACTOR_ROLES,
  ATTACK_TYPES,
  HISTORY_ACTIONS,
  LIMITS,
  REPORT_SOURCES,
  REPORT_STATES,
  TAKEN_ACTIONS,
  TRANSITIONS,
} from "@/lib/contract/types";

const MIGRATIONS_DIR = new URL("../../supabase/migrations/", import.meta.url);

// All migrations in name order, without comment lines.
function loadSql(): string {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((name) => name.endsWith(".sql"))
    .sort();
  expect(files.length).toBeGreaterThan(0);
  return files
    .map((name) => readFileSync(new URL(name, MIGRATIONS_DIR), "utf8"))
    .join("\n")
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("--"))
    .join("\n");
}

const SQL = loadSql();

function count(needle: string): number {
  return SQL.split(needle).length - 1;
}

// The single-quoted values of the first `<prefix>(...)` list after `prefix`.
function quotedList(prefix: string): string[] {
  const start = SQL.indexOf(prefix);
  expect(start, `migration should contain ${prefix}`).toBeGreaterThanOrEqual(0);
  const open = start + prefix.length;
  const close = SQL.indexOf(")", open);
  return [...SQL.slice(open, close).matchAll(/'([a-z_]*)'/g)].map((m) => m[1]);
}

function lengthLimit(column: string): number {
  const match = new RegExp(`char_length\\(btrim\\(${column}\\)\\) between 1 and (\\d+)`).exec(SQL);
  expect(match, `length check for ${column}`).not.toBeNull();
  return Number(match?.[1]);
}

describe("migrations mirror the contract enums", () => {
  it.each([
    ["REPORT_STATES", REPORT_STATES],
    ["ATTACK_TYPES", ATTACK_TYPES],
    ["TAKEN_ACTIONS", TAKEN_ACTIONS],
    ["REPORT_SOURCES", REPORT_SOURCES],
    ["ACTOR_ROLES", ACTOR_ROLES],
    ["HISTORY_ACTIONS", HISTORY_ACTIONS],
    ["ACCOUNT_ROLES", ACCOUNT_ROLES],
  ] as const)("writes every %s value as a single-quoted literal", (_name, values) => {
    for (const value of values) expect(SQL, `'${value}'`).toContain(`'${value}'`);
  });

  it("lists exactly the contract values in each enum check", () => {
    expect(quotedList("check (attack_type in (")).toEqual([...ATTACK_TYPES]);
    expect(quotedList("check (taken_actions <@ array[")).toEqual([...TAKEN_ACTIONS]);
    expect(quotedList("check (source in (")).toEqual([...REPORT_SOURCES]);
    expect(quotedList("check (state in (")).toEqual([...REPORT_STATES]);
    expect(quotedList("check (action in (")).toEqual([...HISTORY_ACTIONS]);
    expect(quotedList("check (from_state is null or from_state in (")).toEqual([...REPORT_STATES]);
    expect(quotedList("check (to_state in (")).toEqual([...REPORT_STATES]);
    expect(quotedList("check (actor_role in (")).toEqual([...ACTOR_ROLES]);
    expect(quotedList("check (author_role in (")).toEqual([...ACCOUNT_ROLES]);
  });

  it("defaults a new report to the initial state", () => {
    expect(SQL).toContain("state text not null default 'pending_parent'");
  });
});

describe("migrations mirror the transition matrix", () => {
  it("allows exactly the submit entry and the TRANSITIONS tuples in report_history", () => {
    const expected = new Set<string>(["('submit','','pending_parent','child')"]);
    for (const rule of TRANSITIONS) {
      for (const from of rule.from) {
        for (const role of rule.roles) {
          expected.add(`('${rule.action}','${from}','${rule.to}','${role}')`);
        }
      }
    }
    expect(expected.size).toBe(11);

    const found = SQL.match(/\('[a-z_]+','[a-z_]*','[a-z_]+','[a-z_]+'\)/g) ?? [];
    expect(found).toHaveLength(11);
    expect(new Set(found)).toEqual(expected);
  });

  it("requires a comment on escalation", () => {
    expect(SQL).toContain("action <> 'escalate' or comment is not null");
  });
});

describe("migrations mirror the limits and timestamps", () => {
  it("uses the contract text limits", () => {
    expect(lengthLimit("content")).toBe(LIMITS.contentMaxChars);
    expect(lengthLimit("body")).toBe(LIMITS.commentMaxChars);
    expect(lengthLimit("comment")).toBe(LIMITS.transitionCommentMaxChars);
  });

  it("stores timestamps with millisecond precision", () => {
    expect(SQL).toContain("date_trunc('milliseconds', now())");
  });

  it("caps list_reports at pageMax + 1 rows", () => {
    expect(SQL).toContain(`p_limit > ${LIMITS.pageMax + 1}`);
  });
});

describe("migrations keep history and comments append-only and closed to API keys", () => {
  it("blocks updates of history and comments", () => {
    expect(SQL).toContain("before update on public.report_history");
    expect(SQL).toContain("before update on public.report_comments");
  });

  it("blocks direct deletes and truncation of history and comments (WR-03)", () => {
    for (const table of ["report_history", "report_comments"]) {
      expect(SQL).toContain(`before delete on public.${table}\n  for each row execute function public.forbid_delete();`);
      expect(SQL).toContain(`before truncate on public.${table}\n  for each statement execute function public.forbid_delete();`);
    }
  });

  it("still lets a report delete cascade to its history and comments (seed.sql demo reset)", () => {
    expect(count("references public.reports(id) on delete cascade")).toBe(2);
    // forbid_delete lets a row go only inside the cascade: nested trigger and parent already gone.
    expect(SQL).toContain("if tg_op = 'DELETE' and pg_trigger_depth() > 1 then");
    expect(SQL).toContain("if not exists (select 1 from public.reports where id = old.report_id) then");
  });

  it("enables row level security on the three tables without any policy", () => {
    expect(count("enable row level security")).toBe(3);
    for (const table of ["reports", "report_history", "report_comments"]) {
      expect(SQL).toContain(`alter table public.${table} enable row level security;`);
    }
    expect(SQL.toLowerCase()).not.toContain("create policy");
  });

  it("revokes execute from public, anon and authenticated on every function and grants it to service_role", () => {
    const names = [...SQL.matchAll(/create (?:or replace )?function public\.([a-z_]+)\s*\(/g)].map((m) => m[1]);
    expect(names).toEqual(expect.arrayContaining(["create_report", "list_reports", "forbid_update", "forbid_delete"]));
    const lines = SQL.split("\n");
    for (const name of names) {
      const revoke = lines.find((line) => line.startsWith(`revoke execute on function public.${name}(`));
      expect(revoke, `revoke line for ${name}`).toBeDefined();
      expect(revoke).toContain("anon");
      expect(revoke).toContain("authenticated");
      expect(revoke).toMatch(/from public, /);
      const grant = lines.find((line) => line.startsWith(`grant execute on function public.${name}(`));
      expect(grant, `grant line for ${name}`).toBeDefined();
      expect(grant?.trimEnd().endsWith("to service_role;")).toBe(true);
    }
  });
});
