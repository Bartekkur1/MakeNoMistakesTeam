---
phase: 02-panel-opiekuna
verified: 2026-10-03T23:32:43Z
status: human_needed
score: 48/55 must-haves verified (4/4 roadmap success criteria, 3 via user-decision overrides)
covered_files:
  - .planning/workstreams/web-app/phases/02-panel-opiekuna/02-01-PLAN.md
  - .planning/workstreams/web-app/phases/02-panel-opiekuna/02-01-SUMMARY.md
  - .planning/workstreams/web-app/phases/02-panel-opiekuna/02-02-PLAN.md
  - .planning/workstreams/web-app/phases/02-panel-opiekuna/02-02-SUMMARY.md
  - .planning/workstreams/web-app/phases/02-panel-opiekuna/02-03-PLAN.md
  - .planning/workstreams/web-app/phases/02-panel-opiekuna/02-03-SUMMARY.md
  - .planning/workstreams/web-app/phases/02-panel-opiekuna/02-04-PLAN.md
  - .planning/workstreams/web-app/phases/02-panel-opiekuna/02-04-SUMMARY.md
  - .planning/workstreams/web-app/phases/02-panel-opiekuna/02-05-PLAN.md
  - .planning/workstreams/web-app/phases/02-panel-opiekuna/02-05-SUMMARY.md
  - web-app/src/app/_landing/content.ts
  - web-app/src/app/_landing/links.ts
  - web-app/src/app/_panel/CommentForm.tsx
  - web-app/src/app/_panel/LoginScreen.tsx
  - web-app/src/app/_panel/PanelShell.tsx
  - web-app/src/app/_panel/ReportActionsCard.tsx
  - web-app/src/app/_panel/ReportCards.tsx
  - web-app/src/app/_panel/ReportDetailView.tsx
  - web-app/src/app/_panel/ReportListView.tsx
  - web-app/src/app/_panel/ReportRow.tsx
  - web-app/src/app/_panel/Timeline.tsx
  - web-app/src/app/_panel/TransitionDialog.tsx
  - web-app/src/app/_panel/api.ts
  - web-app/src/app/_panel/badges.tsx
  - web-app/src/app/_panel/content.ts
  - web-app/src/app/_panel/detail-state.ts
  - web-app/src/app/_panel/format.ts
  - web-app/src/app/_panel/list-state.ts
  - web-app/src/app/_panel/names.ts
  - web-app/src/app/_panel/session.ts
  - web-app/src/app/_panel/styles.ts
  - web-app/src/app/layout.tsx
  - web-app/src/app/login/page.tsx
  - web-app/src/app/panel/[id]/page.tsx
  - web-app/src/app/panel/layout.tsx
  - web-app/src/app/panel/page.tsx
  - web-app/tests/helpers/panel-fetch.ts
  - web-app/tests/panel/bundle.test.ts
  - web-app/tests/panel/detail-flow.test.ts
  - web-app/tests/panel/detail-state.test.ts
  - web-app/tests/panel/format.test.ts
  - web-app/tests/panel/guardrails.test.ts
  - web-app/tests/panel/list-flow.test.ts
  - web-app/tests/panel/list-state.test.ts
  - web-app/tests/panel/login-flow.test.ts
  - web-app/tests/panel/session.test.ts
  - web-app/tests/panel/timeline.test.ts
  - web-app/tests/panel/transition-flow.test.ts
