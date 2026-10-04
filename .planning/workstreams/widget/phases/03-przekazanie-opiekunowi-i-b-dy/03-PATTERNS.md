# Phase 03: Przekazanie opiekunowi i błędy — Pattern Map

**Mapped:** 2026-10-04
**Workstream:** widget
**Files analyzed:** 21 implementation/documentation touch points (15 existing files, 6 proposed new files), plus 13 existing test/harness files affected or conditionally affected.
**Analogs found:** 20 / 21 (15 exact structural matches, 5 role matches, 1 file without a complete analog).

## Scope and precedence

Derived from `03-CONTEXT.md` D-00…D-16 and `03-UI-SPEC.md`; research was deliberately skipped. New filenames below are recommendations, not already-created files. The simplest mapped layout keeps API/session logic in `src/background/sw.js`, adds one local contract module and one vanilla options page, and retains the current content/store/panel separation. If the planner splits API/session into extra worker-only modules, classify those extra files separately; they inherit the worker analogs below.

D-00 preserves contract v2. D-01 supersedes the earlier widget requirement that approval immediately sends content/results: `Zatwierdzam` starts local checking, `Pokaż opiekunowi` opens a review, and only `Wyślij` performs POST. D-10 supersedes the web-app session-expiry behavior: extension silently logs in again instead of redirecting on normal expiry. D-14 child-friendly status strings supersede adult status labels only at the widget presentation layer, never the wire enums.

Required documents and the canonical references in CONTEXT were read, including API examples, web-app decisions/security AR-01 and widget Phase 01/02 decisions/UI. No root `CLAUDE.md`/`AGENTS.md`, `.claude/skills/` or `.agents/skills/` directory was present. Every existing analog named below was checked with read-only `git ls-files -- <path>` and is tracked source. No runtime/install mirrors or generated `dist` files are analogs.

## File Classification

Paths under `projects/web-app/` and `assets/` in the analog column are read-only sources to copy/adapt; they are not phase implementation targets.

| New/Modified File | Change | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|---|
| `projects/widget/manifest.json` | modify | config | event-driven | same file, 9–11 | exact |
| `projects/widget/build.mjs` | modify | utility | file-I/O → batch | same file, 5–12, 31–42 | exact |
| `projects/widget/src/background/sw.js` | modify | controller / service | event-driven → request-response | same file, 5–8, 31–55; projects/web-app/src/app/_panel/api.ts; projects/web-app/src/app/_panel/session.ts | exact structure; API/session adaptation |
| `projects/widget/src/core/messages.js` | modify | model | event-driven | same file, 1–3 | exact |
| `projects/widget/src/core/integration.js` | modify | service | request-response (runtime RPC) | same file, 3–15 | exact |
| `projects/widget/src/core/case.js` | modify | model / utility | transform | same file, 15–32 | exact |
| `projects/widget/src/core/check.js` | modify | utility | transform | same file, 57–84 | exact |
| `projects/widget/src/core/draft.js` | modify | store | event-driven → transform | same file, 88–122, 167 | exact |
| `projects/widget/src/content/main.js` | modify | controller | event-driven → request-response | same file, 38–61, 68–81 | exact |
| `projects/widget/src/ui/panel.js` | modify | component | event-driven → DOM transform | same file, 13–35, 92–131 | exact |
| `projects/widget/src/ui/strings.pl.js` | modify | model | transform | same file, 1–25, 105–109; projects/web-app/src/app/_panel/content.ts | exact |
| `projects/widget/src/ui/widget.css` | modify | utility (styles) | transform | same file, 6–34 | exact |
| `projects/widget/src/core/contract.js` | create (suggested path) | model | transform / validation | projects/web-app/src/lib/contract/types.ts, 12–125, 186–276 | role-match |
| `projects/widget/src/options/login.html` | create (UI-SPEC suggested path) | component / config | file-I/O → event-driven | no complete extension-page analog; projects/web-app/src/app/_panel/LoginScreen.tsx, 164–207 is partial DOM precedent | none (partial precedent) |
| `projects/widget/src/options/login.js` | create (UI-SPEC suggested path) | controller / component | event-driven → request-response | projects/web-app/src/app/_panel/LoginScreen.tsx; OtpInput.tsx; DemoAccountsDialog.tsx; widget panel.js | role-match |
| `projects/widget/src/options/login.css` | create (UI-SPEC suggested path) | utility (styles) | transform | widget.css; assets/scamerino_palette.css | role-match |
| `projects/widget/src/options/strings.pl.js` | create (suggested path) | model | transform | widget strings.pl.js; projects/web-app/src/app/_panel/content.ts, 21–53 | role-match |
| `projects/widget/src/options/demo-accounts.js` | create (suggested path) | model | transform | projects/web-app/src/lib/contract/demo-accounts.ts, 11–34 | role-match |
| `.planning/workstreams/widget/REQUIREMENTS.md` | modify (D-16, first plan) | model (requirements) | file-I/O | same file, 20–29 | exact |
| `.planning/workstreams/web-app/STATE.md` | modify (D-16, first plan) | model (decision log) | file-I/O | same file, 64–70 | exact |
| `projects/widget/README.md` | modify (inferred stale guidance) | model (documentation) | file-I/O | same file, 7–19, 85–95 | exact |

## Pattern Assignments

### Architectural data flow

`panel.js` → explicit handler in `content/main.js` → in-memory `draft.js` + DTO transform in `case.js`/`check.js` → `integration.js` runtime message → SW sender/message validation → stored extension session → Bearer API request → validated result → generation-checked tab state → panel confirmation or alert.

Options-page login/logout uses the same adapter, but privileged message types must be accepted only from the extension options page. Content callers receive session status/display name and report results, never token/e-mail/code. The content bundle and options bundle must not import the SW implementation.

### A. Extension wiring and API boundary

### `projects/widget/manifest.json` (config, event-driven)

**Analog:** the existing manifest itself (exact structure).

Keep MV3, the top-frame content script and toolbar action. Add `storage`, fixed API `host_permissions` covering `https://bezpieczna-aura.pl/*` and `http://localhost:3000/*`, and `options_ui` with the emitted login HTML path and `open_in_tab: true` (D-08/D-12/D-13). Permission match patterns and API origin/port validation must be handled consistently by build configuration; do not add a runtime URL input. No popup or externally-connectable endpoint is implied.

**Source:** `projects/widget/manifest.json`, lines 9–11.

```json
  "background": { "service_worker": "sw.js" },
  "content_scripts": [{ "matches": ["<all_urls>"], "js": ["content.js"], "run_at": "document_idle", "all_frames": false }],
  "permissions": ["activeTab", "scripting"]
```

### `projects/widget/build.mjs` (utility, file-I/O → batch)

**Analog:** the existing esbuild script (exact).

Extend its named entry points with the options JS bundle; copy login HTML/CSS, the unmodified `:root` palette and avatar-128 asset into paths consistent with HTML/manifest. Existing build uses esbuild, not a custom concatenator or React runtime. Inject a build constant using esbuild `define` and `JSON.stringify(process.env.AURA_API ?? 'https://bezpieczna-aura.pl')`, validate the configured origin and keep network base configuration in the SW bundle. Do not execute a build during this read-only mapping because it deletes/recreates dist.

**Source:** `projects/widget/build.mjs`, lines 5–12.

```javascript
const base = import.meta.dirname;
const dist = path.resolve(base, 'dist');
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(path.join(dist, 'icons'), { recursive: true });
fs.copyFileSync(path.join(base, 'manifest.json'), path.join(dist, 'manifest.json'));
for (const size of [16, 32, 48, 128]) {
  fs.copyFileSync(path.resolve(base, `../../assets/widget-avatar/icon-${size}.png`), path.join(dist, `icons/icon-${size}.png`));
}
```

**Source:** `projects/widget/build.mjs`, lines 31–42.

```javascript
const options = {
  absWorkingDir: base,
  entryPoints: { content: 'src/content/main.js', sw: 'src/background/sw.js' },
  outdir: 'dist', bundle: true, format: 'iife', target: ['chrome120'],
  minify: false, sourcemap: false, legalComments: 'none', plugins: [queryPlugin],
};
if (process.argv.includes('--watch')) {
  const context = await esbuild.context(options);
  await context.watch();
} else {
  await esbuild.build(options);
}
```

### `projects/widget/src/background/sw.js` (controller / service, event-driven → request-response)

**Analog:** existing SW exact sender/shape gate; web-app `api.ts` for HTTP and `session.ts` for validation/expiry (adapted).

Replace `MSG_GUARDIAN_REQUEST`'s memory acknowledgement with authenticated report creation. Existing `sender.id !== chrome.runtime.id || !sender.tab` admits content messages but rejects options-page callers: split by message capability. Require own extension ID for every path, a tab/document identity for tab report operations, and the exact extension login page URL for login/logout. Validate each top-level envelope as well as nested fields; the old listener checks case/result shapes but not exact envelope keys. Add asynchronous response handling that keeps the message channel open (`return true` for async work using sendResponse).

API work: POST login with `scope: 'extension'`, POST four-field report DTO, GET `/api/reports?limit=10`, 15-second POST abort per UI-SPEC (web-app currently uses 20 seconds), contract error mapping, response shape checks. Local session status reads must not call `/api/auth/me`, health or login. Re-login occurs only for an operation explicitly requested by the user, on known expiry or after 401, with at most one replay after confirmed 401; never generic POST replay/backoff.

