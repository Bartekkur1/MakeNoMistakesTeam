#!/usr/bin/env node
// Live smoke test of the reports API (plan 01-06) against any base URL.
//
//   SMOKE_BASE_URL   base URL of the backend (default http://localhost:3000)
//   SMOKE_VERIFY_ID  persistence mode: only check that this report survived a restart
//
// Node built-ins and global fetch only. Never reads env files and never prints tokens,
// headers or stack traces. Writes only with the smoke accounts (rodzic.test / nauczyciel.test,
// class-test); the steps with other accounts are read-only.
//
// Output: one "PASS <step>" or "FAIL <step>: <reason>" line per step, stopping at the first
// failure, then "SMOKE OK (<base>)" (exit 0) or "SMOKE FAILED (<base>)" (exit 1). Persistence
// mode ends with "PERSIST OK <id>" (exit 0) or "PERSIST FAILED <id>: <reason>" (exit 1).

const TIMEOUT_MS = 10_000;
const CODE = "0000";

const SMOKE_PARENT = "rodzic.test@bezpiecznaaura.example";
const SMOKE_TEACHER = "nauczyciel.test@bezpiecznaaura.example";
const OTHER_PARENT = "rodzic.ola@bezpiecznaaura.example";

const SEED_IDS = [
  "00000000-0000-4000-8000-0000000d0001",
  "00000000-0000-4000-8000-0000000d0002",
  "00000000-0000-4000-8000-0000000d0003",
];

const EXPECTED_HISTORY = ["submit", "approve", "escalate", "close", "reopen", "close"];

const BASE = (process.env.SMOKE_BASE_URL || "http://localhost:3000").trim().replace(/\/+$/, "");
const VERIFY_ID = (process.env.SMOKE_VERIFY_ID || "").trim();

// A failed expectation. The message is already a short, safe reason.
class StepFailure extends Error {
  constructor(reason) {
    super(reason);
    this.name = "StepFailure";
  }
}

function describeNetworkError(err) {
  const cause = err && typeof err === "object" ? err.cause : undefined;
  const code = cause && typeof cause === "object" && typeof cause.code === "string" ? cause.code : undefined;
  const name = err && typeof err === "object" && typeof err.name === "string" ? err.name : typeof err;
  return `backend unreachable (${code || name})`;
}