covered_digest: "v2:sha256:e0207d66d4f41166b1e1bf60db845b910df9d51d5feb5da7335f8b489f8b0a7f"
behavior_unverified: 5
insufficient_spec: 2
overrides_applied: 3
overrides:
  - must_have: "Szczegóły pokazują treść, sygnały, działanie dziecka i odpowiedź o kliknięciu/danych/płatności (roadmap SC2, signals part)"
    reason: "Signals are deferred (phase 1 D-13) and do not exist in the data model; 02-CONTEXT D-04 says the detail shows content, source, attack type and taken_actions as the answer to 'czy już kliknąłeś, podałeś dane lub zapłaciłeś', with no signals section and no empty slot for one. Recorded by the verifier from the user's discuss-phase decision; ROADMAP text was deliberately left unchanged ('zostawiamy plan tak jak jest')."
    accepted_by: "user (02-CONTEXT.md D-04, discuss-phase)"
    accepted_at: "2026-10-03T00:00:00Z"
  - must_have: "Odpowiedź i zmiana statusu są widoczne po stronie dziecka (roadmap SC3)"
    reason: "Children never log in and see nothing (02-CONTEXT D-03, phase 1 D-11). SC3 is verified as: a comment or state change made by one party (parent or teacher) is visible to the other party in the panel. That reading is backed by passing tests."
    accepted_by: "user (02-CONTEXT.md D-03, discuss-phase)"
    accepted_at: "2026-10-03T00:00:00Z"
  - must_have: "Przełączanie ról jest oznaczone jako demonstracyjne (roadmap SC4)"
    reason: "02-CONTEXT D-01/D-02: there is no role switcher (switching role = log out and log in with another account), and the panel UI deliberately marks nothing as demo. The context file tells the verifier to treat this as a user decision, not a gap. The landing page (out of phase scope, UI-SPEC line 488) still labels the accounts as 'Konta demo' and the build as 'Wersja demonstracyjna'."
    accepted_by: "user (02-CONTEXT.md D-01, D-02, discuss-phase)"
    accepted_at: "2026-10-03T00:00:00Z"
behavior_unverified_items:
  - truth: "02-01: /panel without a valid session redirects to /login, /login with a valid session redirects to /panel; until the guard decides only 'Wczytywanie panelu…' renders, nothing flashes and nothing loops"
    test: "Open /panel logged out, log in, reload /login while logged in, let a stored session expire (or edit expires_at into the past) and reload /panel"
    expected: "Exactly one redirect each time, only the loading text before it, the expired banner on /login when an expired entry was stored, never a redirect loop"
    why_human: "The redirects live in useEffect hooks in PanelShell/LoginScreen; vitest runs in node with renderToStaticMarkup only, so no test mounts them"
  - truth: "02-04: 'Odśwież zgłoszenie' refetches while the view stays and keeps an unsent comment draft"
    test: "Type text into 'Nowy komentarz', click 'Odśwież zgłoszenie'"
    expected: "The typed text is still in the field; 'Odświeżono HH:MM' appears"
    why_human: "The draft is lifted useState in ReportDetailView, separate from the reducer; the reducer refresh is tested, the draft preservation in the mounted component is not"
  - truth: "02-05: 'Zostaw bez zmian' and Esc close the dialog without sending anything and the report keeps its state"
    test: "Open any transition dialog, press Esc; reopen, click 'Zostaw bez zmian'"
    expected: "No request is sent (Network tab), the state badge is unchanged, focus returns to the opening button"
    why_human: "Native <dialog> cancel/close events; no DOM test environment (review IN-07)"
  - truth: "02-05: while the transition request is pending the dialog shows 'Zapisywanie…', both buttons are disabled and Esc is ignored; only a 201 closes it, shows 'Zapisano. Obecny stan: …' and refetches"
    test: "Throttle the network (slow 3G or offline), confirm a transition, press Esc twice, then restore the network"
    expected: "The dialog stays open (or reopens at once, WR-06 fix) until the answer; on failure the error shows inside the dialog with the note kept; on 201 the dialog closes and the success line appears"
    why_human: "pendingRef / onCancel / onClose reopen logic is browser-only; the pure transitionOutcome mapper is tested, the lifecycle is not"
  - truth: "02-05: on 409 the dialog closes, the conflict warning appears at the top, the detail is refetched and a typed note moves unsent into the comment field"
    test: "With two profiles, make the other party change the report first, then confirm a transition with a typed note on the stale page"
    expected: "'Sprawa zmieniła się w międzyczasie…' banner, buttons match the new state, the note is in 'Nowy komentarz' with 'Twoja notatka jest w polu nowego komentarza. Nie została wysłana.'"
    why_human: "mergeDraft and the reducer 'conflict' action are unit-tested; the orchestration in ReportDetailView.transitionConflict is not exercised by any test"
