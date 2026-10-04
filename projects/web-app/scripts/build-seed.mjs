#!/usr/bin/env node
// Generates projects/web-app/supabase/seed.sql from the canonical demo dataset
// (.planning/shared/examples/demo-dataset.json), so the data a human loads into Supabase is the
// same data the contract examples and the panel/widget offline work rely on (D-05).
//
// Usage:  node scripts/build-seed.mjs           writes seed.sql   (npm run seed:build)
//         node scripts/build-seed.mjs --check   exits 1 when seed.sql differs from the rendering
//                                               (npm run seed:check)
//
// Node built-ins only. The output is deterministic: LF line endings, a trailing newline, rows in
// dataset order. This script never connects to any database (D-06).

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const DATASET_PATH = fileURLToPath(new URL("../../../.planning/shared/examples/demo-dataset.json", import.meta.url));
const SEED_PATH = fileURLToPath(new URL("../supabase/seed.sql", import.meta.url));

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

function fail(message) {
  console.error(`build-seed: ${message}`);
  process.exit(1);
}

function loadDataset() {
  const parsed = JSON.parse(readFileSync(DATASET_PATH, "utf8"));
  const dataset = parsed?.dataset;
  if (!dataset || !Array.isArray(dataset.reports) || !Array.isArray(dataset.history) || !Array.isArray(dataset.comments)) {
    fail("demo-dataset.json has no dataset.reports / dataset.history / dataset.comments lists");
  }
  return dataset;
}

// A single-quoted SQL string literal with single quotes doubled.
function str(value) {
  if (typeof value !== "string") fail(`expected a string, got ${JSON.stringify(value)}`);
  return `'${value.replaceAll("'", "''")}'`;
}

function nullableStr(value) {
  return value === null ? "null" : str(value);
}

function uuid(value) {
  if (typeof value !== "string" || !UUID.test(value)) fail(`expected a lowercase uuid, got ${JSON.stringify(value)}`);
  return str(value);
}

function timestamp(value) {
  if (typeof value !== "string" || !TIMESTAMP.test(value)) fail(`expected a .sssZ timestamp, got ${JSON.stringify(value)}`);
  return str(value);
}

function textArray(values) {
  if (!Array.isArray(values)) fail(`expected a list, got ${JSON.stringify(values)}`);
  return values.length === 0 ? "'{}'::text[]" : `array[${values.map(str).join(", ")}]::text[]`;
}

function reportInsert(r) {
  return (
    "insert into public.reports (id, parent_id, child_id, attack_type, taken_actions, source, content, state, created_at, updated_at) values (" +
    [
      uuid(r.id),
      uuid(r.parent_id),
      uuid(r.child_id),
      str(r.attack_type),
      textArray(r.taken_actions),
      str(r.source),
      str(r.content),
      str(r.state),
      timestamp(r.created_at),
      timestamp(r.updated_at),
    ].join(", ") +
    ");"
  );
}

function historyInsert(h) {
  return (
    "insert into public.report_history (id, report_id, action, from_state, to_state, actor_id, actor_role, comment, created_at) values (" +
    [
      uuid(h.id),
      uuid(h.report_id),
      str(h.action),
      nullableStr(h.from_state),
      str(h.to_state),
      uuid(h.actor_id),
      str(h.actor_role),
      nullableStr(h.comment),
      timestamp(h.created_at),
    ].join(", ") +
    ");"
  );
}

function commentInsert(c) {
  return (
    "insert into public.report_comments (id, report_id, author_id, author_role, body, created_at) values (" +
    [uuid(c.id), uuid(c.report_id), uuid(c.author_id), str(c.author_role), str(c.body), timestamp(c.created_at)].join(", ") +
    ");"
  );
}

function renderSeed(dataset) {
  const lines = [
    "-- Demo seed for BezpiecznaAura (contract v2).",
    "--",
    "-- GENERATED from .planning/shared/examples/demo-dataset.json by projects/web-app/scripts/build-seed.mjs.",
    "-- Do not edit by hand: change the dataset, then run `npm run seed:build` in web-app.",
    "--",
    "-- Run after all migrations in projects/web-app/supabase/migrations, by a human only (D-06).",
    "-- Re-runnable demo reset: it deletes and re-inserts only the dataset reports listed below;",
    "-- their history entries and comments go with them (on delete cascade). Other reports stay.",
    "-- History and comments are inserted one statement per row, so seq follows the dataset order.",
    "-- Fictional data only.",
    "",
    "begin;",
    "",
    `delete from public.reports where id in (${dataset.reports.map((r) => uuid(r.id)).join(", ")});`,
    "",
    ...dataset.reports.map(reportInsert),
    "",
    ...dataset.history.map(historyInsert),
    "",
    ...dataset.comments.map(commentInsert),
    "",
    "commit;",
  ];
  return `${lines.join("\n")}\n`;
}

function main() {
  const dataset = loadDataset();
  const rendered = renderSeed(dataset);

  if (process.argv.includes("--check")) {
    let current = null;
    try {
      current = readFileSync(SEED_PATH, "utf8");
    } catch {
      current = null;
    }
    if (current !== rendered) {
      console.error("seed.sql is out of date - run npm run seed:build");
      process.exit(1);
    }
    console.log("seed.sql is up to date");
    return;
  }

  writeFileSync(SEED_PATH, rendered, "utf8");
  console.log(
    `seed.sql written (${dataset.reports.length} reports, ${dataset.history.length} history entries, ${dataset.comments.length} comments)`,
  );
}

main();
