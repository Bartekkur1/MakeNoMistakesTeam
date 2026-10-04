---
status: complete
phase: 02-panel-opiekuna
source: [02-VERIFICATION.md]
started: 2026-10-04T01:40:00Z
updated: 2026-10-04T02:10:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Two-window demo (02-05 backstop, roadmap SC3)
Two separate browsers or browser profiles, A = the Ola parent account, B = the 5a teacher account. A approves the pending game report; B clicks 'Odśwież listę', opens it, escalates with an empty note then with 'CERT Polska (NASK)'; A clicks 'Odśwież zgłoszenie'; both add a comment and the other side refreshes.
expected: B sees the report only after A approved it, with only 'Zamknij zgłoszenie' and 'Eskaluj zgłoszenie'; the empty escalation note is blocked with 'Wpisz, do kogo eskalowano zgłoszenie.'; A sees 'eskalowane' and the note; comments appear for the other party after refresh
result: pass - issue found and fixed: confirm dialog was pinned to the top-left corner (Tailwind preflight margin:0 on native <dialog>); added m-auto in TransitionDialog.tsx

### 2. Dialog Esc, focus and pending lock (02-05, WR-06)
Esc / 'Zostaw bez zmian' change nothing; with a slow or cut network, confirm a state change and press Esc twice; with a stale state in one window, click the old action with a typed note.
expected: Esc and 'Zostaw bez zmian' send nothing and focus returns to the button; the dialog stays (or reappears) during the pending request and shows its result; the stale click shows 'Sprawa zmieniła się w międzyczasie…' with the note moved unsent into the comment field
result: skipped - user waived for the hackathon POC (Esc on approve confirmed working in walk-through step 4)

### 3. Mobile layout at 375px and 320px
Login, header, list rows, filter toolbar, detail cards, timeline and dialog.
expected: No horizontal scroll; detail order is content, taken actions, change-state card, timeline
result: pass

### 4. 02-01 login and session
/panel logged out, empty e-mail, malformed e-mail, wrong code, right code, logout, close and reopen the tab.
expected: Redirect after 'Wczytywanie panelu…'; field errors under the fields; wrong code shows 'Nieprawidłowy e-mail lub kod.' with the e-mail kept; header 'Mama Oli' / 'Rodzic' with no '(demo)'; logout shows 'Wylogowano.'; the session survives a closed tab; nothing mentions demo, the code or test accounts
result: pass

### 5. 02-03 list
As the 5a teacher open the 'Stan' filter, pick 'Zamknięte', 'Odśwież listę', reset; as the Ola parent pick 'Czeka na rodzica' then an empty state; 'Pokaż więcej zgłoszeń' focus move.
expected: Teacher filter offers only 'U nauczyciela', 'Eskalowane', 'Zamknięte'; old rows stay visible while loading; 'Odświeżono HH:MM'; empty filter shows 'Brak zgłoszeń w stanie „…”' with 'Pokaż wszystkie stany'; focus lands on the first new row
result: pass

### 6. 02-04 detail
As the Ola parent open the closed phishing report; empty comment, then a real comment; refresh with a typed draft; teacher in a second profile refreshes the same report.
expected: Plain-text message with a non-clickable link; 'Kliknięcie w link' in crimson with 'ryzykowne'; no signals section; interleaved timeline with '(Ty)'; 'Wpisz treść komentarza.'; new comment under the timeline; draft kept on refresh; teacher sees the comment
result: pass

### 7. New copy LOGIN.sessionNotSaved (WR-05, not in UI-SPEC)
Block site storage (or set the device clock far ahead) and log in.
expected: The form unlocks and shows 'Nie udało się zapisać logowania w tej przeglądarce. Zezwól stronie na zapisywanie danych, sprawdź datę w urządzeniu i spróbuj ponownie.'; the wording is acceptable
result: skipped - user waived; wording not signed off

### 8. No ranking, scoring or comparing of children (02-03 prohibition)
Review the list and detail views.
expected: No per-child counts, no ordering by risk; the risk badge describes one report only
result: pass - user confirmed list/detail views; no ranking observed

## Summary

total: 8
passed: 6
issues: 0
pending: 0
skipped: 2
blocked: 0

## Gaps

- Dialog centering (test 1): fixed in place (m-auto), tests 502/502 and lint pass; not re-checked in a browser.