human_verification:
  - test: "Two-window demo (02-05 backstop, roadmap SC3): two separate browsers or browser profiles, A = the Ola parent account, B = the 5a teacher account. A approves the pending game report; B clicks 'Odśwież listę', opens it, escalates with an empty note then with 'CERT Polska (NASK)'; A clicks 'Odśwież zgłoszenie'; both add a comment and the other side refreshes"
    expected: "B sees the report only after A approved it, with only 'Zamknij zgłoszenie' and 'Eskaluj zgłoszenie'; the empty escalation note is blocked with 'Wpisz, do kogo eskalowano zgłoszenie.'; A sees 'eskalowane' and the note; comments appear for the other party after refresh"
    why_human: "Two independent sessions in real browsers (same-profile windows share one session by design, UI-SPEC A7); insufficient_spec backstop"
  - test: "Dialog Esc, focus and pending lock (02-05 Task 2 steps 1 and 4, WR-06): Esc / 'Zostaw bez zmian' change nothing; slow network + double Esc keeps the dialog; stale click shows the conflict banner with the note moved"
    expected: "As in behavior_unverified_items 3-5"
    why_human: "Native dialog behavior and focus return need a real browser"
  - test: "Mobile layout at 375px and 320px (02-05 backstop, plus 02-03 and 02-04 checks): login, header, list rows, filter toolbar, detail cards, timeline and dialog"
    expected: "No horizontal scroll; detail order is content, taken actions, change-state card, timeline"
    why_human: "Visual layout; insufficient_spec backstop"
  - test: "02-01 login and session (pending human-check): /panel logged out, empty e-mail, malformed e-mail, wrong code, right code, logout, close and reopen the tab"
    expected: "Redirect after 'Wczytywanie panelu…'; field errors under the fields; wrong code shows 'Nieprawidłowy e-mail lub kod.' with the e-mail kept; header 'Mama Oli' / 'Rodzic' with no '(demo)'; logout shows 'Wylogowano.'; the session survives a closed tab; nothing mentions demo, the code or test accounts"
    why_human: "Redirects, focus and banners happen in a real browser"
  - test: "02-03 list (pending human-check): as the 5a teacher open the 'Stan' filter, pick 'Zamknięte', 'Odśwież listę', reset; as the Ola parent pick 'Czeka na rodzica' then an empty state; 'Pokaż więcej zgłoszeń' focus move"
    expected: "Teacher filter offers only 'U nauczyciela', 'Eskalowane', 'Zamknięte'; old rows stay visible while loading; 'Odświeżono HH:MM'; empty filter shows 'Brak zgłoszeń w stanie „…”' with 'Pokaż wszystkie stany'; focus lands on the first new row"
    why_human: "Native select, aria-busy, focus moves and live regions need a DOM"
  - test: "02-04 detail (pending human-check): as the Ola parent open the closed phishing report; empty comment, then a real comment; refresh with a typed draft; teacher in a second profile refreshes the same report"
    expected: "Plain-text message with a non-clickable link; 'Kliknięcie w link' in crimson with 'ryzykowne'; no signals section; interleaved timeline with '(Ty)'; 'Wpisz treść komentarza.'; new comment under the timeline; draft kept on refresh; teacher sees the comment"
    why_human: "Reading order, focus, two sessions"
  - test: "New copy LOGIN.sessionNotSaved (WR-05, not in UI-SPEC): block site storage (or set the device clock far ahead) and log in"
    expected: "The form unlocks and shows 'Nie udało się zapisać logowania w tej przeglądarce. Zezwól stronie na zapisywanie danych, sprawdź datę w urządzeniu i spróbuj ponownie.'; confirm the wording is acceptable"
    why_human: "New user-facing copy needs product sign-off; browser storage blocking is browser-only"
  - test: "Judgment-tier prohibition (02-03): MUST NOT rank, score or compare children"
    expected: "Reviewer agrees: no per-child counts, no ordering by risk, the risk badge describes one report only"
    why_human: "unverified-prohibition - human review recommended. Verifier's non-authoritative judgment: holds (no counters or aggregates in _panel; list keeps API order, list-flow test 'marks the risky rows of a teacher's list without changing the API order')"