Persist only token, expiry, account and the supplied demo e-mail/code in `chrome.storage.local`. The API/session authority stays in SW; a session response to content/options excludes secrets. Verify storage writes before reporting login success, and ensure logout/another login invalidates any earlier pending refresh so it cannot restore credentials or send under an unintended account. A shared in-flight refresh can prevent concurrent requests racing refresh; this behavior has no complete repository analog.

Current `cases`, `guardianRequests` and `self.__aura` are debug/mock buffers, not a production outbox. Do not expose new secrets there. UI-SPEC 285 requires a volatile last send outcome per tab/case; key it by tab/document/case generation, preserve completion while panel is closed, and discard on document replacement/reset/tab close. Keep authoritative report and sent marker in tab memory as well, because SW globals are not durable. Neither report payloads nor report lists belong in storage.

**Source:** `projects/widget/src/background/sw.js`, lines 5–8.

```javascript
const exactKeys = (value, keys) => value !== null && typeof value === 'object' && !Array.isArray(value)
  && Reflect.ownKeys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
const keyedList = (value, keys) => Array.isArray(value) && value.length <= keys.length
  && new Set(value).size === value.length && Array.from(value).every(key => typeof key === 'string' && keys.includes(key));
```

**Source:** `projects/widget/src/background/sw.js`, lines 31–45.

```javascript
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  messages.push({ type: typeof msg?.type === 'string' ? msg.type : null, at: Date.now() });
  if (sender.id !== chrome.runtime.id || !sender.tab) return;
  if (msg?.type === MSG_GUARDIAN_REQUEST) {
    if (!isValidCase(msg.case) || !isValidResult(msg.result)) { sendResponse({ ok: false }); return; }
    guardianRequests.push({ case: msg.case, result: msg.result });
    if (guardianRequests.length > 100) guardianRequests.shift();
    sendResponse({ ok: true });
    return;
  }
  if (msg?.type !== MSG_CASE_APPROVED) return;
  if (!isValidCase(msg.case)) { sendResponse({ ok: false }); return; }
  cases.push(msg.case);
  if (cases.length > 100) cases.shift();
  sendResponse({ ok: true });
```

**Source:** `projects/web-app/src/app/_panel/api.ts`, lines 83–100.

```javascript
export async function apiCall<T>(path: string, options: ApiCallOptions): Promise<ApiResult<T>> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }
  let body: string | undefined;
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  let response: Response;
  try {
    response = await fetch(path, { method: options.method, headers, body, cache: "no-store", signal: timeoutSignal() });
  } catch {
    // A dropped connection and a timeout look the same: the result is unknown.
    return { ok: false, kind: "network" };
  }
```

**Source:** `projects/web-app/src/app/_panel/session.ts`, lines 69–81.

```javascript
// Expired once expires_at is reached; an unreadable date counts as expired.
export function isSessionExpired(session: PanelSession, nowMs: number): boolean {
  const expiresMs = Date.parse(session.expires_at);
  return Number.isNaN(expiresMs) || expiresMs <= nowMs;
}

export function sessionFromLogin(response: LoginResponse): PanelSession {
  return {
    token: response.token,
    expires_at: response.expires_at,
    account: response.account,
    children: response.children,
  };
```

### `projects/widget/src/core/messages.js` (model, event-driven)

**Analog:** existing exported string constants (exact).

Replace the guardian-request protocol and add named message kinds for report submission/list, local session status, opening options, login/logout and any volatile outcome reconciliation. Exact names remain planner discretion. Distinguish local checking approval from API submission; do not make MSG_CASE_APPROVED an implicit report POST.

**Source:** `projects/widget/src/core/messages.js`, lines 1–3.

```javascript
export const MSG_CASE_APPROVED = 'aura/case-approved';
export const MSG_GUARDIAN_REQUEST = 'aura/guardian-request';
export const MSG_SHOW = 'aura/show';
```

### `projects/widget/src/core/integration.js` (service, request-response)

**Analog:** existing runtime RPC adapter (exact).

Retain a single thin adapter boundary. Add calls that carry the four-field DTO plus local case/request identity, request reports/session status and open login. Options uses this adapter for credentials, never direct fetch/storage. Existing `{ok:true}` alone is insufficient for send success: propagate structured HTTP/network/no-account/context failures and require an actual returned report object. Retire result snapshots from the report submission path entirely. Local approval can remain an acknowledged in-memory message for minimal change; it must never call the backend.

**Source:** `projects/widget/src/core/integration.js`, lines 3–15.

```javascript
export async function submitCase(c) {
  const response = await chrome.runtime.sendMessage({ type: MSG_CASE_APPROVED, case: c });
  if (response?.ok !== true) throw new Error('not-accepted');
  return response;
}

export async function requestGuardianVerification(c, result) {
  const snapshot = { summaryKey: result.summaryKey, signals: [...result.signals], unknowns: [...result.unknowns],
    step: { ...result.step }, mismatches: result.mismatches.map(mismatch => ({ ...mismatch })) };
  const response = await chrome.runtime.sendMessage({ type: MSG_GUARDIAN_REQUEST, case: c, result: snapshot });
  if (response?.ok !== true) throw new Error('not-accepted');
  return response;
}
```

### B. DTO transforms, local rules and tab state

### `projects/widget/src/core/case.js` (model / utility, transform)

**Analog:** existing normalized, immutable local case (exact).

Preserve `buildCase` and `isValidCase`'s local six-key model, limits and code-point handling; a local case is not a report request. Add a separate projection producing exactly `{attack_type, taken_actions, source, content}`. `content` is reviewed text plus optional `\n\nLink: …`; use precisely the same constructed string in preview and JSON. With both caps, 2000 + 2048 + separator/label remains under 5000 code points. Do not send local hostname, origin, timestamp, truncated, page URL, result or answers.

Derive wire source from origin/hostname: paste → other; trusted Discord hostname/suffix → discord; the explicitly chosen mail hosts → email; Roblox hostname/suffix → game; rest → other. Host classification needs suffix-boundary checks so e.g. `discord.com.evil.example` cannot match. Do not derive it from the child-supplied link, and do not mutate local `case.source` into an API enum. SMS is a selectable override, not a host inference. Exact mail host list is planner discretion.

**Source:** `projects/widget/src/core/case.js`, lines 1–10.

```javascript
export const MAX_CONTENT = 2000;
export const MAX_LINK = 2048;
export const ORIGINS = ['selection', 'paste'];

export function normalizeText(raw) {
  return String(raw ?? '').replace(/\u00a0/g, ' ').trim();
}
export function capCodePoints(text, max = MAX_CONTENT) {
  const points = Array.from(text);
  return { text: points.slice(0, max).join(''), truncated: points.length > max };
```

**Source:** `projects/widget/src/core/case.js`, lines 15–22.

```javascript
export function buildCase({ text, link, origin, truncated }, now = new Date(), loc = globalThis.location) {
  const normalized = normalizeText(text);
  if (!normalized) throw new Error('empty');
  if (!ORIGINS.includes(origin)) throw new Error('origin');
  const capped = capCodePoints(normalized);
  return Object.freeze({ content: capped.text, link: normalizeLink(link), origin,
    source: String(loc?.hostname ?? ''), created_at: now.toISOString(),
    truncated: Boolean(truncated || capped.truncated) });
```

**Source:** `projects/widget/src/core/case.js`, lines 24–32.

```javascript
export function isValidCase(c) {
  const keys = ['content', 'link', 'origin', 'source', 'created_at', 'truncated'];
  return c !== null && typeof c === 'object' && !Array.isArray(c)
    && Reflect.ownKeys(c).length === keys.length && keys.every((key) => Object.hasOwn(c, key))
    && typeof c.content === 'string' && normalizeText(c.content).length > 0 && Array.from(c.content).length <= MAX_CONTENT
    && typeof c.link === 'string' && Array.from(c.link).length <= MAX_LINK
    && ORIGINS.includes(c.origin) && typeof c.source === 'string' && c.source.length <= 253
    && typeof c.created_at === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(c.created_at) && Number.isFinite(Date.parse(c.created_at))
    && typeof c.truncated === 'boolean';
```

### `projects/widget/src/core/check.js` (utility, transform)

**Analog:** existing pure keyed evaluation (exact).

Add a pure attack-type proposal alongside `evaluate`, leaving the existing summary/step vocabulary intact. Crucial gap: `RESULT_KEYS.signals` has no organization/impersonation or generic message-link signal. A mapper fed only `result.signals` cannot implement D-05; it also needs `answers.sender`/`answers.verify` (and explicitly chosen recognized hints if needed).

Proposed, not locked, deterministic priority matching D-05's listed order: credential password/code → data_request; prize/prize_link → fake_prize; payment/payment_pressure → purchase_trap; selected claims_organization → impersonation; selected verify.message_link → phishing; otherwise other. `urgency` alone does not identify an attack category. The planner can choose a different documented tie-break priority. Merely having any URL does not by itself mean the child answered “only via this message link.” Rule result is a preselected editable proposal; it is never a claim of certainty and never included as `signals` in the POST.

**Source:** `projects/widget/src/core/check.js`, lines 4–15.