// One HTTP call. Resolves to { status, headers, body } (body is parsed JSON or null).
// Network errors and timeouts become a StepFailure with "backend unreachable (...)".
async function call(method, path, { token, body, headers } = {}) {
  const requestHeaders = { ...(headers || {}) };
  if (token) requestHeaders.Authorization = `Bearer ${token}`;
  if (body !== undefined) requestHeaders["Content-Type"] = "application/json";

  let response;
  try {
    response = await fetch(`${BASE}${path}`, {
      method,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    throw new StepFailure(describeNetworkError(err));
  }

  let text;
  try {
    text = await response.text();
  } catch (err) {
    throw new StepFailure(describeNetworkError(err));
  }
  let parsed = null;
  if (text !== "") {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }
  }
  return { status: response.status, headers: response.headers, body: parsed };
}

function errorCode(res) {
  const error = res.body && typeof res.body === "object" ? res.body.error : undefined;
  return error && typeof error === "object" && typeof error.code === "string" ? error.code : undefined;
}

// Unexpected status: "<status> <error.code>" when the body is a contract error, else a short text.
function unexpected(res, expected) {
  const code = errorCode(res);
  if (code) return new StepFailure(`${res.status} ${code}`);
  return new StepFailure(`unexpected status ${res.status} (expected ${expected})`);
}

function expectStatus(res, status) {
  if (res.status !== status) throw unexpected(res, status);
}

function expectError(res, status, code) {
  if (res.status !== status || errorCode(res) !== code) {
    const got = errorCode(res);
    throw new StepFailure(`expected ${status} ${code}, got ${res.status}${got ? ` ${got}` : ""}`);
  }
}

function check(condition, reason) {
  if (!condition) throw new StepFailure(reason);
}

async function login(email, scope) {
  const res = await call("POST", "/api/auth/login", { body: { email, code: CODE, scope } });
  expectStatus(res, 200);
  const token = res.body && typeof res.body.token === "string" ? res.body.token : "";
  check(token !== "", "login response has no token");
  return token;
}

function transition(id, token, action, comment) {
  const body = comment === undefined ? { action } : { action, comment };
  return call("POST", `/api/reports/${encodeURIComponent(id)}/transitions`, { token, body });
}

function expectState(res, state) {
  expectStatus(res, 201);
  const report = res.body && typeof res.body === "object" ? res.body.report : undefined;
  const got = report && typeof report.state === "string" ? report.state : "missing";
  check(got === state, `report state ${got}, expected ${state}`);
}

function reportIds(res) {
  const reports = res.body && Array.isArray(res.body.reports) ? res.body.reports : null;
  check(reports !== null, "response has no reports list");
  return reports.map((report) => (report && typeof report.id === "string" ? report.id : ""));
}

async function health() {
  const res = await call("GET", "/api/health");
  expectStatus(res, 200);
  check(res.body && res.body.status === "ok", 'health body is not {"status":"ok"}');
}

let currentStep = "start";

async function step(name, fn) {
  currentStep = name;
  const label = await fn();
  console.log(label ? `PASS ${name} ${label}` : `PASS ${name}`);
}

async function runSmoke() {
  const state = { id: "", extension: "", parent: "", teacher: "", other: "" };

  await step("health", health);

  await step("cors-preflight", async () => {
    const res = await call("OPTIONS", "/api/reports", {
      headers: {
        Origin: "chrome-extension://smoke-test",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "authorization, content-type",
      },
    });
    expectStatus(res, 204);
    const origin = res.headers.get("access-control-allow-origin") || "";
    const allowHeaders = (res.headers.get("access-control-allow-headers") || "").toLowerCase();
    const allowMethods = (res.headers.get("access-control-allow-methods") || "").toUpperCase();
    check(origin === "*", "access-control-allow-origin is not *");
    check(allowHeaders.includes("authorization"), "access-control-allow-headers lacks authorization");
    check(allowMethods.split(/[\s,]+/).includes("POST"), "access-control-allow-methods lacks POST");
  });

  await step("login-wrong-code", async () => {
    const res = await call("POST", "/api/auth/login", {
      body: { email: SMOKE_PARENT, code: "1234", scope: "panel" },
    });
    expectError(res, 401, "invalid_credentials");
  });

  await step("no-token", async () => {
    const res = await call("GET", "/api/reports");
    expectError(res, 401, "unauthorized");
  });

  await step("login-extension", async () => {
    state.extension = await login(SMOKE_PARENT, "extension");
  });

  // The only report-creating request: always with the rodzic.test extension token.
  await step("create-report", async () => {
    const res = await call("POST", "/api/reports", {
      token: state.extension,
      body: {
        attack_type: "phishing",
        taken_actions: ["clicked_link"],
        source: "other",
        content: "Test dymny (smoke) - fikcyjna treść, można usunąć.",
      },
    });
    expectStatus(res, 201);
    const id = res.body && typeof res.body.id === "string" ? res.body.id : "";
    check(id !== "", "created report has no id");
    check(res.body.state === "pending_parent", `report state ${res.body.state}, expected pending_parent`);
    state.id = id;
    return id;
  });

  const reportPath = () => `/api/reports/${encodeURIComponent(state.id)}`;

  await step("extension-detail-forbidden", async () => {
    const res = await call("GET", reportPath(), { token: state.extension });
    expectError(res, 403, "forbidden");
  });

  await step("login-parent", async () => {
    state.parent = await login(SMOKE_PARENT, "panel");
  });

  await step("list-parent", async () => {
    const res = await call("GET", "/api/reports?limit=5", { token: state.parent });
    expectStatus(res, 200);
    check(reportIds(res).includes(state.id), "new report missing from the parent's list");
  });

  await step("bad-limit", async () => {
    const res = await call("GET", "/api/reports?limit=0", { token: state.parent });
    expectError(res, 400, "validation_error");
  });

  await step("login-teacher", async () => {
    state.teacher = await login(SMOKE_TEACHER, "panel");
  });

  await step("teacher-hidden", async () => {
    const res = await call("GET", reportPath(), { token: state.teacher });
    expectError(res, 404, "report_not_found");
  });

  await step("approve", async () => {
    expectState(await transition(state.id, state.parent, "approve"), "with_teacher");
  });

  await step("teacher-forbidden", async () => {
    expectError(await transition(state.id, state.teacher, "approve"), 403, "forbidden");
  });

  await step("teacher-comment", async () => {
    const res = await call("POST", `${reportPath()}/comments`, {
      token: state.teacher,
      body: { body: "Komentarz testowy (smoke)." },
    });
    expectStatus(res, 201);
  });

  await step("escalate-no-comment", async () => {
    expectError(await transition(state.id, state.teacher, "escalate"), 400, "validation_error");
  });

  await step("escalate", async () => {
    const res = await transition(state.id, state.teacher, "escalate", "Test dymny: eskalacja na niby (smoke).");
    expectState(res, "escalated");
  });

  await step("close", async () => {
    expectState(await transition(state.id, state.teacher, "close"), "closed");
  });

  await step("stale-approve", async () => {
    expectError(await transition(state.id, state.parent, "approve"), 409, "invalid_transition");
  });

  await step("reopen", async () => {
    expectState(await transition(state.id, state.parent, "reopen"), "with_teacher");
  });

  await step("close-again", async () => {
    expectState(await transition(state.id, state.teacher, "close"), "closed");
  });

  await step("final-detail", async () => {
    const res = await call("GET", reportPath(), { token: state.parent });
    expectStatus(res, 200);
    const history = res.body && Array.isArray(res.body.history) ? res.body.history : null;
    const comments = res.body && Array.isArray(res.body.comments) ? res.body.comments : null;
    check(history !== null, "detail has no history");
    check(comments !== null, "detail has no comments");
    const actions = history.map((entry) => (entry && typeof entry.action === "string" ? entry.action : "?"));
    check(
      actions.join(",") === EXPECTED_HISTORY.join(","),
      `history [${actions.join(", ")}], expected [${EXPECTED_HISTORY.join(", ")}]`,
    );
    check(comments.length === 1, `${comments.length} comments, expected 1`);
  });

  // Read-only from here on: another parent's account.
  await step("other-parent-hidden", async () => {
    state.other = await login(OTHER_PARENT, "panel");
    const res = await call("GET", reportPath(), { token: state.other });
    expectError(res, 404, "report_not_found");
  });

  await step("seed-present", async () => {
    const res = await call("GET", "/api/reports?limit=100", { token: state.other });
    expectStatus(res, 200);
    const ids = reportIds(res);
    const missing = SEED_IDS.filter((id) => !ids.includes(id));
    check(missing.length === 0, `seed reports missing: ${missing.join(", ")} (run seed.sql)`);
  });
}

async function runPersist(id) {
  await step("health", health);

  let token = "";
  await step("login-parent", async () => {
    token = await login(SMOKE_PARENT, "panel");
  });

  await step("persisted-detail", async () => {
    const res = await call("GET", `/api/reports/${encodeURIComponent(id)}`, { token });
    expectStatus(res, 200);
    const body = res.body && typeof res.body === "object" ? res.body : {};
    const history = Array.isArray(body.history) ? body.history : [];
    const comments = Array.isArray(body.comments) ? body.comments : [];
    check(body.state === "closed", `report state ${body.state}, expected closed`);
    check(history.length === EXPECTED_HISTORY.length, `${history.length} history entries, expected 6`);
    check(comments.length === 1, `${comments.length} comments, expected 1`);
  });
}

function reasonOf(err) {
  if (err instanceof StepFailure) return err.message;
  const name = err && typeof err === "object" && typeof err.name === "string" ? err.name : typeof err;
  return `unexpected error (${name})`;
}

function reportFailure(err) {
  const reason = reasonOf(err);
  console.log(`FAIL ${currentStep}: ${reason}`);
  if (VERIFY_ID) {
    console.log(`PERSIST FAILED ${VERIFY_ID}: ${reason}`);
  } else {
    console.log(`SMOKE FAILED (${BASE})`);
  }
  process.exitCode = 1;
}

// Last resort: never let Node print a stack trace.
let reported = false;
function fatal(err) {
  if (reported) return;
  reported = true;
  reportFailure(err);
  process.exit(1);
}
process.on("uncaughtException", fatal);
process.on("unhandledRejection", fatal);

async function main() {
  try {
    new URL(BASE);
  } catch {
    currentStep = "config";
    throw new StepFailure("SMOKE_BASE_URL is not a valid URL");
  }

  if (VERIFY_ID) {
    await runPersist(VERIFY_ID);
    console.log(`PERSIST OK ${VERIFY_ID}`);
  } else {
    await runSmoke();
    console.log(`SMOKE OK (${BASE})`);
  }
}

main().then(
  () => {
    process.exitCode = 0;
  },
  (err) => {
    reported = true;
    reportFailure(err);
  },
);
