---
status: diagnosed
trigger: "G-02-2 (02-UAT test 2): brak możliwości wysłania do opiekuna i prośby o weryfikację; mock jak w fazie 1 dalej powinien działać"
created: 2026-10-04T00:00:00Z
updated: 2026-10-04T00:20:00Z
goal: find_root_cause_only
---

## Current Focus

bug_class: Bohrbug (deterministic; every run of the flow ends at result with no hand-off)
hypothesis: CONFIRMED. Phase 02-01 retargeted approved() from 'confirmation' to 'safety' (by plan), and no phase-2 plan added any hand-off step after 'result'; the phase-1 visible mock (Zatwierdzam -> SW stores case -> "Gotowe!") lost its only visible endpoint, and nothing carries the result to the guardian mock.
test: drove createDraftStore through click -> approve -> safety -> 3 questions -> result in node; grepped source for any send/guardian/confirm transition
expecting: (met) confirmation never reached; no store method or panel handler for a guardian hand-off
next_action: return ROOT CAUSE FOUND to caller (diagnose-only)

reasoning_checkpoint:
  hypothesis: "The guardian hand-off is missing because commit 5e9600a (02-01 Task 1/2, by plan) changed draft.approved() to show 'safety' instead of 'confirmation', and no phase-2 plan added a post-result hand-off, so the phase-1 visible mock endpoint is unreachable and the result has no path to the (mock) guardian."
  confirming_evidence:
    - "git show 5e9600a: approved() changed view 'confirmation' -> 'safety'; panel confirmation branch (panel.js:74-80) left behind, unreachable (02-REVIEW IN-01, disposition open)"
    - "node run of createDraftStore: views preview -> safety -> question x3 -> result; 'confirmation' never reached; store exposes no send/guardian/confirm method"
    - "panel.js:129-153 result view renders only fixAnswers, editCheckContent, optional checkNewSelection buttons"
    - "02-01-PLAN Task 2: 'Update assertions ... expecting confirmationHeading/Gotowe to the safety notice'; 02-CONTEXT:50 'nie implementować wysyłki w fazie 2'; README:9 'Faza 2 nie dodaje przycisku wysyłki'"
  falsification_test: "If any reachable state transition after approval led to 'confirmation' or a guardian/send view, or the result view rendered a hand-off control, the hypothesis would be false. Neither exists."
  fix_rationale: "Reconnecting a hand-off action at the end of the result view (reusing the dormant confirmation branch with explicit demo-mock copy, and optionally a mock SW message carrying case+result) restores the phase-1 demo behaviour at the point the user expects it."
  blind_spots: "Did not run the built extension in Chrome; did not run the full vitest/playwright suite (diagnosis only). Exact desired UX (explicit button vs automatic 'sent' status after result) is a product decision."
  candidate_causes:
    - "code: approved() endpoint retargeted to 'safety', result view has no hand-off action"
    - "requirements/spec: phase-2 CONTEXT/plans scoped out any sending and treated the phase-1 confirmation as the hook to replace; the user's demo expectation (mock hand-off persists) was never captured; Pitfall 7 / P7 prohibitions forbade delivery wording"
  and_gate: "yes - the code change was a faithful execution of the plan; the defect needs both the spec gap (no demo hand-off requirement) and the plan-driven replacement of the confirmation endpoint."

## Symptoms

expected: After phase-2 check flow (safety -> 3 questions -> result), child can still "send to guardian / ask for verification" via phase-1 local mock (no network), for demo purposes.
actual: "A.b.c calosc sie udala, ale nie mozliwosci wyslania do opiekuna i prosby o weryfikacje [...] samo api jest odlozone, ale mock tak jak w fazie 1 dalej powinien dzialac"
errors: none
reproduction: 02-UAT test 2 (Chrome + Discord, built extension from projects/widget/dist)
started: discovered in UAT of phase 02 (widget workstream)

## Eliminated

- hypothesis: The service-worker mock integration point (submitCase -> sw.js cases[]) was removed or broken in phase 2
  evidence: sw.js, integration.js, messages.js unchanged since 1cc96fb (phase 1); main.js:49 still calls submitCase(c) on Zatwierdzam; e2e check.spec asserts self.__aura.cases receives the case
  timestamp: 2026-10-04T00:15:00Z
- hypothesis: Phase 1 had an explicit "send to guardian" button that phase 2 deleted
  evidence: Phase 1 UI had only Zatwierdzam -> neutral "Gotowe! Sprawa jest przygotowana do sprawdzenia." (01-01-PLAN:48,117,299; 01-UAT:100); Pitfall 7 forbade delivery wording. The "mock" the user remembers is that approve->confirmation hand-off.
  timestamp: 2026-10-04T00:15:00Z

## Evidence