```javascript
export const QUESTIONS = freezeLists({
  sender: ['known_person', 'claims_organization', 'unknown_sender', 'unknown'],
  request: ['password', 'code', 'prize', 'payment', 'urgency', 'ordinary', 'unknown'],
  verify: ['independent_channel', 'message_link', 'no_channel', 'unknown'],
});
export const RESULT_KEYS = freezeLists({
  summaries: ['conflicting_answers', 'caution', 'insufficient_information', 'no_signals'],
  signals: ['credential_password', 'credential_code', 'payment_pressure', 'payment', 'prize_link', 'prize', 'urgency'],
  unknowns: ['sender', 'request', 'urgency', 'official_channel', 'conflict'],
  steps: ['protect_credentials', 'verify_payment', 'verify_prize', 'pause_and_verify', 'independent_check'],
  mismatches: ['credential_password', 'credential_code'],
});
```

**Source:** `projects/widget/src/core/check.js`, lines 57–67.

```javascript
export function evaluate(answers, hints) {
  const choices = validLists(answers);
  const recognized = validLists(hints);
  const request = choices.request;
  const has = id => request.includes(id) || recognized.request.includes(id);
  const credentials = ['password', 'code'].filter(has);
  const pressure = has('payment') && has('urgency');
  const prizeLink = has('prize') && (choices.verify.includes('message_link') || recognized.verify.includes('message_link'));
  const signals = [...credentials.map(id => 'credential_' + id),
    ...(pressure ? ['payment_pressure'] : has('payment') ? ['payment'] : []),
    ...(prizeLink ? ['prize_link'] : has('prize') ? ['prize'] : []), ...(has('urgency') ? ['urgency'] : [])];
```

**Source:** `projects/widget/src/core/check.js`, lines 78–84.

```javascript
  const stepId = credentials.length ? 'protect_credentials' : pressure ? 'verify_payment' : has('prize') ? 'verify_prize'
    : has('urgency') ? 'pause_and_verify' : has('payment') ? 'verify_payment' : 'independent_check';
  return Object.freeze({
    summaryKey: mismatches.length ? 'conflicting_answers' : signals.length ? 'caution' : unknowns.length ? 'insufficient_information' : 'no_signals',
    signals: Object.freeze(signals), unknowns: Object.freeze(unknowns),
    step: Object.freeze({ id: stepId, explanationKey: stepId + '_how' }), mismatches: Object.freeze(mismatches),
  });
```

### `projects/widget/src/core/draft.js` (store, event-driven → transform)

**Analog:** existing immutable tab state and transaction generations (exact).

Replace `beginGuardianRequest/guardianRequested/guardianRequestFailed` with explicit preview/send state, a reviewed DTO, sent report/recipient metadata, outcome class and resumable view. Extend `checkView`, avatar resume and mutation guards to the new views. Keep attack/actions/source while navigating result ↔ preview ↔ platform instructions ↔ list; list Back needs its own return origin (menu or warning preview), not the current unconditional `back()` → menu.

Use the existing `gen` guard for POST completion after close/hide/document reset. Do not mark sent on local ack. A validated saved report sets the per-case sent guard; returning to result or changing answers must not re-enable sending the same case. Changed content/link and successful new approval create a new case and reset proposal/selections/sent outcome; cancelling an edit preserves the old case. Separate report-list request identity from POST generation so list refresh cannot invalidate an in-flight send. Keep lists only in transient state and re-fetch every open.

Existing outcome handlers preserve `view:'closed'`; retain that behavior and store completion for reopen. After success `finishCheck`/new-message is the intentional reset. Repeated clicks are guarded while pending and after confirmed success. Known failure preserves review inputs; uncertain delivery preserves inputs and offers a manual retry plus list inspection.

**Source:** `projects/widget/src/core/draft.js`, lines 88–102.

```javascript
    beginSubmit() {
      if (state.submitting || !state.draft || !normalizeText(state.draft.text)) return null;
      state = { ...state, gen: state.gen + 1, submitting: true, submissionKind: 'case', error: null };
      return state.gen;
    },
    approved(token, approvedCase) {
      if (!state.submitting || state.submissionKind !== 'case' || token !== state.gen) return false;
      if (!isValidCase(approvedCase)) { submitFailed(token); return false; }
      const unchanged = state.check && normalizeText(state.check.case.content) === normalizeText(approvedCase.content)
        && normalizeLink(state.check.case.link) === normalizeLink(approvedCase.link);
      const check = unchanged ? state.check : Object.freeze({ case: Object.freeze(approvedCase), step: 'safety', resumeStep: 'safety',
        answers: freezeAnswers({ sender: [], request: [], verify: [] }), hints: detectHints(approvedCase), result: null,
        keptAnswers: Object.freeze({}), discrepancy: null });
      state = { ...state, view: state.view === 'closed' ? 'closed' : checkView(check.resumeStep), check,
        draft: null, candidateKind: null, pendingSelection: null, error: null, submitting: false, submissionKind: null };
```

**Source:** `projects/widget/src/core/draft.js`, lines 105–122.

```javascript
    beginGuardianRequest() {
      if (state.view !== 'result' || !state.check?.result || state.draft || state.submitting) return null;
      state = { ...state, gen: state.gen + 1, submitting: true, submissionKind: 'guardian', error: null };
      return state.gen;
    },
    guardianRequested(token) {
      if (!state.submitting || state.submissionKind !== 'guardian' || token !== state.gen) return false;
      state = { ...state, view: state.view === 'closed' ? 'closed' : 'confirmation',
        check: Object.freeze({ ...state.check, step: 'confirmation', resumeStep: 'confirmation' }),
        pendingSelection: null, error: null, submitting: false, submissionKind: null };
      return true;
    },
    guardianRequestFailed(token, contextInvalidated = false) {
      if (!state.submitting || state.submissionKind !== 'guardian' || token !== state.gen) return false;
      state = { ...state, view: state.view === 'closed' ? 'closed' : 'result',
        error: contextInvalidated ? 'guardianRequestContextInvalidated' : 'guardianRequest', submitting: false, submissionKind: null };
      return true;
    },
```

**Source:** `projects/widget/src/core/draft.js`, lines 164–168.

```javascript
    submitFailed,
    hide() { state = { ...state, hidden: true, view: 'closed', pendingSelection: null }; },
    show() { state = { ...state, hidden: false }; },
    resetForNewDocument() { state = { ...initial(), gen: state.gen + 1 }; },
  };
```

### `projects/widget/src/content/main.js` (controller, event-driven → request-response)

**Analog:** existing handlers connecting store, adapter and renderer (exact).

Replace `onRequestGuardianVerification` with distinct open-preview, send, field-change, platform/list navigation, list retry and login-opening handlers. Read session metadata through SW locally when needed; unknown/connected/none drives result/list UI. Keep network/credentials out of this file. Preserve `isLive()` context invalidation mapping. Use stable operation IDs and only render accepted outcomes; current controller ignores guardianRequested's boolean return and still re-renders, so avoid stale reply focus changes after reset.

Preserve `onApprove` as local checking and `onMove: placePanel` as placement only. Closing does not abort POST. `pagehide` invalidates case and outstanding list/send callbacks; coordinate volatile SW outcome cleanup without persisting text. Do not install new passive DOM/selection readers. Fetching local session metadata is not an API call; existing tests count runtime messages, so these counts need adaptation if the status query is introduced.

**Source:** `projects/widget/src/content/main.js`, lines 1–8.

```javascript
import { HOST_TAG, createHost } from './host.js';
import { createAvatar } from './avatar.js';
import { createPanel } from '../ui/panel.js';
import { STRINGS } from '../ui/strings.pl.js';
import { createDraftStore } from '../core/draft.js';
import { buildCase, normalizeText, normalizeLink } from '../core/case.js';
import { MSG_SHOW } from '../core/messages.js';
import { submitCase, requestGuardianVerification } from '../core/integration.js';
```

**Source:** `projects/widget/src/content/main.js`, lines 38–45.

```javascript
    async onRequestGuardianVerification() {
      const check = store.get().check;
      const token = store.beginGuardianRequest();
      if (token === null) return;
      render();
      try { await requestGuardianVerification(check.case, check.result); store.guardianRequested(token); }
      catch (error) { store.guardianRequestFailed(token, !isLive() || /extension context invalidated/i.test(error?.message ?? '')); }
      render();
```

**Source:** `projects/widget/src/content/main.js`, lines 56–61.

```javascript
      const token = store.beginSubmit();
      if (token === null) return;
      render();
      try { await submitCase(c); if (!store.approved(token, c)) store.submitFailed(token); }
      catch { store.submitFailed(token); }
      render();
```

**Source:** `projects/widget/src/content/main.js`, lines 64–81.

```javascript
  const avatar = createAvatar({ host, root, strings: STRINGS,
    onActivate(captured) { store.onAvatarClick(captured); render(); },
    onHide() { store.hide(); render(); },
    onMove: placePanel });
  function placePanel(rect) {
    const state = store.get();
    if (!state.hidden && state.view !== 'closed') panel.place(rect, { width: innerWidth, height: innerHeight });
  }
  function render() {
    const state = store.get();
    avatar.setHidden(state.hidden);
    panel.render(state, { host: location.hostname });
    placePanel(avatar.rect());
  }
  const resize = () => { avatar.reclamp({ width: innerWidth, height: innerHeight }); render(); };
  window.addEventListener('resize', resize);
  const pagehide = () => { store.resetForNewDocument(); render(); };
  window.addEventListener('pagehide', pagehide);
```

### C. Child-facing DOM and copy