---

# Phase 2: Panel opiekuna Verification Report

**Phase Goal:** Opiekun obsługuje sprawy fikcyjnego dziecka w panelu (lista, szczegóły, odpowiedź i status na danych przykładowych)
**Verified:** 2026-10-03T23:32:43Z
**Status:** human_needed
**Re-verification:** No - initial verification

The automated evidence supports the goal. Login, the list, the detail page, comments and state changes are all in the code, wired to the phase 1 API and covered by tests that drive the real route handlers on the fake Supabase. Three roadmap criteria are met only as reinterpreted by the user's recorded decisions in 02-CONTEXT (D-01..D-04), so they are recorded as overrides. All four plan-level human checks (02-01, 02-03, 02-04, 02-05) are still pending. The browser-only lifecycle of the dialog, the guard and the draft has no test, because vitest runs in `node` with no DOM.

## Goal Achievement

### Roadmap Success Criteria (the contract)

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | Lista pokazuje nowe i zakończone sprawy z datą, źródłem i opisem | VERIFIED | `ReportRow.tsx` renders StateBadge (all 5 states incl. closed), `<time>` with `formatDateTime`, `excerpt(content)`, `rowMeta` = child · source · attack type; links to `/panel/{id}`. `list-flow.test.ts` "renders a row with the state label, Warsaw date, child, source and attack type" and the parent/teacher visibility tests pass through the real `/api/reports` route. |
| 2 | Szczegóły pokazują treść, sygnały, działanie dziecka i odpowiedź o kliknięciu/danych/płatności | PASSED (override) | Content, child, source, attack type, dates (`ReportContentCard`), "Co dziecko już zrobiło" with the question helper and crimson "ryzykowne" items (`TakenActionsCard`) are verified by `detail-flow.test.ts` "report detail cards". Signals are absent by D-04 (override). |
| 3 | Odpowiedź i zmiana statusu są widoczne po stronie dziecka | PASSED (override) | Read through D-03 as parent <-> teacher visibility. Behavioral tests pass: `transition-flow.test.ts` "a parent approves R1 and the teacher then sees it…", "blocks an escalation without a note…, saves it with one and shows it to the parent"; `detail-flow.test.ts` "saves a teacher's comment and shows it to the parent on the next load (D-03)". The UI path (refresh buttons) is reducer-tested; the two-window demo is a human item. |
| 4 | Przełączanie ról jest oznaczone jako demonstracyjne | PASSED (override) | Read through D-01/D-02: no switcher (grep: no role-switch/"zmień konto" control in `_panel`), logout + login with another account. The panel copy guardrail rejects "demo", "0000" and "(smoke)". The fresh `.next/static` has 0 chunks with the demo e-mail domain, `DEMO_LOGIN_CODE`, "(demo)" or "(smoke)" (bundle.test.ts ran against the build from 01:26, which is newer than the last source edit at 01:26:16). The landing page still marks the accounts as demo (out of scope). |

### Plan Must-Have Truths (51)