- timestamp: 2026-10-04T00:05:00Z
  checked: knowledge base (.planning/debug/knowledge-base.md)
  found: does not exist; no prior sessions
  implication: no known-pattern candidate
- timestamp: 2026-10-04T00:06:00Z
  checked: projects/widget/src/core/draft.js:77-88 approved()
  found: on success sets view checkView(check.resumeStep) = 'safety'; never 'confirmation'
  implication: confirmation endpoint unreachable
- timestamp: 2026-10-04T00:07:00Z
  checked: git show 5e9600a (feat(02-01)) diff of draft.js
  found: phase-1 line `view: ... 'confirmation'` replaced by `'safety'`; panel.js confirmation branch left intact
  implication: disconnection point is commit 5e9600a, approved()
- timestamp: 2026-10-04T00:08:00Z
  checked: 02-01-PLAN.md Task 1/Task 2, 02-CONTEXT.md:50,95, README.md:7,9,102, 02-03-PLAN:33,59
  found: plan explicitly replaces confirmation with safety; CONTEXT says "nie implementować wysyłki w fazie 2" and the confirmation screen is "punkt podłączenia ścieżki fazy 2"; README states "Faza 2 nie dodaje przycisku wysyłki"; 02-03 prohibits claiming guardian receipt
  implication: removal was intentional by plan; the demo-mock hand-off expectation was never a phase-2 requirement (spec gap)
- timestamp: 2026-10-04T00:10:00Z
  checked: phase 1 docs (01-01-PLAN:48,117,285,297-299; 01-CONTEXT:13,23,48,56; 01-UAT:100)
  found: phase-1 "mock" = Zatwierdzam -> submitCase -> SW keeps case in in-memory cases[] (self.__aura.cases) -> neutral confirmation "Gotowe! / Sprawa jest przygotowana do sprawdzenia. / Zamknij". No "sent to guardian" wording (Pitfall 7). Phase-3 model: approval itself = consent and immediate send, no separate "Pokaż opiekunowi" button.
  implication: the user's "mock jak w fazie 1" is this approve->confirmation hand-off; in phase 2 the data part still runs at approval but the visible hand-off is gone and the result is never handed off
- timestamp: 2026-10-04T00:12:00Z
  checked: node script driving createDraftStore (scratchpad/flow.mjs)
  found: click:preview -> begin:preview -> approved:safety -> start:question -> q1:question -> q2:question -> q3:result; store methods contain no guardian/send/confirm method; confirmation never reached
  implication: deterministic reproduction of the missing hand-off
- timestamp: 2026-10-04T00:13:00Z
  checked: panel.js:129-153 result view; main.js handlers
  found: result renders summary, 2 sections, step section, buttons fixAnswers, editCheckContent, optional checkNewSelection; no close/hand-off. main.js has no handler for sending result to guardian
  implication: the reconnection point is the result view
- timestamp: 2026-10-04T00:14:00Z
  checked: sw.js, integration.js, messages.js history
  found: unchanged since phase 1; SW stores only the case (no result); MSG_CASE_APPROVED is the only case message
  implication: mock infra exists and can be extended; result is currently never handed off even to the mock
- timestamp: 2026-10-04T00:16:00Z
  checked: tests referencing confirmation/hand-off and constraints
  found: no test references the 'confirmation' view or confirmation strings any more (all switched to STRINGS.safetyNotice: approve.test.js:13,28,47-48,106,147-148,170,189; presence.test.js:43; content.test.js:44-45; panel.test.js:90; menu.spec.mjs:19; draft.test.js:26,33,101,112). source-scan.test.js: chrome.runtime.sendMessage only in core/integration.js, panel.js may not contain 'chrome.', Polish diacritics only in strings.pl.js, no storage/fetch. e2e asserts self.__aura.messages.length (1 or 2) and check.spec:388 asserts exactly 3 .result-section; result view focuses first button (fixAnswers).
  implication: fix must route any mock send through integration.js, keep copy in strings.pl.js, avoid adding a .result-section, and be mindful of first-button focus

## Resolution

root_cause: "Phase 02-01 (commit 5e9600a, executed as planned) retargeted draft.approved() from view 'confirmation' to 'safety' and no phase-2 plan added any hand-off after the 'result' view. The phase-1 demo mock was Zatwierdzam -> local SW stores the case -> visible 'Gotowe!' confirmation; phase 2 kept the silent SW storage at approval but removed its only visible endpoint (panel.js:74-80 confirmation branch is now dead, IN-01) and the result is never handed to the guardian mock. Underlying spec gap: 02-CONTEXT:50 ('nie implementować wysyłki w fazie 2'), 02-01-PLAN Task 2, README:9 ('Faza 2 nie dodaje przycisku wysyłki') and the Pitfall-7/P7 prohibitions never captured the user's requirement that the demo hand-off mock persist."
fix: ""
verification: ""
files_changed: []