### `projects/widget/src/ui/panel.js` (component, event-driven → DOM transform)

**Analog:** existing node/button helpers, option groups, alerts and focused view branches (exact).

Keep renderer free of Chrome/API calls, with handlers supplied by the controller and all untrusted values rendered via textContent. Add views `sendPreview`, `platformHowTo`, `myReports`, shared no-account notice and the new confirmed-send branch; update the hardcoded visible-view allowlist at line 47. Menu becomes three buttons. Result adds a vertical action stack (guardian primary/platform secondary), then navigation. Unknown session disables guardian CTA; none replaces it with the notice.

Copy fieldset/legend/radio-checkbox construction and focus restoration from the question view. On attack-type change, drop disallowed actions and restore the same radio's focus. Source select is shared with platform instructions; rows and supplied links are text. Only fixed trusted instruction URLs become anchors with target=_blank and rel=noopener noreferrer. Report rows are plain text in an ordered list, excerpt about 60 chars, contract attack label and local Intl date, plus child status mapping.

Send preview focuses the read-only scrollable content box, not Wyślij. During POST disable preview controls, set aria-busy, label Wysyłam… and focus ×; no optimistic confirmation. Failure alerts stay inside preview and focus retry. Confirmation uses saved account recipient and server timestamp, focuses primary Zamknij, retains local result and removes editing. List arrival must not steal focus from Back; GET failure supports retry. Platform instructions always say nothing is sent. Do not reuse adult colored badges or teacher/parent comment components.

**Source:** `projects/widget/src/ui/panel.js`, lines 13–17.

```javascript
  const node = (tag, text, className) => {
    const el = doc.createElement(tag);
    if (text !== undefined) el.textContent = text;
    if (className) el.className = className;
    return el;
```

**Source:** `projects/widget/src/ui/panel.js`, lines 33–35.

```javascript
  const button = (text, className, handler) => {
    const b = node('button', text, className); b.type = 'button'; b.addEventListener('click', handler); return b;
  };
```

**Source:** `projects/widget/src/ui/panel.js`, lines 95–109.

```javascript
        const group = node('fieldset', undefined, 'question-options');
        group.append(node('legend', question.title));
        for (const option of question.options) {
          const row = node('div', undefined, 'question-option');
          const input = node('input');
          input.type = question.multiple ? 'checkbox' : 'radio';
          input.name = question.id;
          input.id = 'check-' + question.id + '-' + option.id;
          input.value = option.id;
          input.checked = selected.includes(option.id);
          input.addEventListener('change', () => handlers.onAnswer(question.id, option.id));
          const label = node('label');
          label.htmlFor = input.id;
          label.append(input, node('span', option.label));
          row.append(label);
```

**Source:** `projects/widget/src/ui/panel.js`, lines 123–130.

```javascript
          prompt.setAttribute('role', 'alert');
          prompt.append(node('p', strings.checkMismatches[mismatch.messageKey]),
            button(strings.correctAnswer, 'btn-secondary', () => handlers.onAnswer(mismatch.questionId, mismatch.answerId)),
            button(strings.keepAnswer, 'btn-primary', () => handlers.onQuestionNext(true)));
          body.append(prompt);
        }
        const focused = [...group.querySelectorAll('input')].find(input => input.id === focusedId);
        (focused ?? group.querySelector('input:checked') ?? group.querySelector('input')).focus();
```

### `projects/widget/src/ui/strings.pl.js` (model, transform)

**Analog:** existing STRINGS object; web-app content.ts for platform destinations (exact structural match).

Replace `guardianNotice`, `howToSteps`, `howToPrivacy` and demo confirmation/guardianRequest strings according to UI-SPEC. Add preview/outcome/list/no-account/platform text here. Keep contract enum labels imported from the local contract copy and capitalize only the first letter; do not paraphrase attack/action/source labels. Keep child state labels in this presentation module: pending_parent “Czeka, aż rodzic zobaczy”, with_teacher “Rodzic poprosił o pomoc nauczyciela”, escalated “Dorośli zgłosili to dalej”, closed “Sprawa zamknięta”, rejected “Rodzic zobaczył — porozmawiajcie o tym”. Do not change canonical REPORT_STATE_LABELS_PL.

Platform copy source is DIALOG.escalateWhere in web-app content.ts, including CERT, Dyżurnet, Roblox, FDDS 800 100 100 and emergency 112. UI-SPEC fixes the actual child surfaces: Roblox link for game, CERT/Dyżurnet “Gdzie jeszcze”, 112 safety line, SMS forwarding instruction 8080. FDDS is an adult referral in the canonical list, not an automatically required extra child anchor. Copy fixed destinations/names with source comments; do not import the web-app module during widget build.

**Source:** `projects/widget/src/ui/strings.pl.js`, lines 11–25.

```javascript
  previewHeading: 'Sprawdź, co mi pokazujesz',
  previewHint: 'Możesz poprawić tekst, na przykład usunąć swoje imię albo inne dane.',
  sourcePrefix: 'Ze strony:',
  guardianNotice: 'Gdy zatwierdzisz, tę wiadomość i wynik sprawdzania zobaczy Twój opiekun.',
  approve: 'Zatwierdzam',
  newSelectionHint: 'Na stronie jest nowe zaznaczenie. Możesz je wstawić zamiast tej wiadomości.',
  insertNewSelection: 'Wstaw nowe zaznaczenie',
  truncatedNotice: 'Wiadomość była bardzo długa, więc biorę tylko jej początek (2000 znaków).',
  confirmationHeading: 'Przekazano opiekunowi — demo',
  confirmationBody: 'To pokaz działania. Sprawa i wynik są zapisane tylko w pamięci rozszerzenia. Prawdziwa wysyłka do opiekuna pojawi się w kolejnej wersji.',
  confirmationClose: 'Zamknij',
  confirmationBackToMenu: 'Wróć do menu',
  requestGuardianVerification: 'Poproś opiekuna o sprawdzenie',
  guardianRequestError: 'Nie udało się zapisać prośby w pokazie. Spróbuj jeszcze raz.',
  guardianRequestContextInvalidated: 'Rozszerzenie zostało przeładowane. Odśwież tę stronę, aby ponownie poprosić opiekuna o sprawdzenie.',
```

**Source:** `projects/web-app/src/app/_panel/content.ts`, lines 193–215.

```typescript
  escalateWhereTitle: "Gdzie zgłosić",
  escalateWhereEmergency: "Gdy dziecku grozi niebezpieczeństwo, dzwoń pod ",
  emergencyNumber: "112",
  escalateWhere: [
    {
      name: "Dyżurnet.pl (NASK)",
      href: "https://dyzurnet.pl/formularz-zgloszeniowy",
      use: "Treści szkodliwe dla dzieci: wykorzystywanie seksualne, grooming, przemoc, cyberprzemoc.",
    },
    {
      name: "CERT Polska (NASK)",
      href: "https://incydent.cert.pl/",
      use: "Oszustwa i phishing: fałszywe strony, linki, wyłudzanie kont lub danych.",
    },
    {
      name: "Zgłoszenie w Roblox",
      href: "https://about.roblox.com/reporting-and-blocking",
      use: "Naruszenie zasad przez gracza lub grę. Sprawę sprawdzą moderatorzy Roblox.",
    },
    {
      name: "800 100 100 (FDDS)",
      href: "tel:800100100",
      use: "Bezpłatna porada dla nauczycieli i rodziców, jak pomóc dziecku.",
```

### `projects/widget/src/ui/widget.css` (utility (styles), transform)

**Analog:** existing panel styles and palette (exact).

Extend native select styling/focus rules, `.sent-content`, action stack, wrapping rows, report separators and error/warning boxes. Reuse option styles and 320px scrolling panel. Restyle remaining `.error` to tinted error box with primary text per UI-SPEC; crimson is a tint/border, not low-contrast text. New list statuses all use the same text color. Keep `.row` wrapping to fit 280px; include selects, anchors and focusable content box in focus-visible styles. `host.js` already rewrites the shared palette from :root to :host and should need no source edit.

**Source:** `projects/widget/src/ui/widget.css`, lines 6–16.

```css
.panel { position: fixed; width: 320px; max-width: calc(100vw - 16px); max-height: calc(100vh - 32px); overflow: auto; box-sizing: border-box; padding: 16px; border-radius: var(--radius-widget); background: var(--color-surface-card); border: 1px solid var(--color-shield-silver-border); box-shadow: var(--shadow-shield-card); }
.panel header { display: flex; justify-content: flex-end; }
button { font: inherit; cursor: pointer; padding: 8px 12px; border: 0; border-radius: 12px; }
.btn-primary { background: var(--color-shark-blue); color: white; border-radius: 12px; }
.btn-secondary { background: var(--color-shield-silver); }
button:disabled { opacity: 0.5; cursor: not-allowed; }
textarea, input[type=text] { width: 100%; box-sizing: border-box; border-radius: 12px; border: 1px solid var(--color-shield-silver-border); font: inherit; padding: 8px; }
textarea { min-height: 96px; resize: vertical; }
.notice { background: rgba(var(--color-shark-blue-rgb), 0.08); border-radius: 12px; padding: 8px 12px; }
.error { color: var(--color-hook-crimson); }
.source, .hint { color: var(--color-text-muted); font-size: 13px; }
```

**Source:** `projects/widget/src/ui/widget.css`, lines 27–34.