| Plan | Truths | VERIFIED | PRESENT_BEHAVIOR_UNVERIFIED | insufficient_spec | Notes |
|------|--------|----------|-----------------------------|-------------------|-------|
| 02-01 (PAN-04) | 12 | 11 | 1 (guard redirect / no flash / no loop) | 0 | Two-step login (`LoginScreen.tsx:70-131`): step 1 sends nothing, step 2 `loginRequest` with `scope: "panel"` (login-flow test checks the exact body). Same `invalid_credentials` message for wrong e-mail and wrong code, code cleared and refocused. localStorage key `bezpiecznaaura.panel.session`. Guardrails (b) and (d): no cookies, no token in the URL. `expireSession` and `clearSession` are tested. Header shows the name, role and "Wyloguj się". 400 errors use the panel's own copy. |
| 02-02 (PAN-01) | 7 | 7 | 0 | 0 | `fetchReports` Bearer only. Server visibility and API order are covered by tests. Excerpt is 140 chars + "…". Child name fallback. Warsaw dates, also across midnight (format.test). `layout.tsx:9` weights 500/600/700. |
| 02-03 (PAN-01) | 10 | 10 | 0 | 0 | `listReducer` covers paging with the cursor passed verbatim, dedupe, refresh dropping appended pages, the stale-request guard and the WR-01 failed-filter reset. Filter offers `TEACHER_VISIBLE_STATES` to a teacher. Empty and filtered-empty states. Skeleton uses `motion-safe:animate-pulse`. Risk badge order is covered by tests. The focus move after "Pokaż więcej" is computed in the reducer; the DOM part is in the human checks. |
| 02-04 (PAN-02, PAN-03) | 12 | 11 | 1 (refresh keeps the unsent draft) | 0 | Detail h1, badges, blockquote, dl. Taken actions in canonical order, with "ryzykowne" and the empty copy. `mergeTimeline` ordering is tested. A malformed id skips the request (`isReportId` check before the effect fetch). 404 shows the not-found view. Comment 201 appends and announces. Blank comment is blocked. `draftAfterSent` is tested. Counters use `maxLength` from `LIMITS`. |
| 02-05 (PAN-03) | 10 | 6 | 3 (dialog Esc/dismiss; pending lock; 409 orchestration) | 2 (mobile layout; two-window demo) | `ReportActionsCard` uses `orderedActions(availableActions(state, role))`; button labels and the "none" copy are tested. Escalation note is required on both client and server. `transitionOutcome` returns "done" only for ok (tested). 404/400/403/503/network map correctly (tested). Cross-party visibility is tested. |

**Score:** 48/55 (4 roadmap + 51 plan truths; 3 roadmap truths PASSED by override). 5 present but behavior-unverified, 2 insufficient_spec backstops.

### Prohibitions

| Plan | Prohibition | Tier | Disposition | Evidence |
|------|-------------|------|-------------|----------|
| 02-01 | No demo marker in panel UI | test | VERIFIED | `guardrails.test.ts`: copy scan, direct and transitive import check against `demo-accounts.ts` and `_landing/content.ts`. `bundle.test.ts` checks the build output. Fresh `.next/server/app/{login,panel}.html`: 0 domain and 0 "0000" matches. |
| 02-01 | No route or view for the child | test | VERIFIED | `guardrails.test.ts` route allowlist: `page.tsx`, `login/page.tsx`, `panel/page.tsx`, `panel/[id]/page.tsx`. |
| 02-03 | No ranking, scoring or comparing of children | judgment | FLAGGED (non-authoritative: holds) | No aggregates or counters in `_panel`. The list never re-sorts (test). Routed to human review. |
| 02-04 | No clickable URLs and no HTML rendering of content, comments or notes | test | VERIFIED | `detail-flow.test.ts` "escapes HTML-looking content and never turns a URL into a link"; `timeline.test.ts` "renders comment and note text as escaped plain text"; guardrail (b) forbids raw HTML. |
| 02-05 | No saved confirmation before a 2xx | test | VERIFIED (transition by test; comment by code inspection) | `transition-flow.test.ts` "never reports done for a failure". `CommentForm.tsx:62-65` calls `onAdded` only on `result.ok`. No component test covers the comment path. |

### Required Artifacts

`gsd-tools verify.artifacts`: 02-01 9/9, 02-02 6/6, 02-03 4/4, 02-04 6/6, 02-05 4/4. Every artifact exists, has substantive content (no stubs; 23-327 lines each) and is imported by its route or parent component.

