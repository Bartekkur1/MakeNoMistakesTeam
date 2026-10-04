#!/usr/bin/env node
// Conformance checker for the API contract version 2 (.planning/shared/examples/*.json).
// It is an executable reference model of the contract: every example must agree with the
// constants in src/lib/contract/types.ts, the demo accounts in src/lib/contract/demo-accounts.ts
// and (for routes that read stored data) the canonical demo dataset in demo-dataset.json.
//
// Usage:  node projects/web-app/scripts/check-contract-examples.mjs
// Env:    CONTRACT_EXAMPLES_DIR overrides the examples directory.
// Output: "OK <file>" / "FAIL <file>: <reason>" per file, then
//         "contract examples: N files OK" or "contract examples: K of N files FAILED" (exit 1).
//         A broken constant set prints "FAIL contract constants: <reason>" and exits 1 before any file.
//
// Node built-ins only. types.ts and demo-accounts.ts are loaded through Node 22.18+ type stripping.

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ACCOUNT_FIELDS,
  ACCOUNT_ROLE_LABELS_PL,
  ACCOUNT_ROLES,
  ACTIONS_BY_ATTACK_TYPE,
  ACTOR_ROLE_LABELS_PL,
  ACTOR_ROLES,
  API_ERROR_CODES,
  API_ERROR_HTTP_STATUS,
  API_ERROR_MESSAGES_PL,
  ATTACK_TYPE_LABELS_PL,
  ATTACK_TYPES,
  CHILD_FIELDS,
  COMMENT_FIELDS,
  HISTORY_ACTION_LABELS_PL,
  HISTORY_ACTIONS,
  HISTORY_FIELDS,
  INITIAL_REPORT_STATE,
  LIMITS,
  LOGIN_SCOPE_LABELS_PL,
  LOGIN_SCOPES,
  REPORT_FIELDS,
  REPORT_SOURCE_LABELS_PL,
  REPORT_SOURCES,
  REPORT_STATE_LABELS_PL,
  REPORT_STATES,
  TAKEN_ACTION_LABELS_PL,
  TAKEN_ACTIONS,
  TEACHER_VISIBLE_STATES,
  TRANSITION_ACTION_LABELS_PL,
  TRANSITION_ACTIONS,
  TRANSITION_COMMENT_REQUIRED,
  TRANSITIONS,
} from "../src/lib/contract/types.ts";
import {
  DEMO_ACCOUNTS,
  DEMO_CHILDREN,
  DEMO_CLASSES,
  DEMO_EMAIL_DOMAIN,
  DEMO_LOGIN_CODE,
  demoChildOfParent,
  demoChildrenForAccount,
  findDemoAccountByEmail,
  teacherTeachesChild,
} from "../src/lib/contract/demo-accounts.ts";

const DEFAULT_DIR = fileURLToPath(new URL("../../../.planning/shared/examples/", import.meta.url));
const dir = process.env.CONTRACT_EXAMPLES_DIR || DEFAULT_DIR;

const DATASET_FILE = "demo-dataset.json";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const URL_PATTERN = /https?:\/\/[^\s"'<>()]+/gi;
const EMAIL_PATTERN = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+/g;
const TOKEN_PATTERN = /^[A-Za-z0-9._-]+$/;
const EXAMPLE_KEYS = ["description", "method", "route", "path", "auth", "request", "response"];

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

// Key-order-insensitive deep equality for JSON values.
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (isObject(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((k) => [k, canonical(value[k])]),
    );
  }
  return value;
}

function sameJson(a, b) {
  return JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
}