```css
.panel button:focus-visible, .panel input:focus-visible, .panel textarea:focus-visible { outline: 3px solid var(--color-shark-blue); outline-offset: 2px; }
.question-options { border: 0; margin: 0; padding: 0; min-inline-size: 0; }
.question-options legend { font-size: 18px; font-weight: 600; margin-bottom: 12px; overflow-wrap: anywhere; }
.question-option { padding: 8px; margin: 4px 0; border-radius: 12px; }
.question-option:has(input:checked) { background: var(--color-shield-silver); }
.question-option label { display: flex; align-items: flex-start; gap: 8px; cursor: pointer; overflow-wrap: anywhere; }
.question-option input { flex-shrink: 0; width: 18px; height: 18px; margin: 2px 0; accent-color: var(--color-shark-blue); }
.hint-badge { display: inline-block; margin: 4px 0 0 26px; padding: 2px 6px; border-radius: 6px; background: var(--color-surface-bg); color: var(--color-text-muted); font-size: 12px; }
```

**Source:** `projects/widget/src/content/host.js`, lines 1–8.

```javascript
import paletteCss from '../../../../assets/scamerino_palette.css?raw';
import widgetCss from '../ui/widget.css?raw';

export const HOST_TAG = 'bezpieczna-aura-widget';
export function buildStyleText(palette, widget) {
  return palette.replace(':root', ':host') + '\n' + widget;
}
export const STYLE_TEXT = buildStyleText(paletteCss, widgetCss);
```

### D. Local contract copy and parent options page

### `projects/widget/src/core/contract.js` (model, transform / validation)

**Analog:** web-app types.ts constants (role-match; TS syntax must be removed).

Copy only the relevant v2 runtime constants into JS, with canonical path/version comments: ATTACK_TYPES, ATTACK_TYPE_LABELS_PL, TAKEN_ACTIONS, TAKEN_ACTION_LABELS_PL, ACTIONS_BY_ATTACK_TYPE, REPORT_SOURCES, REPORT_SOURCE_LABELS_PL, REPORT_STATES/INITIAL_REPORT_STATE, API_ERROR_CODES/API_ERROR_MESSAGES_PL and LIMITS (and field lists used by response/session validation). Preserve literal spellings, order, action compatibility and all copied values. Strip type declarations/annotations/`as const`; do not introduce React/Next dependencies. Freezing copied lists follows widget check.js/strings.pl.js conventions.

`types.ts` has no runtime imports, so a tightly proven direct constant import might be mechanically possible with esbuild, but this map follows D-00's default local copy. There is no reason to import web-app components or session code. Keep child status wording in widget strings and demo accounts in options-only data, preventing unrelated backend/workflow/Roblox data from entering the content bundle.

**Source:** `projects/web-app/src/lib/contract/types.ts`, lines 64–81.

```typescript
export const ATTACK_TYPES = [
  "phishing",
  "data_request",
  "fake_prize",
  "purchase_trap",
  "impersonation",
  "other",
] as const;
export type AttackType = (typeof ATTACK_TYPES)[number];

export const ATTACK_TYPE_LABELS_PL: Record<AttackType, string> = {
  phishing: "fałszywy link lub strona logowania",
  data_request: "prośba o dane, hasło lub kod",
  fake_prize: "fałszywa nagroda lub konkurs",
  purchase_trap: "pułapka zakupowa lub prośba o zapłatę",
  impersonation: "ktoś podszywa się pod znajomego, szkołę lub firmę",
  other: "coś innego",
};
```

**Source:** `projects/web-app/src/lib/contract/types.ts`, lines 107–125.

```typescript
export const ACTIONS_BY_ATTACK_TYPE: Record<AttackType, readonly TakenAction[]> = {
  phishing: ["clicked_link", "entered_password", "downloaded_file", "replied"],
  data_request: ["entered_password", "shared_code", "shared_personal_data", "replied"],
  fake_prize: ["clicked_link", "shared_code", "shared_personal_data", "paid", "replied"],
  purchase_trap: ["clicked_link", "shared_personal_data", "paid"],
  impersonation: ["clicked_link", "shared_code", "shared_personal_data", "paid", "replied"],
  other: TAKEN_ACTIONS,
};

export const REPORT_SOURCES = ["game", "email", "sms", "discord", "other"] as const;
export type ReportSource = (typeof REPORT_SOURCES)[number];

export const REPORT_SOURCE_LABELS_PL: Record<ReportSource, string> = {
  game: "gra",
  email: "mail",
  sms: "SMS",
  discord: "Discord",
  other: "inne",
};
```

**Source:** `projects/web-app/src/lib/contract/types.ts`, lines 266–276.

```typescript
export const LIMITS = {
  maxBodyBytes: 32768,
  emailMaxChars: 254,
  codeMaxChars: 16,
  contentMaxChars: 5000,
  commentMaxChars: 2000,
  transitionCommentMaxChars: 1000,
  pageDefault: 20,
  pageMax: 100,
  tokenTtlSeconds: 43200,
} as const;
```

### `projects/widget/src/options/login.html` (component / config, file-I/O → event-driven)

**Analog:** no complete tracked extension HTML/options-page analog; LoginScreen.tsx gives only a markup precedent.

Create the native extension page described by UI-SPEC: Polish document language/title, responsive viewport, centered Scamerinio brand and parent card, external CSS and packaged JS. Bundle/copy with build.mjs and align the manifest path. The avatar is assets/widget-avatar/avatar-128.png displayed at 48px with empty alt. Use actual packaged script/style references, without inline handlers or framework runtime. Same page serves onInstalled reason=install and options_ui; opening on extension update is not requested.

**Source:** `projects/web-app/src/app/_panel/LoginScreen.tsx`, lines 175–184.

```tsx
        <div className={`${card} p-6 md:p-8`}>
          {step === "email" ? (
            <>
              <h1 className="font-display text-2xl font-semibold leading-tight">{LOGIN.step1Title}</h1>
              <p className="mt-2 text-base text-muted-slate">{LOGIN.step1Intro}</p>
              {notice ? <SessionNoticeBanner notice={notice} /> : null}
              <form noValidate onSubmit={submitEmail} className="mt-6">
                <label htmlFor="login-email" className="block text-sm font-semibold text-navy-slate">
                  {LOGIN.emailLabel}
                </label>
```

### `projects/widget/src/options/login.js` (controller / component, event-driven → request-response)

**Analog:** LoginScreen, OtpInput and DemoAccountsDialog behavior adapted to widget DOM helpers (role-match).

Use vanilla DOM/local state, relative widget imports and integration.js; no React/Next imports. Email step validates format/254-char max, stores only local entered email and moves to code with zero network. Code step contains four digit boxes and one login operation for e-mail+code, scope fixed by SW to extension. Copy pending/duplicate guard, code clearing and focus return for invalid_credentials. Show special teacher 403 copy and distinct network/storage-save failures. Successful login waits for confirmed persistence and displays actual account.display_name; logout removes all stored login data and returns form/banner.

Copy OTP digit sanitation, index overwrite, backspace/arrow behavior and paste distribution; code completion uses requestSubmit after state update and an in-flight guard. UI-SPEC requests maxlength=1 boxes whereas web-app first box allows whole-code autofill (lines 116–118); adapt paste explicitly and resolve autofill handling without silently copying different attributes. Keep first input autocomplete=one-time-code and all digit aria labels. Native dialog showModal, Escape/close, focus restoration and Use-only-email behavior follow the demo dialog. It lists exactly three parent presentation accounts; never teachers or smoke accounts. Code remains blank and unhinted outside the explicit demo dialog.

**Source:** `projects/web-app/src/app/_panel/LoginScreen.tsx`, lines 78–96.

```tsx
  function submitEmail(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const trimmed = email.trim();
    if (trimmed === "") {
      setEmailError(LOGIN.emailEmpty);
      emailRef.current?.focus();
      return;
    }
    if (!EMAIL_PATTERN.test(trimmed)) {
      setEmailError(LOGIN.emailInvalid);
      emailRef.current?.focus();
      return;
    }
    setEmailError(null);
    setFormError(null);
    setCode("");
    setCodeError(null);
    setStep("code");
  }
```

**Source:** `projects/web-app/src/app/_panel/LoginScreen.tsx`, lines 115–130.

```tsx
    const result = await loginRequest(email, code);
    if (result.ok) {
      // The session snapshot flips to authenticated and LoginScreen redirects to /panel. When the
      // browser cannot keep the session it never flips, so the form unlocks and says why.
      if (saveSession(result.value)) return;
      setPending(false);
      setFormError(LOGIN.sessionNotSaved);
      return;
    }

    setPending(false);
    if (result.kind === "http" && result.code === "invalid_credentials") {
      setCode("");
      setCodeError(API_ERROR_MESSAGES_PL.invalid_credentials);
      codeRef.current?.focus();
      return;
```

**Source:** `projects/web-app/src/app/_panel/OtpInput.tsx`, lines 52–65.

```tsx
  function update(next: string): void {
    const clean = next.replace(/\D/g, "").slice(0, length);
    latest.current = clean;
    onChange(clean);
    if (clean.length === length && clean !== value) onComplete?.(clean);
  }

  // Writes digits starting at `index`, so typing over a middle box or pasting there both work.
  function writeAt(index: number, digits: string): void {
    const start = Math.min(index, value.length);
    const next = (value.slice(0, start) + digits + value.slice(start + digits.length)).slice(0, length);
    update(next);
    focusBox(start + digits.length);
  }
```