### Key Link Verification

`gsd-tools verify.key-links`: 02-01 4/4, 02-02 4/4, 02-03 3/3, 02-04 4/4, 02-05 3/3 WIRED. Manually confirmed:
- `panel/layout.tsx` -> `<PanelShell>`
- `panel/page.tsx` -> `<ReportListView>`
- `panel/[id]/page.tsx` -> `<ReportDetailView>`
- `ReportRow` -> `reportHref`
- `ReportActionsCard` -> `availableActions`
- `TransitionDialog` -> `postTransition`
- `CommentForm` -> `postComment`
- `ReportDetailView` -> `mergeDraft`

### Data-Flow Trace (Level 4)

| Artifact | Data | Source | Real data | Status |
|----------|------|--------|-----------|--------|
| ReportListView | `state.reports` | `fetchReports` -> `GET /api/reports` (phase 1 route, Supabase) | Yes (tests run the real route on the fake Supabase with the demo dataset) | FLOWING |
| ReportDetailView | `state.report` | `fetchReport` -> `GET /api/reports/{id}` | Yes | FLOWING |
| Timeline | history + comments | `report.history`, `report.comments` from the detail response, `comment-added`, `transition-done` | Yes | FLOWING |
| PanelHeader | account | localStorage session from the `POST /api/auth/login` response | Yes | FLOWING |
| names.ts | display names | static id -> name map; format.test asserts it equals the demo accounts and children with the suffix stripped | Static by design (CR-01 fix) | OK |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Panel suite (login, list, detail, comments, transitions, guardrails, bundle) | `vitest run tests/panel` | 11 files, 164 passed, 0 skipped | PASS |
| Typecheck | `tsc --noEmit` | exit 0 | PASS |
| Build freshness vs source | `stat .next/BUILD_ID` vs newest `_panel` file | build 01:26:38 > source 01:26:16 | PASS |
| Client bundle leak | grep `.next/static` for the demo domain, `DEMO_LOGIN_CODE`, "(demo)", "(smoke)", `"0000"` | 0 files | PASS |
| Server-rendered `/login` and `/panel` | grep `.next/server/app/{login,panel}.html` | 0 domain, 0 "0000" | PASS |
| Full suite, build, lint | the orchestrator ran them (502 passed, exit 0). Not rerun here (one-full-run rule). Phase 2 changed no backend file (WIP commit 3fcf50d plus working tree touch only `_panel`, routes, `layout.tsx`, `_landing/content.ts` and `links.ts`) | n/a | PASS (by orchestrator) |

### Probe Execution

None declared. No `probe-*.sh` in the plans or under `scripts/*/tests/`.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| PAN-01 | 02-02, 02-03 | List of new and finished reports (date, source, short description) | SATISFIED | SC1 evidence above |
| PAN-02 | 02-04 | Details: content, signals, child's action, the click/data/payment answer | SATISFIED (read through D-04, signals deferred) | `ReportCards.tsx`, detail-flow tests |
| PAN-03 | 02-04, 02-05 | Send a reply and change the status; the reply reaches the other side | SATISFIED (read through D-03) | comment and transition cross-party tests; two-window demo pending human |
| PAN-04 | 02-01 | Fictional profiles, demo role switching marked | SATISFIED (read through D-01/D-02) | guardrails, bundle test, no switcher |

Orphaned requirements: none. REQUIREMENTS.md maps exactly PAN-01..04 to Phase 2 and every one is claimed by a plan. REQUIREMENTS.md still says "PAN-02/PAN-03/PAN-04 opisują stary model - do przeglądu przed fazą 2". The text was never revised and the interpretation lives only in 02-CONTEXT (Info).

### Decision Coverage

`check.decision-coverage-verify`: 15/15 trackable CONTEXT decisions honored ("All trackable CONTEXT.md decisions are honored by shipped artifacts."). Non-blocking.

### Test Quality Audit