function expectJson(actual, expected, label) {
  if (!sameJson(actual, expected)) {
    fail(`${label} is ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`);
  }
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

// ---------------------------------------------------------------------------
// Contract constants (run once, before any file)
// ---------------------------------------------------------------------------

function checkLabels(values, labels, name) {
  if (!isObject(labels)) fail(`${name} must be an object`);
  sameKeys(labels, values, name);
  for (const v of values) nonBlankString(labels[v], 200, `${name}.${v}`);
}

function checkUnique(values, label) {
  if (new Set(values).size !== values.length) fail(`${label} contains duplicates`);
}

function checkContractConstants() {
  for (const [values, name] of [
    [REPORT_STATES, "REPORT_STATES"],
    [ACCOUNT_ROLES, "ACCOUNT_ROLES"],
    [ACTOR_ROLES, "ACTOR_ROLES"],
    [LOGIN_SCOPES, "LOGIN_SCOPES"],
    [ATTACK_TYPES, "ATTACK_TYPES"],
    [TAKEN_ACTIONS, "TAKEN_ACTIONS"],
    [REPORT_SOURCES, "REPORT_SOURCES"],
    [TRANSITION_ACTIONS, "TRANSITION_ACTIONS"],
    [HISTORY_ACTIONS, "HISTORY_ACTIONS"],
    [API_ERROR_CODES, "API_ERROR_CODES"],
  ]) {
    checkUnique(values, name);
  }
  checkLabels(REPORT_STATES, REPORT_STATE_LABELS_PL, "REPORT_STATE_LABELS_PL");
  checkLabels(ACCOUNT_ROLES, ACCOUNT_ROLE_LABELS_PL, "ACCOUNT_ROLE_LABELS_PL");
  checkLabels(ACTOR_ROLES, ACTOR_ROLE_LABELS_PL, "ACTOR_ROLE_LABELS_PL");
  checkLabels(LOGIN_SCOPES, LOGIN_SCOPE_LABELS_PL, "LOGIN_SCOPE_LABELS_PL");
  checkLabels(ATTACK_TYPES, ATTACK_TYPE_LABELS_PL, "ATTACK_TYPE_LABELS_PL");
  checkLabels(TAKEN_ACTIONS, TAKEN_ACTION_LABELS_PL, "TAKEN_ACTION_LABELS_PL");
  checkLabels(REPORT_SOURCES, REPORT_SOURCE_LABELS_PL, "REPORT_SOURCE_LABELS_PL");
  checkLabels(TRANSITION_ACTIONS, TRANSITION_ACTION_LABELS_PL, "TRANSITION_ACTION_LABELS_PL");
  checkLabels(HISTORY_ACTIONS, HISTORY_ACTION_LABELS_PL, "HISTORY_ACTION_LABELS_PL");
  checkLabels(API_ERROR_CODES, API_ERROR_MESSAGES_PL, "API_ERROR_MESSAGES_PL");

  oneOf(INITIAL_REPORT_STATE, REPORT_STATES, "INITIAL_REPORT_STATE");
  TEACHER_VISIBLE_STATES.forEach((s, i) => oneOf(s, REPORT_STATES, `TEACHER_VISIBLE_STATES[${i}]`));
  if (TEACHER_VISIBLE_STATES.includes(INITIAL_REPORT_STATE)) fail("a teacher must not see a report the parent has not approved");
  for (const a of ACCOUNT_ROLES) oneOf(a, ACTOR_ROLES, "ACCOUNT_ROLES entry");
  if (HISTORY_ACTIONS[0] !== "submit") fail('HISTORY_ACTIONS must start with "submit"');
  sameKeys(Object.fromEntries(HISTORY_ACTIONS.slice(1).map((a) => [a, 1])), TRANSITION_ACTIONS, "HISTORY_ACTIONS after submit");

  // Attack type -> allowed taken actions.
  sameKeys(ACTIONS_BY_ATTACK_TYPE, ATTACK_TYPES, "ACTIONS_BY_ATTACK_TYPE");
  for (const t of ATTACK_TYPES) {
    const list = ACTIONS_BY_ATTACK_TYPE[t];
    if (!Array.isArray(list) || list.length === 0) fail(`ACTIONS_BY_ATTACK_TYPE.${t} must be a non-empty array`);
    let last = -1;
    list.forEach((a, i) => {
      const idx = TAKEN_ACTIONS.indexOf(a);
      if (idx < 0) fail(`ACTIONS_BY_ATTACK_TYPE.${t}[${i}] "${a}" is not a TAKEN_ACTIONS value`);
      if (idx <= last) fail(`ACTIONS_BY_ATTACK_TYPE.${t} is not in canonical TAKEN_ACTIONS order (or has duplicates)`);
      last = idx;
    });
  }

  // Transition matrix.
  if (!Array.isArray(TRANSITIONS) || TRANSITIONS.length === 0) fail("TRANSITIONS must be a non-empty array");
  const fromByAction = new Map();
  TRANSITIONS.forEach((row, i) => {
    const label = `TRANSITIONS[${i}]`;
    if (!isObject(row)) fail(`${label} must be an object`);
    sameKeys(row, ["action", "from", "to", "roles"], label);
    oneOf(row.action, TRANSITION_ACTIONS, `${label}.action`);
    oneOf(row.to, REPORT_STATES, `${label}.to`);
    if (!Array.isArray(row.from) || row.from.length === 0) fail(`${label}.from must be a non-empty array`);
    if (!Array.isArray(row.roles) || row.roles.length === 0) fail(`${label}.roles must be a non-empty array`);
    row.from.forEach((s) => oneOf(s, REPORT_STATES, `${label}.from entry`));
    row.roles.forEach((r) => oneOf(r, ACCOUNT_ROLES, `${label}.roles entry`));
    checkUnique(row.from, `${label}.from`);
    checkUnique(row.roles, `${label}.roles`);
    if (row.from.includes(row.to)) fail(`${label} moves a state onto itself`);
    const seen = fromByAction.get(row.action) ?? new Set();
    for (const s of row.from) {
      if (seen.has(s)) fail(`${label}: two "${row.action}" rows both start from "${s}"`);
      seen.add(s);
    }
    fromByAction.set(row.action, seen);
  });
  for (const a of TRANSITION_ACTIONS) {
    if (!fromByAction.has(a)) fail(`TRANSITION_ACTIONS "${a}" has no TRANSITIONS row`);
  }
  sameKeys(TRANSITION_COMMENT_REQUIRED, TRANSITION_ACTIONS, "TRANSITION_COMMENT_REQUIRED");
  for (const a of TRANSITION_ACTIONS) {
    if (typeof TRANSITION_COMMENT_REQUIRED[a] !== "boolean") fail(`TRANSITION_COMMENT_REQUIRED.${a} must be a boolean`);
  }

  // Errors.
  sameKeys(API_ERROR_HTTP_STATUS, API_ERROR_CODES, "API_ERROR_HTTP_STATUS");
  for (const c of API_ERROR_CODES) {
    const s = API_ERROR_HTTP_STATUS[c];
    if (!Number.isInteger(s) || s < 400 || s > 599) fail(`API_ERROR_HTTP_STATUS.${c} must be a 4xx/5xx integer`);
  }

  // Demo accounts, children and classes (D-14).
  if (!DEMO_EMAIL_DOMAIN.endsWith(".example")) fail('DEMO_EMAIL_DOMAIN must end in ".example"');
  if (typeof DEMO_LOGIN_CODE !== "string" || DEMO_LOGIN_CODE.length > LIMITS.codeMaxChars) fail("DEMO_LOGIN_CODE is invalid");
  checkUnique(DEMO_ACCOUNTS.map((a) => a.id), "DEMO_ACCOUNTS ids");
  checkUnique(DEMO_ACCOUNTS.map((a) => a.email.toLowerCase()), "DEMO_ACCOUNTS emails");
  DEMO_ACCOUNTS.forEach((a, i) => {
    const label = `DEMO_ACCOUNTS[${i}]`;
    sameKeys(a, ACCOUNT_FIELDS, label);
    checkUuid(a.id, `${label}.id`);
    oneOf(a.role, ACCOUNT_ROLES, `${label}.role`);
    nonBlankString(a.display_name, 200, `${label}.display_name`);
    if (!a.email.endsWith(`@${DEMO_EMAIL_DOMAIN}`)) fail(`${label}.email does not end with "@${DEMO_EMAIL_DOMAIN}"`);
    if (a.email !== a.email.trim().toLowerCase()) fail(`${label}.email must be lower case without spaces`);
  });
  checkUnique(DEMO_CLASSES.map((k) => k.id), "DEMO_CLASSES ids");
  DEMO_CLASSES.forEach((k, i) => {
    const label = `DEMO_CLASSES[${i}]`;
    sameKeys(k, ["id", "name", "teacher_id"], label);
    nonBlankString(k.name, 200, `${label}.name`);
    const teacher = DEMO_ACCOUNTS.find((a) => a.id === k.teacher_id);
    if (!teacher || teacher.role !== "teacher") fail(`${label}.teacher_id is not a teacher account`);
  });
  checkUnique(DEMO_CHILDREN.map((c) => c.id), "DEMO_CHILDREN ids");
  DEMO_CHILDREN.forEach((c, i) => {
    const label = `DEMO_CHILDREN[${i}]`;
    sameKeys(c, CHILD_FIELDS, label);
    checkUuid(c.id, `${label}.id`);
    nonBlankString(c.display_name, 200, `${label}.display_name`);
    const parent = DEMO_ACCOUNTS.find((a) => a.id === c.parent_id);
    if (!parent || parent.role !== "parent") fail(`${label}.parent_id is not a parent account`);
    if (!DEMO_CLASSES.some((k) => k.id === c.class_id)) fail(`${label}.class_id is not a demo class`);
    if (DEMO_ACCOUNTS.some((a) => a.id === c.id)) fail(`${label}.id collides with an account id`);
  });
  for (const a of DEMO_ACCOUNTS.filter((x) => x.role === "parent")) {
    const n = DEMO_CHILDREN.filter((c) => c.parent_id === a.id).length;
    if (n !== 1) fail(`parent ${a.email} has ${n} children, expected exactly 1`);
  }
}

// ---------------------------------------------------------------------------
// Privacy guards: URLs and e-mail addresses must use .example domains
// ---------------------------------------------------------------------------

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

function checkEmails(value, label) {
  if (typeof value === "string") {
    for (const raw of value.match(EMAIL_PATTERN) ?? []) {
      const domain = raw.slice(raw.indexOf("@") + 1).replace(/[.-]+$/, "").toLowerCase();
      if (!domain.endsWith(".example")) fail(`${label} contains e-mail "${raw}" whose domain does not end in ".example"`);
    }
  } else if (Array.isArray(value)) {
    value.forEach((item, i) => checkEmails(item, `${label}[${i}]`));
  } else if (isObject(value)) {
    for (const [key, item] of Object.entries(value)) checkEmails(item, `${label}.${key}`);
  }
}

// ---------------------------------------------------------------------------
// Wire objects
// ---------------------------------------------------------------------------

// Taken actions: known values, unique, allowed for the attack type; canonical order when `canonicalOrder`.
function checkTakenActions(list, attackType, label, canonicalOrder) {
  if (!Array.isArray(list)) fail(`${label} must be an array`);
  checkUnique(list, label);
  const allowed = ACTIONS_BY_ATTACK_TYPE[attackType] ?? [];
  list.forEach((a, i) => {
    oneOf(a, TAKEN_ACTIONS, `${label}[${i}]`);
    if (!allowed.includes(a)) fail(`${label}[${i}] "${a}" is not offered for attack type "${attackType}"`);
  });
  if (canonicalOrder && !sameJson(list, sortTakenActions(list))) {
    fail(`${label} is not in canonical TAKEN_ACTIONS order`);
  }
}

function sortTakenActions(list) {
  return [...list].sort((a, b) => TAKEN_ACTIONS.indexOf(a) - TAKEN_ACTIONS.indexOf(b));
}

function checkReport(r, label, extraKeys = []) {
  if (!isObject(r)) fail(`${label} must be an object`);
  sameKeys(r, [...REPORT_FIELDS, ...extraKeys], label);
  checkUuid(r.id, `${label}.id`);
  checkUuid(r.child_id, `${label}.child_id`);
  checkUuid(r.parent_id, `${label}.parent_id`);
  const child = DEMO_CHILDREN.find((c) => c.id === r.child_id);
  if (!child) fail(`${label}.child_id is not a demo child`);
  if (child.parent_id !== r.parent_id) fail(`${label}.child_id does not belong to ${label}.parent_id`);
  oneOf(r.attack_type, ATTACK_TYPES, `${label}.attack_type`);
  checkTakenActions(r.taken_actions, r.attack_type, `${label}.taken_actions`, true);
  oneOf(r.source, REPORT_SOURCES, `${label}.source`);
  nonBlankString(r.content, LIMITS.contentMaxChars, `${label}.content`);
  if (r.content !== r.content.trim()) fail(`${label}.content must be stored trimmed`);
  oneOf(r.state, REPORT_STATES, `${label}.state`);
  checkTimestamp(r.created_at, `${label}.created_at`);
  checkTimestamp(r.updated_at, `${label}.updated_at`);
  if (Date.parse(r.updated_at) < Date.parse(r.created_at)) {
    fail(`${label}.updated_at is earlier than created_at`);
  }
}

function checkAccountInfo(a, label) {
  if (!isObject(a)) fail(`${label} must be an object`);
  sameKeys(a, ACCOUNT_FIELDS, label);
  const demo = DEMO_ACCOUNTS.find((x) => x.id === a.id);
  if (!demo) fail(`${label}.id is not a demo account`);
  expectJson(a, demo, label);
}

function checkChildInfo(c, label) {
  if (!isObject(c)) fail(`${label} must be an object`);
  sameKeys(c, CHILD_FIELDS, label);
  const demo = DEMO_CHILDREN.find((x) => x.id === c.id);
  if (!demo) fail(`${label}.id is not a demo child`);
  expectJson(c, demo, label);
}

function checkHistoryEntry(h, label) {
  if (!isObject(h)) fail(`${label} must be an object`);
  sameKeys(h, HISTORY_FIELDS, label);
  checkUuid(h.id, `${label}.id`);
  checkUuid(h.report_id, `${label}.report_id`);
  oneOf(h.action, HISTORY_ACTIONS, `${label}.action`);
  if (h.from_state !== null) oneOf(h.from_state, REPORT_STATES, `${label}.from_state`);
  oneOf(h.to_state, REPORT_STATES, `${label}.to_state`);
  checkUuid(h.actor_id, `${label}.actor_id`);
  oneOf(h.actor_role, ACTOR_ROLES, `${label}.actor_role`);
  if (h.comment !== null) {
    nonBlankString(h.comment, LIMITS.transitionCommentMaxChars, `${label}.comment`);
    if (h.comment !== h.comment.trim()) fail(`${label}.comment must be stored trimmed`);
  }
  checkTimestamp(h.created_at, `${label}.created_at`);
}

function checkComment(c, label) {
  if (!isObject(c)) fail(`${label} must be an object`);
  sameKeys(c, COMMENT_FIELDS, label);
  checkUuid(c.id, `${label}.id`);
  checkUuid(c.report_id, `${label}.report_id`);
  checkUuid(c.author_id, `${label}.author_id`);
  oneOf(c.author_role, ACCOUNT_ROLES, `${label}.author_role`);
  nonBlankString(c.body, LIMITS.commentMaxChars, `${label}.body`);
  if (c.body !== c.body.trim()) fail(`${label}.body must be stored trimmed`);
  checkTimestamp(c.created_at, `${label}.created_at`);
}

// The TRANSITIONS row that allows `action` from `state`, or null.
function transitionRule(action, state) {
  return TRANSITIONS.find((row) => row.action === action && row.from.includes(state)) ?? null;
}

// An account (parent or teacher) may act on a report: the parent owns it, the teacher teaches the child.
function isLinkedAccount(accountId, role, report) {
  if (role === "parent") return accountId === report.parent_id;
  if (role === "teacher") return teacherTeachesChild(accountId, report.child_id);
  return false;
}

// History must replay the transition matrix from "submit" to the report's current state (D-08, D-09, D-10).
function checkTimeline(report, history, comments, label) {
  if (history.length === 0) fail(`${label} has no history`);
  const first = history[0];
  if (first.action !== "submit") fail(`${label} history must start with "submit"`);
  if (first.from_state !== null || first.to_state !== INITIAL_REPORT_STATE) {
    fail(`${label} submit entry must go from null to "${INITIAL_REPORT_STATE}"`);
  }
  if (first.actor_id !== report.child_id || first.actor_role !== "child") fail(`${label} submit entry actor must be the child`);
  if (first.comment !== null) fail(`${label} submit entry comment must be null`);
  if (first.created_at !== report.created_at) fail(`${label} submit entry created_at must equal the report created_at`);
  for (let i = 1; i < history.length; i++) {
    const prev = history[i - 1];
    const e = history[i];
    const where = `${label} history[${i}]`;
    if (e.action === "submit") fail(`${where} repeats "submit"`);
    if (e.from_state !== prev.to_state) fail(`${where}.from_state "${e.from_state}" does not follow "${prev.to_state}"`);
    const rule = transitionRule(e.action, e.from_state);
    if (!rule) fail(`${where}: "${e.action}" is not allowed from "${e.from_state}"`);
    if (e.to_state !== rule.to) fail(`${where}.to_state is "${e.to_state}", expected "${rule.to}"`);
    if (!rule.roles.includes(e.actor_role)) fail(`${where}: role "${e.actor_role}" may not "${e.action}"`);
    if (!isLinkedAccount(e.actor_id, e.actor_role, report)) fail(`${where}: actor is not linked to this report`);
    if (TRANSITION_COMMENT_REQUIRED[e.action] && e.comment === null) fail(`${where}: "${e.action}" requires a comment`);
    if (e.created_at < prev.created_at) fail(`${where}.created_at is earlier than the previous entry`);
  }
  const last = history[history.length - 1];
  if (last.to_state !== report.state) fail(`${label} history ends in "${last.to_state}" but the report state is "${report.state}"`);
  if (last.created_at !== report.updated_at) fail(`${label} updated_at must equal the last history entry created_at`);
  comments.forEach((c, i) => {
    const where = `${label} comments[${i}]`;
    if (!isLinkedAccount(c.author_id, c.author_role, report)) fail(`${where}: author is not linked to this report`);
    if (c.created_at < report.created_at) fail(`${where}.created_at is earlier than the report`);
    if (i > 0 && c.created_at < comments[i - 1].created_at) fail(`${where}.created_at is earlier than the previous comment`);
  });
}

// Visibility reference rule (D-11, D-15).
function canView(account, report) {
  if (account.role === "parent") return report.parent_id === account.id;
  if (account.role === "teacher") {
    return teacherTeachesChild(account.id, report.child_id) && TEACHER_VISIBLE_STATES.includes(report.state);
  }
  return false;
}

// Server's exact cursor encoding; clients treat it as opaque.
function encodeCursor(report) {
  return Buffer.from(JSON.stringify({ c: report.created_at, i: report.id })).toString("base64url");
}

function decodeCursor(value, label) {
  let parsed;
  try {
    parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
  } catch {
    fail(`${label} is not a valid cursor`);
  }
  if (!isObject(parsed)) fail(`${label} is not a valid cursor`);
  sameKeys(parsed, ["c", "i"], `${label} (decoded)`);
  checkTimestamp(parsed.c, `${label}.c`);
  checkUuid(parsed.i, `${label}.i`);
  if (encodeCursor({ created_at: parsed.c, id: parsed.i }) !== value) fail(`${label} is not in canonical encoding`);
  return parsed;
}

// List order: created_at desc, then id desc.
function newestFirst(a, b) {
  if (a.created_at !== b.created_at) return a.created_at < b.created_at ? 1 : -1;
  return a.id < b.id ? 1 : a.id > b.id ? -1 : 0;
}

// What GET /api/reports must return for `account` and the query (D-15, D-16).
function expectedList(account, query) {
  const limit = query.limit ?? LIMITS.pageDefault;
  let rows = requireDataset()
    .reports.filter((r) => canView(account, r))
    .filter((r) => query.state === undefined || r.state === query.state)
    .sort(newestFirst);
  if (query.cursor !== undefined) {
    const { c, i } = query.cursor;
    rows = rows.filter((r) => r.created_at < c || (r.created_at === c && r.id < i));
  }
  const page = rows.slice(0, limit);
  return { reports: page, next_cursor: rows.length > limit ? encodeCursor(page[page.length - 1]) : null };
}

// ---------------------------------------------------------------------------
// demo-dataset.json (checked first; kept for the route checkers)
// ---------------------------------------------------------------------------

let DATASET = null;

function requireDataset() {
  if (!DATASET) fail("demo-dataset.json is required (missing or invalid)");
  return DATASET;
}

function checkDatasetFile(doc) {
  sameKeys(doc, ["description", "dataset"], "file");
  nonBlankString(doc.description, 1000, "description");
  if (!isObject(doc.dataset)) fail("dataset must be an object");
  sameKeys(doc.dataset, ["reports", "history", "comments"], "dataset");
  const { reports, history, comments } = doc.dataset;
  for (const [list, name] of [
    [reports, "reports"],
    [history, "history"],
    [comments, "comments"],
  ]) {
    if (!Array.isArray(list)) fail(`dataset.${name} must be an array`);
  }
  if (reports.length === 0) fail("dataset.reports must not be empty");
  reports.forEach((r, i) => checkReport(r, `dataset.reports[${i}]`));
  history.forEach((h, i) => checkHistoryEntry(h, `dataset.history[${i}]`));
  comments.forEach((c, i) => checkComment(c, `dataset.comments[${i}]`));
  checkUnique([...reports, ...history, ...comments].map((x) => x.id), "dataset ids");
  const reportIds = new Set(reports.map((r) => r.id));
  history.forEach((h, i) => {
    if (!reportIds.has(h.report_id)) fail(`dataset.history[${i}].report_id is not a dataset report`);
  });
  comments.forEach((c, i) => {
    if (!reportIds.has(c.report_id)) fail(`dataset.comments[${i}].report_id is not a dataset report`);
  });
  for (const r of reports) {
    checkTimeline(
      r,
      history.filter((h) => h.report_id === r.id),
      comments.filter((c) => c.report_id === r.id),
      `report ${r.id}`,
    );
  }
  DATASET = { reports, history, comments, ids: new Set([...reportIds, ...history.map((h) => h.id), ...comments.map((c) => c.id)]) };
}

function datasetReport(id) {
  return requireDataset().reports.find((r) => r.id === id) ?? null;
}

function datasetDetail(report) {
  const { history, comments } = requireDataset();
  return {
    ...report,
    history: history.filter((h) => h.report_id === report.id),
    comments: comments.filter((c) => c.report_id === report.id),
  };
}

// The example's `auth` says who calls: null (no token) or { email, scope } of a demo account.
// Examples never store a real token. Returns { account, scope } or null.
function authAccount(ex) {
  if (ex.auth === null) return null;
  if (!isObject(ex.auth)) fail("auth must be null or an object");
  sameKeys(ex.auth, ["email", "scope"], "auth");
  oneOf(ex.auth.scope, LOGIN_SCOPES, "auth.scope");
  const account = typeof ex.auth.email === "string" ? findDemoAccountByEmail(ex.auth.email) : null;
  if (!account) fail(`auth.email "${ex.auth.email}" is not a demo account`);
  if (ex.auth.email !== account.email) fail("auth.email must be written exactly as in DEMO_ACCOUNTS");
  if (ex.auth.scope === "extension" && account.role !== "parent") fail("only a parent account can hold the extension scope");
  return { account, scope: ex.auth.scope };
}

function requireAuth(ex) {
  const auth = authAccount(ex);
  if (!auth) fail("this route requires auth (Authorization: Bearer <token>)");
  return auth;
}

function requireNoAuth(ex) {
  if (authAccount(ex) !== null) fail("this route takes no auth; auth must be null");
}

function requireNullRequest(ex) {
  if (ex.request !== null) fail("request must be null");
}

function checkKeysWithin(obj, allowed, label) {
  for (const key of Object.keys(obj)) {
    if (!allowed.includes(key)) fail(`${label} has unexpected key "${key}"`);
  }
}

// ---------------------------------------------------------------------------
// Route checkers
// ---------------------------------------------------------------------------

const routeCheckers = {
  "POST /api/auth/login"(ex) {
    matchPath(ex.route, ex.path);
    requireNoAuth(ex);
    const req = ex.request;
    if (!isObject(req)) fail("request must be an object");
    checkKeysWithin(req, ["email", "code", "scope"], "request");
    nonBlankString(req.email, LIMITS.emailMaxChars, "request.email");
    nonBlankString(req.code, LIMITS.codeMaxChars, "request.code");
    if (req.code !== DEMO_LOGIN_CODE) fail(`request.code must be the demo code "${DEMO_LOGIN_CODE}" for a successful login`);
    const account = findDemoAccountByEmail(req.email);
    if (!account) fail(`request.email "${req.email}" is not a demo account`);
    if ("scope" in req) oneOf(req.scope, LOGIN_SCOPES, "request.scope");
    const scope = req.scope ?? "panel";
    if (scope === "extension" && account.role !== "parent") fail("only a parent can log in with the extension scope");
    expectStatus(ex.response, 200);
    const body = ex.response.body;
    if (!isObject(body)) fail("response.body must be an object");
    sameKeys(body, ["token", "expires_at", "scope", "account", "children"], "response.body");
    if (typeof body.token !== "string" || !TOKEN_PATTERN.test(body.token)) fail("response.body.token must match [A-Za-z0-9._-]+");
    checkTimestamp(body.expires_at, "response.body.expires_at");
    if (body.scope !== scope) fail(`response.body.scope is "${body.scope}", expected "${scope}"`);
    checkAccountInfo(body.account, "response.body.account");
    if (body.account.id !== account.id) fail("response.body.account is not the account that logged in");
    if (!Array.isArray(body.children)) fail("response.body.children must be an array");
    body.children.forEach((c, i) => checkChildInfo(c, `response.body.children[${i}]`));
    expectJson(body.children, demoChildrenForAccount(account), "response.body.children");
  },

  "POST /api/reports"(ex) {
    matchPath(ex.route, ex.path);
    const { account } = requireAuth(ex);
    if (account.role !== "parent") fail("only a parent account (panel or extension scope) can create a report");
    const req = ex.request;
    if (!isObject(req)) fail("request must be an object");
    checkKeysWithin(req, ["attack_type", "taken_actions", "source", "content"], "request");
    oneOf(req.attack_type, ATTACK_TYPES, "request.attack_type");
    if ("taken_actions" in req) checkTakenActions(req.taken_actions, req.attack_type, "request.taken_actions", false);
    oneOf(req.source, REPORT_SOURCES, "request.source");
    nonBlankString(req.content, LIMITS.contentMaxChars, "request.content");
    expectStatus(ex.response, 201);
    const r = ex.response.body;
    checkReport(r, "response.body");
    const child = demoChildOfParent(account.id);
    const expected = {
      child_id: child.id,
      parent_id: account.id,
      attack_type: req.attack_type,
      taken_actions: sortTakenActions(req.taken_actions ?? []),
      source: req.source,
      content: req.content.trim(),
      state: INITIAL_REPORT_STATE,
    };
    for (const [key, value] of Object.entries(expected)) {
      expectJson(r[key], value, `response.body.${key}`);
    }
    if (r.created_at !== r.updated_at) fail("a new report must have updated_at equal to created_at");
    if (DATASET && DATASET.ids.has(r.id)) fail("response.body.id must be a new id, not one from demo-dataset.json");
  },

  "GET /api/auth/me"(ex) {
    matchPath(ex.route, ex.path);
    const { account, scope } = requireAuth(ex);
    requireNullRequest(ex);
    expectStatus(ex.response, 200);
    const body = ex.response.body;
    if (!isObject(body)) fail("response.body must be an object");
    sameKeys(body, ["expires_at", "scope", "account", "children"], "response.body");
    checkTimestamp(body.expires_at, "response.body.expires_at");
    if (body.scope !== scope) fail(`response.body.scope is "${body.scope}", expected the token scope "${scope}"`);
    checkAccountInfo(body.account, "response.body.account");
    if (body.account.id !== account.id) fail("response.body.account is not the logged-in account");
    if (!Array.isArray(body.children)) fail("response.body.children must be an array");
    body.children.forEach((c, i) => checkChildInfo(c, `response.body.children[${i}]`));
    expectJson(body.children, demoChildrenForAccount(account), "response.body.children");
  },

  "GET /api/reports"(ex) {
    const { query } = matchPath(ex.route, ex.path);
    const { account } = requireAuth(ex);
    requireNullRequest(ex);
    const parsed = {};
    for (const key of new Set(query.keys())) {
      if (!["limit", "cursor", "state"].includes(key)) fail(`unknown query parameter "${key}"`);
      if (query.getAll(key).length !== 1) fail(`query parameter "${key}" appears more than once`);
    }
    if (query.has("limit")) {
      const raw = query.get("limit");
      if (!/^[0-9]+$/.test(raw)) fail(`query limit "${raw}" is not an integer`);
      const n = Number(raw);
      if (n < 1 || n > LIMITS.pageMax) fail(`query limit must be 1..${LIMITS.pageMax}`);
      parsed.limit = n;
    }
    if (query.has("cursor")) parsed.cursor = decodeCursor(query.get("cursor"), "query cursor");
    if (query.has("state")) {
      oneOf(query.get("state"), REPORT_STATES, "query state");
      parsed.state = query.get("state");
    }
    expectStatus(ex.response, 200);
    const body = ex.response.body;
    if (!isObject(body)) fail("response.body must be an object");
    sameKeys(body, ["reports", "next_cursor"], "response.body");
    if (!Array.isArray(body.reports)) fail("response.body.reports must be an array");
    body.reports.forEach((r, i) => checkReport(r, `response.body.reports[${i}]`));
    if (body.next_cursor !== null) decodeCursor(body.next_cursor, "response.body.next_cursor");
    const expected = expectedList(account, parsed);
    const got = body.reports.map((r) => r.id).join(", ");
    const want = expected.reports.map((r) => r.id).join(", ");
    if (got !== want) fail(`response.body.reports are [${got}], expected [${want}] for ${account.email}`);
    expectJson(body, expected, "response.body");
  },

  "GET /api/reports/{id}"(ex) {
    const { params } = matchPath(ex.route, ex.path);
    const { account, scope } = requireAuth(ex);
    if (scope !== "panel") fail("report details need the panel scope; the extension scope never sees history or comments");
    requireNullRequest(ex);
    checkUuid(params.id, "path id");
    const report = datasetReport(params.id);
    if (!report) fail("path id is not a demo-dataset.json report (the server would answer 404)");
    if (!canView(account, report)) fail(`${account.email} cannot view this report (the server would answer 404)`);
    expectStatus(ex.response, 200);
    const body = ex.response.body;
    checkReport(body, "response.body", ["history", "comments"]);
    if (!Array.isArray(body.history)) fail("response.body.history must be an array");
    if (!Array.isArray(body.comments)) fail("response.body.comments must be an array");
    body.history.forEach((h, i) => checkHistoryEntry(h, `response.body.history[${i}]`));
    body.comments.forEach((c, i) => checkComment(c, `response.body.comments[${i}]`));
    expectJson(body, datasetDetail(report), "response.body");
  },

  "POST /api/reports/{id}/transitions"(ex) {
    const { params } = matchPath(ex.route, ex.path);
    const { account, scope } = requireAuth(ex);
    if (scope !== "panel") fail("transitions need the panel scope");
    checkUuid(params.id, "path id");
    const report = datasetReport(params.id);
    if (!report) fail("path id is not a demo-dataset.json report (the server would answer 404)");
    if (!canView(account, report)) fail(`${account.email} cannot view this report (the server would answer 404)`);
    const req = ex.request;
    if (!isObject(req)) fail("request must be an object");
    checkKeysWithin(req, ["action", "comment"], "request");
    oneOf(req.action, TRANSITION_ACTIONS, "request.action");
    const hasComment = req.comment !== undefined && req.comment !== null;
    if (hasComment) nonBlankString(req.comment, LIMITS.transitionCommentMaxChars, "request.comment");
    if (TRANSITION_COMMENT_REQUIRED[req.action] && !hasComment) {
      fail(`"${req.action}" requires a comment (the server would answer 400 validation_error)`);
    }
    if (!TRANSITIONS.some((row) => row.action === req.action && row.roles.includes(account.role))) {
      fail(`role "${account.role}" may never "${req.action}" (the server would answer 403 forbidden)`);
    }
    const rule = transitionRule(req.action, report.state);
    if (!rule || !rule.roles.includes(account.role)) {
      fail(`"${req.action}" is not allowed from "${report.state}" for role "${account.role}" (the server would answer 409 invalid_transition)`);
    }
    expectStatus(ex.response, 201);
    const body = ex.response.body;
    if (!isObject(body)) fail("response.body must be an object");
    sameKeys(body, ["report", "entry"], "response.body");
    const entry = body.entry;
    checkHistoryEntry(entry, "response.body.entry");
    if (requireDataset().ids.has(entry.id)) fail("response.body.entry.id must be a new id, not one from demo-dataset.json");
    expectJson(
      { ...entry, id: null, created_at: null },
      {
        id: null,
        report_id: report.id,
        action: req.action,
        from_state: report.state,
        to_state: rule.to,
        actor_id: account.id,
        actor_role: account.role,
        comment: hasComment ? req.comment.trim() : null,
        created_at: null,
      },
      "response.body.entry (without id and created_at)",
    );
    if (entry.created_at <= report.updated_at) fail("response.body.entry.created_at must be later than the report updated_at");
    checkReport(body.report, "response.body.report");
    expectJson(body.report, { ...report, state: rule.to, updated_at: entry.created_at }, "response.body.report");
  },

  "POST /api/reports/{id}/comments"(ex) {
    const { params } = matchPath(ex.route, ex.path);
    const { account, scope } = requireAuth(ex);
    if (scope !== "panel") fail("comments need the panel scope; the extension scope never sees the thread");
    checkUuid(params.id, "path id");
    const report = datasetReport(params.id);
    if (!report) fail("path id is not a demo-dataset.json report (the server would answer 404)");
    if (!canView(account, report)) fail(`${account.email} cannot view this report (the server would answer 404)`);
    const req = ex.request;
    if (!isObject(req)) fail("request must be an object");
    sameKeys(req, ["body"], "request");
    nonBlankString(req.body, LIMITS.commentMaxChars, "request.body");
    expectStatus(ex.response, 201);
    const c = ex.response.body;
    checkComment(c, "response.body");
    if (requireDataset().ids.has(c.id)) fail("response.body.id must be a new id, not one from demo-dataset.json");
    expectJson(
      { report_id: c.report_id, author_id: c.author_id, author_role: c.author_role, body: c.body },
      { report_id: report.id, author_id: account.id, author_role: account.role, body: req.body.trim() },
      "response.body",
    );
    if (c.created_at <= report.created_at) fail("response.body.created_at must be later than the report created_at");
  },

  "GET /api/health"(ex) {
    matchPath(ex.route, ex.path);
    requireNoAuth(ex);
    requireNullRequest(ex);
    expectStatus(ex.response, 200);
    const body = ex.response.body;
    if (!isObject(body)) fail("response.body must be an object");
    sameKeys(body, ["status"], "response.body");
    if (body.status !== "ok") fail('response.body.status must be "ok"');
  },
};

// ---------------------------------------------------------------------------
// errors.json
// ---------------------------------------------------------------------------

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
    if (entry.status !== API_ERROR_HTTP_STATUS[entry.code]) {
      fail(`${label}.status is ${entry.status}, expected ${API_ERROR_HTTP_STATUS[entry.code]} for ${entry.code}`);
    }
    nonBlankString(entry.when, 1000, `${label}.when`);
    if (!isObject(entry.body)) fail(`${label}.body must be an object`);
    sameKeys(entry.body, ["error"], `${label}.body`);
    const err = entry.body.error;
    if (!isObject(err)) fail(`${label}.body.error must be an object`);
    const allowed = entry.code === "validation_error" ? ["code", "message", "details"] : ["code", "message"];
    checkKeysWithin(err, allowed, `${label}.body.error`);
    if (err.code !== entry.code) fail(`${label}.body.error.code does not equal ${label}.code`);
    if (err.message !== API_ERROR_MESSAGES_PL[entry.code]) {
      fail(`${label}.body.error.message differs from API_ERROR_MESSAGES_PL.${entry.code}`);
    }
    if (entry.code === "validation_error" && !("details" in err)) fail(`${label}.body.error.details is required for validation_error`);
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
  const missing = API_ERROR_CODES.filter((code) => !seen.has(code));
  if (missing.length > 0) fail(`errors must cover every API_ERROR_CODES value; missing: ${missing.join(", ")}`);
}

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

function checkFile(path, name) {
  let doc;
  try {
    doc = JSON.parse(readFileSync(path, "utf8"));
  } catch (e) {
    fail(`invalid JSON (${e.message})`);
  }
  if (!isObject(doc)) fail("top level must be an object");
  checkUrls(doc, "file");
  checkEmails(doc, "file");
  if (name === DATASET_FILE) {
    checkDatasetFile(doc);
    return;
  }
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

try {
  checkContractConstants();
} catch (e) {
  const reason = e instanceof CheckError ? e.message : `unexpected error: ${e.stack ?? e}`;
  console.log(`FAIL contract constants: ${reason}`);
  process.exit(1);
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

// The demo dataset is checked first: route checkers that read stored data compare against it.
if (existsSync(join(dir, DATASET_FILE))) {
  files = [DATASET_FILE, ...files.filter((name) => name !== DATASET_FILE)];
}

let failed = 0;
for (const name of files) {
  try {
    checkFile(join(dir, name), name);
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