**Source:** `projects/web-app/src/app/_panel/OtpInput.tsx`, lines 96–101.

```tsx
  function handlePaste(index: number, event: ClipboardEvent<HTMLInputElement>): void {
    event.preventDefault();
    if (readOnly) return;
    const digits = event.clipboardData.getData("text").replace(/\D/g, "");
    if (digits !== "") writeAt(index, digits);
  }
```

**Source:** `projects/web-app/src/app/_panel/DemoAccountsDialog.tsx`, lines 37–44.

```tsx
export function DemoAccountsDialog({ info, onPick, onClose }: DemoAccountsDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);
```

**Source:** `projects/web-app/src/app/_panel/DemoAccountsDialog.tsx`, lines 74–82.

```tsx
            <button
              type="button"
              className={`${secondaryButton} ${buttonSmall} shrink-0`}
              onClick={() => {
                onPick(account.email);
                dialogRef.current?.close();
              }}
            >
              {DEMO_INFO.use}
```

### `projects/widget/src/options/login.css` (utility (styles), transform)

**Analog:** widget.css controls + shared :root palette (role-match).

Use unmodified copied palette on :root; unlike the shadow panel do not replace it with :host. Follow UI-SPEC 400px column, 48px top/bottom padding, card radius20/padding24, 15px body,18px heading/OTP, 48×56 digit boxes, >=44px buttons and 3px blue focus ring. Native dialog max360px and contained focus are required. Copy CSS variable usage, not Tailwind class strings from LoginScreen.

**Source:** `assets/scamerino_palette.css`, lines 7–15.

```css
:root {
  /* Brand / Primary */
  --color-shark-blue: #0F62DB;
  --color-shark-blue-rgb: 15, 98, 219;
  --color-shark-blue-dark: #0A3B8C;

  /* Shield & Defense */
  --color-shield-silver: #E2E8F0;
  --color-shield-silver-border: #CBD5E1;
```

**Source:** `assets/scamerino_palette.css`, lines 27–37.

```css
  /* Surfaces & Typography */
  --color-surface-bg: #F8FAFC;
  --color-surface-card: #FFFFFF;
  --color-text-primary: #0F172A;
  --color-text-muted: #64748B;

  /* Glow & Shadows */
  --shadow-siren-glow: 0 0 16px rgba(255, 138, 0, 0.45);
  --shadow-shield-card: 0 4px 20px -2px rgba(15, 98, 219, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04);
  --radius-widget: 1.25rem; /* 20px */
  --radius-dashboard: 0.75rem; /* 12px */
```

**Source:** `projects/widget/src/ui/widget.css`, lines 8–14.

```css
button { font: inherit; cursor: pointer; padding: 8px 12px; border: 0; border-radius: 12px; }
.btn-primary { background: var(--color-shark-blue); color: white; border-radius: 12px; }
.btn-secondary { background: var(--color-shield-silver); }
button:disabled { opacity: 0.5; cursor: not-allowed; }
textarea, input[type=text] { width: 100%; box-sizing: border-box; border-radius: 12px; border: 1px solid var(--color-shield-silver-border); font: inherit; padding: 8px; }
textarea { min-height: 96px; resize: vertical; }
.notice { background: rgba(var(--color-shark-blue-rgb), 0.08); border-radius: 12px; padding: 8px 12px; }
```

### `projects/widget/src/options/strings.pl.js` (model, transform)

**Analog:** widget STRINGS object + web-app LOGIN/DEMO_INFO (role-match).

Centralize options copy in this sibling module (UI-SPEC allows a sibling strings object; a module is the suggested concrete filename). Reuse identical email/code validation messages from LOGIN, canonical invalid_credentials via copied contract, and UI-SPEC's extension-specific headings, teacher403/storage failure, success and logout text. Do not copy web-app brand, back-home links or /panel redirection. The explicit demo dialog is the only location revealing shared code.

**Source:** `projects/web-app/src/app/_panel/content.ts`, lines 21–35.

```typescript
export const LOGIN = {
  step1Title: "Zaloguj się do panelu",
  step1Intro: "Panel dla rodziców i nauczycieli.",
  emailLabel: "Adres e-mail",
  emailEmpty: "Wpisz adres e-mail.",
  emailInvalid: "Wpisz poprawny adres e-mail.",
  next: "Dalej",
  step2Title: "Wpisz kod",
  step2Intro: "Wpisz kod logowania dla adresu {email}.",
  codeLabel: "Kod logowania",
  codeEmpty: "Wpisz kod logowania.",
  codeIncomplete: "Kod ma 4 cyfry. Wpisz wszystkie.",
  codeDigit: (index: number, length: number) => `Cyfra ${index + 1} z ${length}`,
  submit: "Zaloguj się",
  pending: "Logowanie…",
```

**Source:** `projects/web-app/src/app/_panel/content.ts`, lines 46–53.

```typescript
export const DEMO_INFO = {
  open: "Zobacz konta demo",
  title: "Konta demo",
  intro: "To wersja demonstracyjna z fikcyjnymi danymi. Zaloguj się jednym z kont poniżej.",
  use: "Użyj",
  codeLabel: "Kod logowania dla każdego konta:",
  close: "Zamknij",
};
```

### `projects/widget/src/options/demo-accounts.js` (model, transform)

**Analog:** canonical demo-accounts.ts (role-match).

Options-only copied data with source comment; keep Mama Oli, Tata Kuby, Mama Zosi and their exact @bezpiecznaaura.example emails/display names. Canonical parent records are lines 16–34; parent smoke record begins line35, teachers line41. Do not copy all DEMO_ACCOUNTS wholesale or expose the code in input placeholders. Include DEMO_LOGIN_CODE only for the dialog. Keep this out of the child content bundle.

**Source:** `projects/web-app/src/lib/contract/demo-accounts.ts`, lines 11–21.

```typescript
// In theory the code arrives by e-mail; in the demo it is always 0000.
export const DEMO_LOGIN_CODE = "0000";

export const DEMO_EMAIL_DOMAIN = "bezpiecznaaura.example";

export const DEMO_ACCOUNTS: readonly AccountInfo[] = [
  {
    id: "00000000-0000-4000-8000-0000000a0001",
    email: "rodzic.ola@bezpiecznaaura.example",
    role: "parent",
    display_name: "Mama Oli (demo)",
```

### E. Required planning alignment and stale run instructions

### `.planning/workstreams/widget/REQUIREMENTS.md` (model (requirements), file-I/O)

**Analog:** same requirements list (exact).

First implementation plan must apply D-16: HND-03 → child sees report status (guardian decision); HND-02 → two separate result buttons for guardian handoff and platform guidance. Preserve IDs, phase traceability and Pending until phase verification. Mapper does not perform these edits.

**Source:** `.planning/workstreams/widget/REQUIREMENTS.md`, lines 20–29.

```markdown
### Przekazanie opiekunowi

- [ ] **HND-01**: Dziecko widzi podgląd przekazywanych danych przed wysłaniem i potwierdza zapis
- [ ] **HND-02**: „Pokaż opiekunowi” jest oddzielone od instrukcji zgłoszenia na platformie
- [ ] **HND-03**: Dziecko widzi odpowiedź opiekuna

### Mobilna wersja i błędy

- [ ] **MOB-01**: Ta sama ścieżka działa jako mobilna strona do wklejenia tekstu/linku; nie przedstawiana jako natywny widget ani czytnik innych aplikacji
- [ ] **ERR-01**: Pusta treść, niedostępny backend i nieudany zapis mają czytelny komunikat; brak fałszywego potwierdzenia wysłania
```

### `.planning/workstreams/web-app/STATE.md` (model (decision log), file-I/O)

**Analog:** existing Decisions bullets (exact).

First implementation plan adds a scoped D-16 note in Decisions: web-app Phase4 criterion “guardian responds, child sees response” means widget status via GET /api/reports, with no child-visible comments/replies. Append the note without moving current web-app phase/status/progress or rewriting contract. Current Phase2 interpretation already records parent↔teacher comments; this is a widget integration clarification.

**Source:** `.planning/workstreams/web-app/STATE.md`, lines 64–70.

```markdown
## Decisions

- [Phase 02]: Phase 2 marked complete by hand on 2026-10-04 at the user's request: UAT done by the user (6 passed, 2 waived), 02-VERIFICATION.md is stale after the one-line dialog centering fix (m-auto in TransitionDialog.tsx) and was deliberately not re-run to save tokens.

- [Phase 01]: 01-01: extension scope (parent only) creates and lists reports and reads /api/auth/me; detail, transitions and comments need panel scope
- [Phase 01]: 01-01: error check order 401, endpoint 403, 413/400, 400 validation, 404 (missing or invisible), action-role 403, 409, 503/500
- [Phase 01]: 01-01: cursor = base64url of {c: created_at, i: id}, order created_at desc then id desc; taken_actions deduplicated and stored in canonical order
```

### `projects/widget/README.md` (model (documentation), file-I/O)

**Analog:** existing run/demo/privacy guidance (exact).