| Test File | Linked Req | Skipped | Circular | Assertion Level | Verdict |
|-----------|-----------|---------|----------|-----------------|---------|
| list-flow, list-state, format | PAN-01 | 0 | No (real routes + fixed dataset) | Value / behavioral | OK |
| detail-flow, detail-state, timeline | PAN-02, PAN-03 | 0 | No | Value / behavioral | OK |
| transition-flow | PAN-03 | 0 | No | Behavioral (multi-account round trips) | OK |
| login-flow, session, guardrails | PAN-04 | 0 | No | Value | OK |
| bundle | PAN-04 (D-02) | conditional `describe.skipIf(!existsSync(.next/static))` | No | Value | WARNING: only meaningful after a fresh `next build`; ran and passed now |

Disabled tests on requirements: 0. Circular patterns: 0. Insufficient assertions: 0. Structural gap (review IN-07): there are no component or DOM tests. All handler orchestration is verified only by reading the code, and that is why there are 5 PRESENT_BEHAVIOR_UNVERIFIED truths.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| (all phase files) | - | TBD/FIXME/XXX/TODO/HACK | none found | - |
| `_panel/ReportActionsCard.tsx` + `detail-state.ts:136` | 54-58 | Transition success announced twice (IN-01, open) | Info | Screen reader repetition |
| `_panel/ReportActionsCard.tsx` | 64-73 | Focus falls to body after a confirmed transition (IN-02, open) | Info | Keyboard UX |
| `_panel/format.ts` / `CommentForm.tsx` | 313-317 / 113 | Moved note can push the draft over 2000 with no client block (IN-03); UTF-16 counters vs server code points (IN-05) | Info | Server 400 instead of a client message |
| `_panel/format.ts` | 50-51, 121 | Unparseable date throws / NaN sort (IN-04) | Info | Defensive only |
| `_panel/ReportDetailView.tsx` | 291, 301 | `load-not-found` reuses the current request id (IN-06) | Info | A late 200 could replace the not-found view |
| `src/lib/server/validate.ts` | 60 | Server message "(w demo: 0000)" on a blank code | Info (out of scope, contract owner) | The panel never renders it |
| landing `index.html` | - | Landing publicly lists the presentable demo accounts and the code (`Install.tsx`) | Info (pre-existing, out of scope per UI-SPEC line 488) | CR-01's "enumerate accounts" risk is mostly moot. The fix still keeps the smoke accounts and markers out of the panel bundle |

### Human Verification Required

See `human_verification` in the frontmatter (8 items). In short:
1. **Two-window demo** with two browser profiles (roadmap SC3, 02-05 backstop)
2. **Dialog behavior:** Esc, "Zostaw bez zmian", focus return, pending lock under a slow network with double Esc (WR-06), and the 409 conflict with the note moved
3. **Layout** at 375px and 320px (02-05 backstop)
4. **02-01 login and session** human-check (pending)
5. **02-03 list** human-check (pending)
6. **02-04 detail** human-check (pending; also covers the draft kept on refresh)
7. **New copy** `LOGIN.sessionNotSaved` (WR-05) needs wording sign-off
8. **Judgment prohibition:** no ranking of children (verifier's non-authoritative verdict: holds)

### Gaps Summary

No blocking gaps. Every artifact exists, has real content and is wired, and data flows from the phase 1 API. The suite is green, typecheck passes, and the fresh build ships no demo e-mail, code or marker in the panel bundle. The CR-01 and WR-01..08 fixes are present in the code. The phase is not `passed` for three reasons:
- **Overrides:** three roadmap criteria are met only through the user's recorded reinterpretation (D-01..D-04), now written down as overrides.
- **Untested browser behavior:** five behavior-dependent truths (session guard redirects, draft kept on refresh, dialog cancel, pending lock, 409 orchestration) live in component code that no test mounts.
- **Pending human checks:** all four plan-level human checks and the two UI-SPEC backstops still need a person in a browser.

---

_Verified: 2026-10-03T23:32:43Z_
_Verifier: Claude (gsd-verifier)_
