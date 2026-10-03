#!/usr/bin/env node
// Conformance checker for the API contract examples (.planning/shared/examples/*.json).
// Every example must agree with the constants in src/lib/contract/types.ts.
//
// Usage:  node web-app/scripts/check-contract-examples.mjs
// Env:    CONTRACT_EXAMPLES_DIR overrides the examples directory.
// Output: "OK <file>" / "FAIL <file>: <reason>" per file, then
//         "contract examples: N files OK" or "contract examples: K of N files FAILED" (exit 1).
//
// Node built-ins only. types.ts is loaded through Node 22.18+ type stripping.

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ALREADY_ACTED_VALUES,
  API_ERROR_CODES,
  API_ERROR_MESSAGES_PL,
  CASE_FIELDS,
  CASE_SOURCES,
  CASE_STATUSES,
  DEMO_CHILD_ID_PATTERN,
  LIMITS,
  REPLY_FIELDS,
} from "../src/lib/contract/types.ts";

const DEFAULT_DIR = fileURLToPath(new URL("../../.planning/shared/examples/", import.meta.url));
const dir = process.env.CONTRACT_EXAMPLES_DIR || DEFAULT_DIR;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const URL_PATTERN = /https?:\/\/[^\s"'<>()]+/gi;
const EXAMPLE_KEYS = ["description", "method", "route", "path", "request", "response"];
const ERROR_HTTP_STATUS = {
  invalid_json: 400,
  validation_error: 400,
  payload_too_large: 413,
  case_not_found: 404,
  storage_unavailable: 503,
  internal_error: 500,
};

class CheckError extends Error {}

function fail(message) {
  throw new CheckError(message);
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function sameKeys(obj, keys, label) {
  const actual = Object.keys(obj).sort();
  const expected = [...keys].sort();
  if (actual.join(",") !== expected.join(",")) {
    fail(`${label} has keys [${actual.join(", ")}], expected [${expected.join(", ")}]`);
  }
}

function nonBlankString(value, maxChars, label) {
  if (typeof value !== "string") fail(`${label} must be a string`);
  if (value.trim().length === 0) fail(`${label} must not be blank`);
  if (value.length > maxChars) fail(`${label} exceeds ${maxChars} characters`);
}

function oneOf(value, allowed, label) {
  if (!allowed.includes(value)) {
    fail(`${label} "${value}" is not one of ${allowed.join(" / ")}`);
  }
}

function checkTimestamp(value, label) {
  if (typeof value !== "string" || !TIMESTAMP_PATTERN.test(value)) {
    fail(`${label} "${value}" is not ISO 8601 UTC YYYY-MM-DDTHH:mm:ss.sssZ`);
  }
  if (Number.isNaN(Date.parse(value))) fail(`${label} "${value}" is not a valid date`);
}

function checkUuid(value, label) {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) fail(`${label} "${value}" is not a UUID`);
}

function checkSignals(value, label) {
  if (!Array.isArray(value)) fail(`${label} must be an array`);
  if (value.length > LIMITS.signalsMaxItems) fail(`${label} has more than ${LIMITS.signalsMaxItems} items`);
  value.forEach((item, i) => nonBlankString(item, LIMITS.signalMaxChars, `${label}[${i}]`));
}

function checkSelectedAction(value, label) {
  if (value === null) return;
  nonBlankString(value, LIMITS.selectedActionMaxChars, label);
}

function checkDemoChildId(value, label) {
  if (typeof value !== "string" || !DEMO_CHILD_ID_PATTERN.test(value)) {
    fail(`${label} "${value}" does not match DEMO_CHILD_ID_PATTERN`);
  }
}

function checkCase(c, label, extraKeys = []) {
  if (!isObject(c)) fail(`${label} must be an object`);
  sameKeys(c, [...CASE_FIELDS, ...extraKeys], label);
  checkUuid(c.id, `${label}.id`);
  checkDemoChildId(c.demo_child_id, `${label}.demo_child_id`);
  oneOf(c.source, CASE_SOURCES, `${label}.source`);
  nonBlankString(c.content, LIMITS.contentMaxChars, `${label}.content`);
  checkSignals(c.signals, `${label}.signals`);
  checkSelectedAction(c.selected_action, `${label}.selected_action`);
  oneOf(c.already_acted, ALREADY_ACTED_VALUES, `${label}.already_acted`);
  oneOf(c.status, CASE_STATUSES, `${label}.status`);
  checkTimestamp(c.created_at, `${label}.created_at`);
  checkTimestamp(c.updated_at, `${label}.updated_at`);
  if (Date.parse(c.updated_at) < Date.parse(c.created_at)) {
    fail(`${label}.updated_at is earlier than created_at`);
  }
}

function checkReply(r, label) {
  if (!isObject(r)) fail(`${label} must be an object`);
  sameKeys(r, REPLY_FIELDS, label);
  checkUuid(r.id, `${label}.id`);
  checkUuid(r.case_id, `${label}.case_id`);
  nonBlankString(r.message, LIMITS.messageMaxChars, `${label}.message`);
  checkTimestamp(r.created_at, `${label}.created_at`);
}

function expectStatus(response, status) {
  if (response.status !== status) fail(`response.status is ${response.status}, expected ${status}`);
}

// Matches a concrete path against a route template; returns { params, query } or fails.
function matchPath(route, path) {
  if (typeof path !== "string") fail("path must be a string");
  const [pathname, search = ""] = path.split("?");
  const names = [];
  const pattern = route.replace(/[.*+?^$()|[\]\\]/g, "\\$&").replace(/\{(\w+)\}/g, (_, name) => {
    names.push(name);
    return "([^/]+)";
  });
  const m = new RegExp(`^${pattern}$`).exec(pathname);
  if (!m) fail(`path "${path}" does not match route "${route}"`);
  const params = Object.fromEntries(names.map((name, i) => [name, m[i + 1]]));
  return { params, query: new URLSearchParams(search) };
}

function byCreatedThenId(a, b) {
  const t = Date.parse(a.created_at) - Date.parse(b.created_at);
  if (t !== 0) return t;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

const routeCheckers = {
  "POST /api/cases"(ex) {
    matchPath(ex.route, ex.path);
    const req = ex.request;
    if (!isObject(req)) fail("request must be an object");
    checkDemoChildId(req.demo_child_id, "request.demo_child_id");
    oneOf(req.source, CASE_SOURCES, "request.source");
    nonBlankString(req.content, LIMITS.contentMaxChars, "request.content");
    if ("signals" in req) checkSignals(req.signals, "request.signals");
    if ("selected_action" in req) checkSelectedAction(req.selected_action, "request.selected_action");
    if ("already_acted" in req) oneOf(req.already_acted, ALREADY_ACTED_VALUES, "request.already_acted");
    expectStatus(ex.response, 201);
    const c = ex.response.body;
    checkCase(c, "response.body");
    const expected = {
      demo_child_id: req.demo_child_id,
      source: req.source,
      content: req.content.trim(),
      signals: req.signals ?? [],
      selected_action: req.selected_action ?? null,
      already_acted: req.already_acted ?? "unsure",
      status: "new",
    };
    for (const [key, value] of Object.entries(expected)) {
      if (JSON.stringify(c[key]) !== JSON.stringify(value)) {
        fail(`response.body.${key} does not match the request (expected ${JSON.stringify(value)})`);
      }
    }
    if (c.created_at !== c.updated_at) fail("a new case must have updated_at equal to created_at");
  },

  "GET /api/cases"(ex) {
    const { query } = matchPath(ex.route, ex.path);
    if (ex.request !== null) fail("request must be null");
    for (const key of query.keys()) {
      if (key !== "demo_child_id" && key !== "status") fail(`unknown query parameter "${key}"`);
    }
    const childFilter = query.get("demo_child_id");
    const statusFilter = query.get("status");
    if (childFilter !== null) checkDemoChildId(childFilter, "query demo_child_id");
    if (statusFilter !== null) oneOf(statusFilter, CASE_STATUSES, "query status");
    expectStatus(ex.response, 200);
    const body = ex.response.body;
    if (!isObject(body)) fail("response.body must be an object");
    sameKeys(body, ["cases"], "response.body");
    if (!Array.isArray(body.cases)) fail("response.body.cases must be an array");
    if (body.cases.length > LIMITS.listMaxItems) fail(`list exceeds ${LIMITS.listMaxItems} items`);
    body.cases.forEach((c, i) => {
      checkCase(c, `cases[${i}]`);
      if (childFilter !== null && c.demo_child_id !== childFilter) fail(`cases[${i}] does not match the demo_child_id filter`);
      if (statusFilter !== null && c.status !== statusFilter) fail(`cases[${i}] does not match the status filter`);
    });
    const ids = new Set(body.cases.map((c) => c.id));
    if (ids.size !== body.cases.length) fail("cases contain duplicate ids");
    for (let i = 1; i < body.cases.length; i++) {
      if (byCreatedThenId(body.cases[i - 1], body.cases[i]) < 0) {
        fail(`cases[${i - 1}] and cases[${i}] are not sorted by created_at desc, id desc`);
      }
    }
  },

  "GET /api/cases/{id}"(ex) {
    const { params } = matchPath(ex.route, ex.path);
    if (ex.request !== null) fail("request must be null");
    expectStatus(ex.response, 200);
    const c = ex.response.body;
    checkCase(c, "response.body", ["replies"]);
    if (c.id !== params.id) fail("response.body.id does not equal the id in the path");
    if (!Array.isArray(c.replies)) fail("response.body.replies must be an array");
    c.replies.forEach((r, i) => {
      checkReply(r, `replies[${i}]`);
      if (r.case_id !== c.id) fail(`replies[${i}].case_id does not equal the case id`);
    });
    for (let i = 1; i < c.replies.length; i++) {
      if (byCreatedThenId(c.replies[i - 1], c.replies[i]) > 0) {
        fail(`replies[${i - 1}] and replies[${i}] are not sorted oldest first`);
      }
    }
  },

  "PATCH /api/cases/{id}"(ex) {
    const { params } = matchPath(ex.route, ex.path);
    const req = ex.request;
    if (!isObject(req)) fail("request must be an object");
    sameKeys(req, ["status"], "request");
    oneOf(req.status, CASE_STATUSES, "request.status");
    expectStatus(ex.response, 200);
    const c = ex.response.body;
    checkCase(c, "response.body");
    if (c.id !== params.id) fail("response.body.id does not equal the id in the path");
    if (c.status !== req.status) fail("response.body.status does not equal the requested status");
  },

  "POST /api/cases/{id}/replies"(ex) {
    const { params } = matchPath(ex.route, ex.path);
    const req = ex.request;
    if (!isObject(req)) fail("request must be an object");
    sameKeys(req, ["message"], "request");
    nonBlankString(req.message, LIMITS.messageMaxChars, "request.message");
    expectStatus(ex.response, 201);
    const r = ex.response.body;
    checkReply(r, "response.body");
    if (r.case_id !== params.id) fail("response.body.case_id does not equal the id in the path");
    if (r.message !== req.message.trim()) fail("response.body.message does not match the request");
  },

  "GET /api/health"(ex) {
    matchPath(ex.route, ex.path);
    if (ex.request !== null) fail("request must be null");
    expectStatus(ex.response, 200);
    const body = ex.response.body;
    if (!isObject(body)) fail("response.body must be an object");
    sameKeys(body, ["status"], "response.body");
    if (body.status !== "ok") fail('response.body.status must be "ok"');
  },
};

function checkErrorsFile(doc) {
  sameKeys(doc, ["description", "errors"], "file");
  nonBlankString(doc.description, 1000, "description");
  if (!Array.isArray(doc.errors) || doc.errors.length === 0) fail("errors must be a non-empty array");
  const seen = new Set();
  doc.errors.forEach((entry, i) => {
    const label = `errors[${i}]`;
    if (!isObject(entry)) fail(`${label} must be an object`);
    sameKeys(entry, ["status", "code", "when", "body"], label);
    oneOf(entry.code, API_ERROR_CODES, `${label}.code`);
    if (seen.has(entry.code)) fail(`${label}.code "${entry.code}" appears more than once`);
    seen.add(entry.code);
    if (entry.status !== ERROR_HTTP_STATUS[entry.code]) {
      fail(`${label}.status is ${entry.status}, expected ${ERROR_HTTP_STATUS[entry.code]} for ${entry.code}`);
    }
    nonBlankString(entry.when, 1000, `${label}.when`);
    if (!isObject(entry.body)) fail(`${label}.body must be an object`);
    sameKeys(entry.body, ["error"], `${label}.body`);
    const err = entry.body.error;
    if (!isObject(err)) fail(`${label}.body.error must be an object`);
    const allowed = entry.code === "validation_error" ? ["code", "message", "details"] : ["code", "message"];
    for (const key of Object.keys(err)) {
      if (!allowed.includes(key)) fail(`${label}.body.error has unexpected key "${key}"`);
    }
    if (err.code !== entry.code) fail(`${label}.body.error.code does not equal ${label}.code`);
    if (err.message !== API_ERROR_MESSAGES_PL[entry.code]) {
      fail(`${label}.body.error.message differs from API_ERROR_MESSAGES_PL.${entry.code}`);
    }
    if ("details" in err) {
      if (!Array.isArray(err.details) || err.details.length === 0) fail(`${label}.body.error.details must be a non-empty array`);
      err.details.forEach((d, j) => {
        if (!isObject(d)) fail(`${label}.body.error.details[${j}] must be an object`);
        sameKeys(d, ["field", "message"], `${label}.body.error.details[${j}]`);
        nonBlankString(d.field, 200, `${label}.body.error.details[${j}].field`);
        nonBlankString(d.message, 1000, `${label}.body.error.details[${j}].message`);
      });
    }
  });
}

// Privacy guard: every http(s) URL in any string value must point to a .example host.
function checkUrls(value, label) {
  if (typeof value === "string") {
    for (const raw of value.match(URL_PATTERN) ?? []) {
      let host;
      try {
        host = new URL(raw.replace(/[.,;:!?]+$/, "")).hostname;
      } catch {
        fail(`${label} contains an unparsable URL "${raw}"`);
      }
      if (!host.endsWith(".example")) fail(`${label} contains URL "${raw}" whose host does not end in ".example"`);
    }
  } else if (Array.isArray(value)) {
    value.forEach((item, i) => checkUrls(item, `${label}[${i}]`));
  } else if (isObject(value)) {
    for (const [key, item] of Object.entries(value)) checkUrls(item, `${label}.${key}`);
  }
}

function checkFile(path) {
  let doc;
  try {
    doc = JSON.parse(readFileSync(path, "utf8"));
  } catch (e) {
    fail(`invalid JSON (${e.message})`);
  }
  if (!isObject(doc)) fail("top level must be an object");
  checkUrls(doc, "file");
  if ("errors" in doc) {
    checkErrorsFile(doc);
    return;
  }
  sameKeys(doc, EXAMPLE_KEYS, "file");
  nonBlankString(doc.description, 1000, "description");
  if (!isObject(doc.response)) fail("response must be an object");
  sameKeys(doc.response, ["status", "body"], "response");
  const key = `${doc.method} ${doc.route}`;
  const checker = routeCheckers[key];
  if (!checker) fail(`unknown route template "${key}"`);
  checker(doc);
}

let files;
try {
  files = readdirSync(dir).filter((name) => name.endsWith(".json")).sort();
} catch (e) {
  console.error(`contract examples: cannot read directory ${dir} (${e.message})`);
  process.exit(1);
}

if (files.length === 0) {
  console.error(`contract examples: no JSON files in ${dir}`);
  process.exit(1);
}

let failed = 0;
for (const name of files) {
  try {
    checkFile(join(dir, name));
    console.log(`OK ${name}`);
  } catch (e) {
    failed++;
    const reason = e instanceof CheckError ? e.message : `unexpected error: ${e.stack ?? e}`;
    console.log(`FAIL ${name}: ${reason}`);
  }
}

if (failed > 0) {
  console.log(`contract examples: ${failed} of ${files.length} files FAILED`);
  process.exit(1);
}
console.log(`contract examples: ${files.length} files OK`);