Inferred additional touch point: lines7–19 still prescribe local guardian request, immediate future sending and result sharing; lines91–95 claim no network/no storage permission. These conflict with D-01/D-10/D-13 and must be updated as phase run instructions. Document installation/login/options/logout, AURA_API dev build, exact consent sequence, storage limited to demo login, reports-list refresh, manual/uncertain retries and handoff vs platform separation. Use manual checks grounded in UI-SPEC, not new automated test files. Preserve existing capture/drag/Unicode/bfcache cautions.

**Source:** `projects/widget/README.md`, lines 7–9.

```markdown
**Zatwierdzenie w fazie 2 jest lokalne: nie wysłało niczego do rzeczywistego opiekuna.** Sprawa trafia do pamięci service workera, a reguły i odpowiedzi działają w pamięci karty. Po ukończeniu pytań osobny przycisk na wyniku „Poproś opiekuna o sprawdzenie” uruchamia lokalny mock na potrzeby prezentacji. Dopiero udany zapis zatwierdzonej sprawy i aktualnego wyniku pokazuje „Przekazano opiekunowi — demo”. Samo zatwierdzenie, wyświetlenie wyniku lub poprawienie odpowiedzi nie uruchamia prośby. Nie ma rzeczywistego doręczenia, API opiekuna, AI ani oceny reputacji linku.

Przeniesiona decyzja dla fazy 3: po zatwierdzeniu sprawa ma być od razu przekazywana opiekunowi, a wynik dopisywany później. Starszy `.planning/shared/CONTRACT.md` i HND-02 nie odzwierciedlają jeszcze tego modelu i wymagają uzgodnienia przez właściciela kontraktu. Rzeczywiste API i odpowiedź opiekuna pozostają w fazie 3. Faza 2 udostępnia wyłącznie lokalny mock demo po jawnym kliknięciu na wyniku; nie zmienia wspólnych materiałów. Decyzja UAT P7 zachowuje teksty `guardianNotice` i `howToPrivacy` („…zobaczy Twój opiekun”) jako zapowiedź docelowej widoczności. Potwierdzenie demo wyraźnie wyjaśnia, że nie oznacza rzeczywistego doręczenia.
```

**Source:** `projects/widget/README.md`, lines 91–95.

```markdown
Szkic, bufor wklejania, odpowiedzi i wynik są tylko w pamięci karty. Zamknięcie okna, schowanie rekina, zmiana karty i zmiana kanału SPA zachowują szkic oraz trwające sprawdzanie. Po kliknięciu rekina wraca ten sam ekran: wskazówka bezpieczeństwa, jedno z trzech pytań, wynik albo potwierdzenie demo. Przeładowanie, opuszczenie dokumentu i powrót „Wstecz”, również z bfcache, kasują stan karty i unieważniają spóźnione odpowiedzi. Nie oznacza to usunięcia ulotnych rekordów osobnego service workera. Nowe zaznaczenie zastępuje niezatwierdzony szkic dopiero po kliknięciu „Wstaw nowe zaznaczenie”. W trakcie sprawdzania przycisk „Sprawdź nowe zaznaczenie” otwiera osobny podgląd; stara sprawa i odpowiedzi zostają aż do udanego zatwierdzenia nowej treści.

„Edytuj wiadomość” otwiera kopię zatwierdzonego tekstu i linku. „Wróć do sprawdzania” anuluje edycję lub podgląd nowego zaznaczenia i wraca do poprzedniego pytania albo wyniku. Sama edycja, podgląd i anulowanie nie tworzą sprawy. Udane ponowne zatwierdzenie zmienionego tekstu **lub samego linku** rozpoczyna wskazówkę bezpieczeństwa i trzy puste pytania. Niezmieniona treść po normalizacji zachowuje postęp. Błąd zatwierdzenia zachowuje edytowaną kopię i starą sesję; przeładowanie zalecane przez komunikat usuwa je obie. Treści nie zapisują się w trwałej pamięci przeglądarki ani na dysku. W fazie 2 nie ma wysyłki sieciowej.

Uprawnienia: `activeTab` i `scripting`, do przywracania po kliknięciu ikony. Nie ma uprawnienia storage. Otwarty shadow root może być czytany przez stronę; zatrzymywanie zdarzeń chroni jedynie przed listenerami klawiatury w fazie bubble. To zaakceptowane ograniczenia MVP z fikcyjnymi danymi, z wariantem panelu iframe w razie problemu na Discordzie.
```

## Shared Patterns

### 1. Relative imports and bundle isolation

Widget files use relative `.js` imports; `?raw`/`?inline` asset imports are handled by build.mjs's queryPlugin (lines13–28). Web-app uses React/Next and `@/` aliases. Translate logic/data locally; never copy its import block into widget code. package.json has only devDependencies and this phase adds no runtime dependency. `host.js`'s CSS isolation stays; options gets normal document CSS.

### 2. Fixed DTO and manual validation

Apply to case.js, draft.js, integration.js and SW. Local immutable case has six keys; report request has only four keys, and local request identity remains outside the JSON body. Use `exactKeys` from sw.js for runtime boundaries and canonical enums/action subset checks for report payloads. Reuse one payload snapshot for preview/send; no result/answers/page hostname go to backend. Send taken_actions as a unique canonical-order subset, including [] when unchecked. Existing backend rejects duplicate actions even though contract prose says deduplication: emitting a unique subset works with both, so no contract/source change is needed.

Backend validation source `projects/web-app/src/lib/server/validate.ts` lines132–151 checks ACTIONS_BY_ATTACK_TYPE and rejects duplicates; lines160–166 trims content, counts code points and rejects unstorable Unicode. This is a read-only conformance reference, not a module to import. Widget should retain Array.from length handling; 2000+2048 is safely below 5000 after the Link label. A malformed report response must not trigger a success UI.

### 3. API result/error handling

Apply to SW, adapter and both UIs. Copy web-app's contract-code/status fallback and safe JSON parse, but tighten successful report/login/list response validation instead of TypeScript casting. A plain runtime acknowledgement is not a server acknowledgement. 503 storage_unavailable → “Nie wysłano — brak połączenia”; other non2xx → “Nie wysłano”; missing login/invalid_credentials after refresh → no-account notice; context invalidation → refresh-page message; ambiguous POST failure → “Nie wiemy, czy dotarło”. GET failure → list error/retry. 401 after a valid report operation is the sole one-time transparent POST replay exception.

**Source:** `projects/web-app/src/app/_panel/api.ts`, lines 65–69.

```typescript
function failureFromResponse(status: number, payload: unknown): ApiFailure {
  const error = isRecord(payload) && isRecord(payload.error) ? payload.error : null;
  const code = error && isApiErrorCode(error.code) ? error.code : (CODE_BY_STATUS[status] ?? "internal_error");
  return httpFailure(status, code, error ? envelopeDetails(error) : []);
}
```

**Source:** `projects/web-app/src/app/_panel/api.ts`, lines 102–115.

```typescript
  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (response.status === 204) {
    return { ok: true, value: undefined as T };
  }
  if (response.ok) {
    return payload === null ? httpFailure(response.status, "internal_error") : { ok: true, value: payload as T };
  }
  return failureFromResponse(response.status, payload);
```

Adaptation: web-app accepts any non-null successful JSON and 204; report creation needs a saved report object and normally 201 (CONTRACT). Do not treat 204, `{ok:true}`, malformed JSON or a fulfilled fetch promise as report creation. UI-SPEC says no health probe; no generic automatic resend.

### 4. Session identity and generation guards

Apply to SW session refresh, content controller, draft POST/list callbacks. Reuse the non-destructive expiry check, save-failure handling and stale-session identity idea from web-app session.ts; do not copy localStorage, React hooks or panel redirect-on-expiry. Extension storage stays behind SW and is re-read after worker restart. A late refresh cannot resurrect logout or overwrite a newer login. A status read is local even when the stored token expired; actual renewal waits until an explicit API operation.

**Source:** `projects/web-app/src/app/_panel/session.ts`, lines 141–146.

```typescript
// A 401 for `token`: ends the session with the expired notice, but only while that token is still
// the stored one. A request that started before a newer login (in this or another tab) can answer
// 401 late; it must not wipe the newer session.
export function expireSession(token: string): void {
  if (decodeSession(readStoredSession())?.token !== token) return;
  clearSession("expired");
```

For case mutations use draft.js gen/submissionKind guards, while account changes and list requests require their own identity checks. Confirmed sent state survives answer correction and panel close, but not a new approved case/document. Volatile SW last-outcome entries must not leak across documents or account changes.

### 5. DOM safety, focus and manual validation

Apply to panel/options. Reuse createElement + textContent and event listeners, never innerHTML or untrusted links. Inputs are native and labels/fieldset legends provide accessible names. Preserving focused IDs through a render is necessary when filtering actions. Fixed destination anchors alone may open new tabs. Drag calls placePanel without re-rendering or making requests. Reuse tinted notice/error styling and shared palette; list statuses have no risk colors. This workstream writes no new automated tests: use the existing affected files below only where implementation changes their assumptions, plus the required manual UI/API checks.


## Existing Tests Affected

These are existing tests/harnesses to adapt if their assumptions are touched. They are not a list of new tests to write. No tests were changed or run by the mapper. Paths are relative to `projects/widget/` in this table.

