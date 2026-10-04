// seed.sql is generated from demo-dataset.json (D-05) and is safe to re-run against the shared
// project: one delete limited to the dataset report ids, then plain inserts (T-01-32).

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { loadDemoDataset } from "../helpers/dataset";

const WEB_APP_DIR = fileURLToPath(new URL("../../", import.meta.url));
const SEED = readFileSync(new URL("../../supabase/seed.sql", import.meta.url), "utf8");
const DATASET = loadDemoDataset();

// Statement lines: everything except blank lines and `--` comment lines.
const STATEMENTS = SEED.split("\n").filter((line) => line.trim() !== "" && !line.trimStart().startsWith("--"));

function quoted(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

describe("seed.sql", () => {
  it("is up to date with demo-dataset.json (build-seed --check exits 0)", () => {
    const result = spawnSync(process.execPath, ["scripts/build-seed.mjs", "--check"], {
      cwd: WEB_APP_DIR,
      encoding: "utf8",
    });
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain("seed.sql is up to date");
  });

  it("uses LF line endings and ends with a newline", () => {
    expect(SEED).not.toContain("\r");
    expect(SEED.endsWith("commit;\n")).toBe(true);
  });

  it("starts with begin; after the comment header and ends with commit;", () => {
    const lines = SEED.split("\n");
    const firstStatement = lines.findIndex((line) => line.trim() !== "" && !line.startsWith("--"));
    expect(firstStatement).toBeGreaterThan(0);
    expect(lines.slice(0, firstStatement).every((line) => line === "" || line.startsWith("--"))).toBe(true);
    expect(STATEMENTS[0]).toBe("begin;");
    expect(STATEMENTS.at(-1)).toBe("commit;");
  });

  it("contains every dataset id as a quoted literal", () => {
    const ids = [
      ...DATASET.reports.map((r) => String(r.id)),
      ...DATASET.history.map((h) => String(h.id)),
      ...DATASET.comments.map((c) => String(c.id)),
    ];
    expect(ids).toHaveLength(6 + 13 + 3);
    for (const id of ids) expect(SEED).toContain(`'${id}'`);
  });

  it("contains every report content, history comment and comment body with quotes doubled", () => {
    for (const report of DATASET.reports) expect(SEED).toContain(quoted(String(report.content)));
    for (const entry of DATASET.history) {
      if (entry.comment !== null) expect(SEED).toContain(quoted(String(entry.comment)));
    }
    for (const comment of DATASET.comments) expect(SEED).toContain(quoted(String(comment.body)));
  });

  it("inserts one row per statement in dataset order", () => {
    const inserts = (table: string) => STATEMENTS.filter((line) => line.startsWith(`insert into public.${table} (`));
    expect(inserts("reports")).toHaveLength(6);
    expect(inserts("report_history")).toHaveLength(13);
    expect(inserts("report_comments")).toHaveLength(3);
    expect(inserts("report_history").map((line) => /values \('([^']+)'/.exec(line)?.[1])).toEqual(
      DATASET.history.map((h) => h.id),
    );
    expect(inserts("report_comments").map((line) => /values \('([^']+)'/.exec(line)?.[1])).toEqual(
      DATASET.comments.map((c) => c.id),
    );
  });

  it("has exactly one delete, on public.reports, limited to the 6 dataset ids", () => {
    const deletes = STATEMENTS.filter((line) => /^\s*delete\b/i.test(line));
    expect(deletes).toHaveLength(1);
    const match = /^delete from public\.reports where id in \((.*)\);$/.exec(deletes[0]);
    expect(match).not.toBeNull();
    const ids = [...(match?.[1] ?? "").matchAll(/'([^']+)'/g)].map((m) => m[1]);
    expect(ids).toEqual(DATASET.reports.map((r) => r.id));
  });

  it("has only begin, delete, insert and commit statements (no drop, truncate or update)", () => {
    for (const line of STATEMENTS) {
      expect(line).toMatch(/^(begin;|commit;|delete from public\.reports |insert into public\.(reports|report_history|report_comments) \()/);
      expect(line).not.toMatch(/^\s*(drop|truncate|update|alter|create|grant|revoke)\b/i);
    }
  });

  it("only links to hosts under the reserved .example domain", () => {
    const hosts = [...SEED.matchAll(/https?:\/\/([^/\s'"]+)/g)].map((m) => m[1]);
    expect(hosts.length).toBeGreaterThan(0);
    for (const host of hosts) expect(host.endsWith(".example")).toBe(true);
  });
});