| Existing file | Role / data flow | Closest analog / evidence | Impact |
|---|---|---|---|
| `tests/unit/guardian-request.test.js` | test / event-driven → request-response | itself, 18–35, 38–68, 137–229 | Direct replacement: imports old protocol/function, expects synchronous SW callback and in-memory full-result records; controller fixtures must support options/storage/async replies and actual DTO/outcome. Reuse existing malformed-message, duplicate, close/hide, stale-reply checks with new semantics. |
| `tests/unit/panel.test.js` | test / event-driven → DOM | itself, 9, 21–26, 261–305 | Direct: two-button menu, old handler/strings, result focus on correction, guardian error on result, bare confirmation render without saved report. Update to preview/send outcomes, menu order and current copy/focus. |
| `tests/unit/draft.test.js` | test / event-driven → transform | itself, 139–211 | Direct: beginGuardianRequest/guardianRequested/guardianRequestFailed and result→confirmation transaction. Preserve generation/lifecycle invariants while adapting flow and sent guard. |
| `tests/unit/source-scan.test.js` | test / file-I/O → validation | itself, 7–23 | Direct: globally forbids fetch/storage and host_permissions, exact two permissions, allows runtime.sendMessage only in integration and Polish only in ui/strings. Scope network/storage exceptions strictly to SW (or any planned worker-only modules); permit copied contract/demo/options copy where needed, keep content/page storage and unsafe HTML forbidden. |
| `tests/e2e/check.spec.mjs` | test / event-driven → request-response | itself, 35–78, 92–125; many message counts through 484 | Direct: old guardian demo CTA/full-result records, two messages, focus and old text. Existing line63 already expects copy different from current strings; record as pre-existing drift, not proof of a phase regression. Requires controlled extension session/API replies for adapted existing scenarios; real report POST invalidates assertOnlyLocal for those sends. |
| `tests/e2e/draft.spec.mjs` | test / event-driven + storage checks | itself, 45, 49 | Direct: chrome.storage expected undefined. Replace that assumption with credentials-only persistence; case/draft must remain absent from storage. Conditional extra runtime-message counts at result. |
| `tests/e2e/menu.spec.mjs` | test / event-driven → DOM | itself, 9–19 | Direct: two-button menu and three-step test title; actual steps read strings. Update existing order/copy expectations; local approval must still not call API. |
| `tests/e2e/extension.fixture.mjs` | test harness / event-driven network observation | itself, 11–25, 30–35 | Conditional harness adaptation for install-opened options tab, local API configuration/session setup and existing handoff scenarios. assertOnlyLocal still valid for capture/checking; do not globally loosen it to allow arbitrary network. |
| `tests/unit/approve.test.js` | test / event-driven → request-response | itself, 32–49 and later controller fixtures | Conditional: minimal runtime mocks, generic pending callback and exact send-call counts break if approval/status messaging changes. Preserve local approval semantics; these assertions need no rewrite if that path remains unchanged. |
| `tests/unit/no-background-reading.test.js` | test / event-driven observation | itself, 21–37 | Conditional: requires no runtime send on boot and exactly one approval message. Prefer lazy local session queries; if messaging changes, distinguish harmless local status from API/content sending without weakening deliberate capture/zero-network assertions. |
| `tests/e2e/avatar.spec.mjs` | test / event-driven layout | itself, 97–178 | Conditional: result-view runtime-message counts/old focus need adjustment if status read is added. Keep zero additional requests/recapture/re-render during drag. |
| `tests/e2e/content.spec.mjs` | test / transform + event-driven | itself, 4–12 | Conditional: approved-case debug memory and count depend on retained local approval. Supplied URL must still stay text; new fixed trusted links are limited to platform view. |
| `tests/e2e/edges.spec.mjs` | test / event-driven validation | itself, 37–44 | Conditional: one case/one message after double approval assumes existing local ACK instrumentation. Preserve one local approval and zero report POST until explicit send. |

**Existing test patterns to preserve (not new tests):**

**Source:** `projects/widget/tests/unit/guardian-request.test.js`, lines 54–61.

```javascript
test('guardian adapter sends only the approved case and current keyed result', async () => {
  const send = vi.fn().mockResolvedValue({ ok: true });
  vi.stubGlobal('chrome', { runtime: { sendMessage: send } });
  const c = approvedCase(); const result = keyedResult(c);
  expect(messages.MSG_GUARDIAN_REQUEST).toBe(requestType);
  expect(integration.requestGuardianVerification).toBeTypeOf('function');
  expect(await integration.requestGuardianVerification(c, result)).toEqual({ ok: true });
  expect(send).toHaveBeenCalledExactlyOnceWith({ type: requestType, case: c, result });
```

The above explicitly encodes the obsolete case+result protocol; replace its expected payload with the report boundary rather than retaining that protocol just to keep it passing.

**Source:** `projects/widget/tests/unit/draft.test.js`, lines 176–187.

```javascript
test('guardian failure retains case answers and result while retry rejects the old token', () => {
 const s = storeAt('result'); const check = s.get().check;
 const token = s.beginGuardianRequest(); expect(s.guardianRequestFailed(token)).toBe(true);
 expect(s.get().check).toBe(check);
 expect(s.get()).toMatchObject({ view: 'result', error: 'guardianRequest', submitting: false });
 const retry = s.beginGuardianRequest(); expect(retry).toBeGreaterThan(token); const pending = s.get();
 expect(s.guardianRequested(token)).toBe(false); expect(s.guardianRequestFailed(token)).toBe(false);
 expect(s.get()).toBe(pending); expect(s.guardianRequested(retry)).toBe(true);
 expect(s.get().check.case).toBe(check.case); expect(s.get().check.answers).toBe(check.answers);
 expect(s.get().check.result).toBe(check.result);
 expect(s.get().check).toMatchObject({ step: 'confirmation', resumeStep: 'confirmation' });
 expect(s.beginGuardianRequest()).toBeNull(); expect(s.guardianRequested(retry)).toBe(false);
```

Reuse the stale-token rejection and state identity assertions with the new send-preview flow.

**Source:** `projects/widget/tests/unit/source-scan.test.js`, lines 20–25.

```javascript
test('manifest keeps the minimal permission and exposure contract', () => {
  const manifest = JSON.parse(fs.readFileSync(path.resolve(src, '../manifest.json'), 'utf8'));
  expect(manifest.permissions).toEqual(['activeTab', 'scripting']);
  for (const key of ['host_permissions', 'externally_connectable', 'web_accessible_resources']) expect(manifest).not.toHaveProperty(key);
  expect(manifest.action).not.toHaveProperty('default_popup');
  expect(manifest.content_scripts[0].all_frames).toBeFalsy();
```

Permission/network/storage exceptions must be narrow and derived from Phase03 decisions; blanket removal of the privacy guards would lose inherited coverage.


## No Analog Found

| Target / behavior | Role | Data Flow | Gap and planner action |
|---|---|---|---|
| `projects/widget/src/options/login.html` | component / config | file-I/O → event-driven | No complete extension options HTML page exists. LoginScreen supplies DOM/flow only; create packaged external script/CSS shell and build/manifest wiring. This is the one file counted as no complete analog. |
| SW credentials-only chrome.storage.local + silent re-login | service | storage file-I/O → request-response | Widget has no storage permission or session; web-app localStorage redirects on expiry and never retains code. New refresh logic must handle concurrent callers, failed storage, logout/new-account races, bounded 401 replay and secret-free responses. |
| SW volatile per-tab/document/case report outcome | service / store | event-driven → request-response | Current SW has global arrays, no keyed outbox/outcome lifetime. Tab draft has guards, but worker restart loses its globals. Keep tab sent/outcome state, bound/clean volatile worker entries and treat lost replies honestly; do not persist report content. |
| POST transport certainty classification | service | request-response | web-app returns one generic network failure. Browser fetch does not reliably reveal DNS vs connection lost after backend acceptance. A 15s timeout or generic rejected started fetch must be delivery-unknown unless there is reliable evidence request never started (e.g. pre-send known offline). Do not infer “not sent” merely from TypeError or fabricate certainty required by UI-SPEC 286. |
| attack_type proposal / hostname→source enum | utility | transform | Current result signals omit organization/link-only categories; local case.source is a hostname. New pure projection/rule is required, using answers plus signals and origin, without altering existing result schema or sending these inputs. |
| Report POST and saved-object guard | service | request-response | No current widget backend writer; panel api.ts supplies transport, not POST /api/reports. Add four-field request and runtime report validation. Lost/invalid 2xx body never yields confirmed success; malformed successful response may be ambiguous delivery. |

No RESEARCH.md fallback exists. Resolve these bounded gaps from the locked CONTEXT/UI-SPEC, API contract and the concrete partial analogs above; do not expand the API, add reply endpoints, add mobile UI or add new automated test files.

## Metadata

**Analog search scope:** tracked widget build/config/core/background/content/UI/tests/README; web-app panel login/API/session/copy, contract constants/demo accounts and server request validation; shared contract/examples; canonical phase decisions/security/UI; palette/avatar assets.
**Files scanned/read:** 38 source/config/documentation/test-harness files (including the read-only backend validation excerpt), 16 planning/contract/example documents, plus the delegated role definition. Existing analogs were checked for tracked provenance; no subagents, build, network requests, test run or git mutation were used.
**Pattern extraction date:** 2026-10-04.
**Only mapper output:** `.planning/workstreams/widget/phases/03-przekazanie-opiekunowi-i-b-dy/03-PATTERNS.md`.
**Planner coverage:** 21 primary touch points; 13 existing test/harness entries (7 directly affected, 6 conditional); canonical login, contract constants and reporting-copy sources stay read-only.

