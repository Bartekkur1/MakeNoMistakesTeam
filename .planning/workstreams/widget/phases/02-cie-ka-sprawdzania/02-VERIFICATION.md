---
phase: 02-cie-ka-sprawdzania
verified: 2026-10-03T22:29:58Z
status: human_needed
score: 18/19 must-haves verified
covered_files:
  - .planning/workstreams/widget/phases/02-cie-ka-sprawdzania/02-01-PLAN.md
  - .planning/workstreams/widget/phases/02-cie-ka-sprawdzania/02-01-SUMMARY.md
  - .planning/workstreams/widget/phases/02-cie-ka-sprawdzania/02-02-PLAN.md
  - .planning/workstreams/widget/phases/02-cie-ka-sprawdzania/02-02-SUMMARY.md
  - .planning/workstreams/widget/phases/02-cie-ka-sprawdzania/02-03-PLAN.md
  - .planning/workstreams/widget/phases/02-cie-ka-sprawdzania/02-03-SUMMARY.md
  - projects/widget/README.md
  - projects/widget/src/content/main.js
  - projects/widget/src/core/check.js
  - projects/widget/src/core/draft.js
  - projects/widget/src/ui/panel.js
  - projects/widget/src/ui/strings.pl.js
  - projects/widget/src/ui/widget.css
  - projects/widget/tests/e2e/avatar.spec.mjs
  - projects/widget/tests/e2e/check.spec.mjs
  - projects/widget/tests/e2e/draft.spec.mjs
  - projects/widget/tests/e2e/menu.spec.mjs
  - projects/widget/tests/e2e/tracer.spec.mjs
  - projects/widget/tests/unit/approve.test.js
  - projects/widget/tests/unit/check.test.js
  - projects/widget/tests/unit/content.test.js
  - projects/widget/tests/unit/draft.test.js
  - projects/widget/tests/unit/panel.test.js
  - projects/widget/tests/unit/presence.test.js
covered_digest: "v2:sha256:fb4fa20506a043d4c758045a0ca40f1c1310f2294efb615eb125b4dc1c6ec482"
behavior_unverified: 0
overrides_applied: 1
overrides:
  - must_have: "Reguły zgodne z regułami osoby 4 / CHK-01 z shared/content/"
    reason: "D-13: shared/content/ nie istnieje; roboczy pakiet w projects/widget czeka na przegląd osoby 4 i późniejsze dopasowanie bez zmiany ustalonych zachowań"
    accepted_by: "pbartela"
    accepted_at: "2026-10-03T22:45:02Z"
human_verification:
  - test: "Decyzja: czy roboczy pakiet reguł widgetu (src/core/check.js + src/ui/strings.pl.js) spełnia sformułowanie celu „zgodnie z regułami osoby 4” i dopisek CHK-01 „reguły i treści z shared/content/”?"
    expected: "Albo osoba 4 przegląda i akceptuje pakiet (wtedy prawda przechodzi na VERIFIED), albo właściciel projektu dodaje override z uzasadnieniem D-13 (szablon w sekcji Human Verification)."
    why_human: ".planning/shared/content/ nie istnieje; D-13 świadomie dopuścił roboczy pakiet do przeglądu. Kod nie może udowodnić akceptacji osoby 4."
  - test: "UAT w Google Chrome/Discord z pięcioma fikcyjnymi wiadomościami z README (harvest z 02-02 i 02-03 <human-check>)."
    expected: "Język przyjazny dziecku 10–13 lat, brak wstępnych zaznaczeń, widoczne „Podpowiedź z wiadomości”, działają „Popraw odpowiedź” / „Zostaw moją odpowiedź”, brak gwarancji bezpieczeństwa, jeden zrozumiały krok, wznowienie/edycja/nowe zaznaczenie, panel przeciągalny i osiągalny."
    why_human: "Ton, czytelność i realna prezentacja na Discordzie wymagają oceny człowieka; testy sprawdzają tylko dokładne teksty i strukturę."
  - test: "Przegląd 7 zakazów (must_haves.prohibitions, judgment-tier, status unresolved) z niewiążącym werdyktem weryfikatora w tabeli „Prohibitions”."
    expected: "Człowiek potwierdza lub odrzuca każdy werdykt; szczególnie zakaz 02-03 „nie twierdzić, że opiekun otrzymał wiadomość” wobec tekstu guardianNotice/howToPrivacy w czasie przyszłym."
    why_human: "Zakazy dotyczą tonu, przejrzystości i zaufania — weryfikacja to ocena, a nie test."
  - test: "Decyzja produktowa: rozpoznane w tekście „pośpiech” i „zapłata + pośpiech” dają sygnał i podsumowanie „Ta wiadomość wymaga ostrożności” także wtedy, gdy dziecko odpowiedziało „Zwykła wiadomość, bez takich próśb” — bez pytania o rozbieżność (D-15 obejmuje tylko hasło/kod)."
    expected: "Zespół akceptuje to zachowanie albo zleca rozszerzenie promptu rozbieżności / stonowanie wyniku. Przykłady z sondy weryfikatora: „Mama: zapłać teraz za pizzę, kurier czeka” → caution [payment_pressure, urgency]; „Kliknij, tylko dziś zniżka w sklepiku szkolnym” → caution [urgency]."
    why_human: "Fikcyjna uczciwa wiadomość z demo przechodzi bez alarmu (SC3 spełnione), ale granica między ostrożnością a fałszywym alarmem dla innych uczciwych wiadomości to decyzja treściowa osoby 4, nie defekt kodu."
---

# Phase 2: Ścieżka sprawdzania — Verification Report

**Phase Goal:** Pomocnik prowadzi przez pytania i wskazuje sygnały zgodnie z regułami osoby 4
**Verified:** 2026-10-03T22:29:58Z
**Status:** human_needed
**Re-verification:** No — initial verification

Weryfikacja oparta na kodzie w `projects/widget`, a nie na deklaracjach SUMMARY. Weryfikator sam uruchomił pełny zestaw jednostkowy (197/197) i pełny e2e (69 passed, 1 oczekiwana porażka z fazy 1) oraz własną sondę silnika reguł na wiadomościach spoza fixture'ów autora.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 0 | (Cel) Reguły zgodne z regułami osoby 4 / CHK-01 „z shared/content/” | ? UNCERTAIN (decyzja człowieka) | `.planning/shared/content/` nie istnieje. Reguły to roboczy pakiet `src/core/check.js` + `src/ui/strings.pl.js` (D-13), README l.13 i l.98 kierują go do przeglądu osoby 4. Brak dowodu akceptacji. Brak override. |
| 1 | SC1: pytania o nadawcę, żądanie, presję czasu i oficjalny kanał (+ 02-01: wskazówka D-16, potem dokładnie trzy ekrany) | ✓ VERIFIED | `strings.pl.js:32-54` — Q1 „Kto wysłał wiadomość?”, Q2 „Czego chce nadawca i czy pogania?” (opcja `urgency`), Q3 „Jak możesz sprawdzić poza tą wiadomością?”; `draft.js:5,114-118` kolejność sender→request→verify→result. E2E `check.spec.mjs:223` (pass) asertuje tekst D-16 przed Q1 i 3 grupy. |
| 2 | SC2: wynik pokazuje sygnały, brakujące informacje i krok, bez obietnicy bezpieczeństwa | ✓ VERIFIED | `panel.js:129-152` renderuje 3 regiony + 1 `.result-step`; `strings.pl.js:57,65,77` — „To nie daje pewności”, „To nie potwierdza tożsamości nadawcy ani bezpieczeństwa wiadomości”. E2E `check.spec.mjs:379` asertuje brak „wiadomość jest bezpieczna”, surowych kluczy i `undefined`. |
| 3 | SC3: uczciwa fikcyjna wiadomość bez fałszywego alarmu; przy braku pewności pomocnik to mówi | ✓ VERIFIED | E2E honest (pass): dokładne podsumowanie D-06, sekcje „none”. Niepewność: `insufficient_information` („Brakuje nam informacji”), `conflicting_answers` („Nie mamy pewności”) — e2e `:250`, `:290`, `:379 ambiguous` (pass). Sonda weryfikatora: „Dziś gramy…”, „jutro sprawdzian…”, „kod do szafki”, „Hasło na zbiórkę”, „nigdy nie podawaj kodu” → `no_signals`. Zob. ostrzeżenie o podpowiedziach pośpiechu/płatności. |
| 4 | 02-01: każde pytanie startuje puste; podpowiedzi nie zaznaczają; Dalej wymaga wyboru (D-04) | ✓ VERIFIED | `panel.js:100,111` (`checked` tylko z `answers`, `next.disabled = !selected.length`); `draft.js:106` blokada. E2E `untouchedQuestion` asertuje 0 zaznaczeń i disabled. |
| 5 | 02-01: uczciwa wiadomość → podsumowanie D-06, trzy sekcje D-05, jeden wyjaśniony krok D-08 | ✓ VERIFIED | E2E `check.spec.mjs:223` asertuje dokładne teksty i `.result-step` count 1 z wyjaśnieniem independent_check. |
| 6 | 02-01: bez odpowiedzi nie da się przejść; „Nie wiem” to jawna odpowiedź → brakujące informacje | ✓ VERIFIED | `draft.js:106`; `check.js:62-67`. E2E `:250` (pass) — trzy „Nie wiem” → trzy teksty „Nie wiemy jeszcze…”. |
| 7 | 02-02: rozpoznane hasło/kod, nagroda+link, płatność+presja to podpowiedzi „Podpowiedź z wiadomości”, nigdy zaznaczenia | ✓ VERIFIED | `panel.js:107` badge osobno od `checked`; e2e `:290` asertuje badge i `not.toBeChecked()`. |
| 8 | 02-02: pięć scenariuszy D-14 → wyjaśnione sygnały, niewiadome i jeden priorytetowy krok | ✓ VERIFIED | `check.js:71-72` deterministyczny priorytet; e2e prize/payment/ambiguous/credential/honest (pass) z dokładnymi tekstami; unit `check.test.js` (w 197 pass). |
| 9 | 02-02: D-15 — korekta lub zachowanie odpowiedzi; zachowanie utrzymuje ostrzeżenie i mówi o niepewności | ✓ VERIFIED | `draft.js:105-118` (keep tylko przy widocznej rozbieżności, unieważniane zmianą); `check.js:68-70`. E2E retain/correct (pass) przez prawdziwy kontroler `onQuestionNext(true)`. |
| 10 | 02-02: null/puste → insufficient_information bez alarmu; jedno słowo bez sygnału | ✓ VERIFIED | Unit `check.test.js:187`; sonda: `evaluate(null,null)` → insufficient_information, `signals: []`. |
| 11 | 02-02: NFC/NFD, wielkość liter, NBSP, ł/l dają identyczne rozpoznanie; limity code-point bez zmian | ✓ VERIFIED | `check.js:11-12`; unit `check.test.js:208-214`; sonda „PODAJ KOD DO KONTA” → code. |
| 12 | 02-02: uczciwe negatywy (Dziś gramy, płatność bez presji, zwykła nagroda, neutralny link, „Nie podawaj kodu”) bez automatycznego ostrzeżenia | ✓ VERIFIED | Unit `check.test.js:49-52,92`; sonda potwierdza dla wymienionych klas. |
| 13 | 02-03: zamknięcie/ukrycie i ponowne otwarcie przywraca pytanie/wynik; karta zachowuje; reload/pagehide/zmiana dokumentu czyści (D-09) | ✓ VERIFIED | `draft.js:24,130,132`; `main.js:204-205`. E2E `check.spec.mjs:44` ×5 kroków, `:69`, `:123`, `draft.spec.mjs:28` prawdziwy bfcache (pass). |
| 14 | 02-03: Wróć i Popraw odpowiedzi zachowują wybory; zmiana unieważnia i przelicza wynik (D-10) | ✓ VERIFIED | `draft.js:102,118,120-128`; e2e `:141` (pass), retain-branch e2e. |
| 15 | 02-03: edycja tekstu/linku → nowa, pusta sesja tylko po udanym ponownym zatwierdzeniu (D-11) | ✓ VERIFIED | `draft.js:80-86`; `main.js:176-179` (niezmieniona treść nie wysyła duplikatu — WR-05). E2E `:141` tekst i link-only (pass); unit `approve.test.js:66,95`. |
| 16 | 02-03: nowe zaznaczenie → „Sprawdź nowe zaznaczenie”; podgląd/anulowanie/porażka zachowują postęp; sukces zastępuje (D-12) | ✓ VERIFIED | `draft.js:24-25,65-70`; `panel.js:36-41`. E2E `:87` (pass); unit `draft.test.js:82,123`, `approve.test.js:151,160`. |
| 17 | 02-03: rekin i panele pytań/wyniku podążają za przeciąganiem bez przebudowy kontrolek, zmiany fokusu i wysyłki | ✓ VERIFIED | E2E `avatar.spec.mjs:98` (question, result), `:158` (pass). |
| 18 | 02-03: sprawdzana jest tylko zaznaczona/wklejona zatwierdzona treść; nic nie trafia do opiekuna | ✓ VERIFIED | Brak `fetch`/storage w `src/`; `integration.js` tylko `chrome.runtime.sendMessage` do lokalnego SW; każdy e2e asertuje `messages.length === 1` i `assertOnlyLocal`. |

**Score:** 18/19 truths verified (0 present, behavior-unverified; 1 uncertain — decyzja człowieka)

### Prohibitions (judgment-tier, niewiążący werdykt weryfikatora — wymagają potwierdzenia człowieka)

| # | Plan | Zakaz | Werdykt LLM (niewiążący) | Flaga |
|---|------|-------|---------------------------|-------|
| P1 | 02-01 | Nie zawstydzać za „Nie wiem” | Teksty neutralne („Nie wiemy jeszcze…”) — wygląda na spełniony | unverified-prohibition — human review recommended |
| P2 | 02-01 | Brak sygnałów ≠ gwarancja bezpieczeństwa | „To nie daje pewności”, „To nie potwierdza… bezpieczeństwa” — wygląda na spełniony | unverified-prohibition — human review recommended |
| P3 | 02-02 | Podpowiedź nie staje się „potwierdzoną” odpowiedzią | Kontrolki nie są zaznaczane; ALE sygnały z podpowiedzi trafiają do wyniku mimo odpowiedzi „Zwykła wiadomość” (bez promptu dla pośpiechu/płatności). Tekst nie twierdzi, że dziecko to potwierdziło — graniczne | unverified-prohibition — human review recommended |
| P4 | 02-02 | Sprzeczna odpowiedź nie ukrywa rozpoznanej prośby o dane | E2E retain potwierdza zachowanie ostrzeżenia | unverified-prohibition — human review recommended |
| P5 | 02-02 | Nie oskarżać uczciwego nadawcy | Teksty mówią o ostrożności, nie oszustwie; zob. sonda „zapłać teraz za pizzę” → „wymaga ostrożności” | unverified-prohibition — human review recommended |
| P6 | 02-03 | Nie podmieniać po cichu zatwierdzonej wiadomości przy nowym zaznaczeniu | E2E `:87` + unit — wygląda na spełniony | unverified-prohibition — human review recommended |
| P7 | 02-03 | Nie twierdzić, że opiekun otrzymał wiadomość/wynik | Brak „Gotowe!”; README wyraźnie mówi o braku wysyłki. ALE `guardianNotice` („…zobaczy Twój opiekun”) i `howToPrivacy` w czasie przyszłym obiecują coś, czego ta wersja nie robi | unverified-prohibition — human review recommended |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `projects/widget/src/core/check.js` | Czyste reguły `detectHints`, `evaluate` (+ `QUESTIONS`) | ✓ VERIFIED | 78 linii, merytoryczne; importowane w `draft.js:2` |
| `projects/widget/src/core/draft.js` | Sesja sprawdzania, wznowienie, transakcja zastąpienia | ✓ VERIFIED | 134 linie; używane w `main.js` |
| `projects/widget/src/ui/strings.pl.js` | Polski pakiet pytań/wyników | ✓ VERIFIED | Kompletne klucze; test zgodności ID z `QUESTIONS` (`check.test.js:12`) |
| `projects/widget/src/ui/panel.js` | Widoki safety/question/result | ✓ VERIFIED | Renderuje z `textContent`, bez linków |
| `projects/widget/src/content/main.js` | Handlery kontrolera | ✓ VERIFIED | Wszystkie handlery fazy 2 podpięte |
| `projects/widget/tests/e2e/check.spec.mjs` | Tracer przez prawdziwe rozszerzenie | ✓ VERIFIED | 18 scenariuszy, wszystkie pass |
| `projects/widget/tests/unit/check.test.js` | Kontrakty reguł | ✓ VERIFIED | W ramach 197 pass |
| `projects/widget/README.md` | Lokalizacja pakietu, 5 demo, checklista Chrome | ✓ VERIFIED | l.7, 13, 92, 98, 102 |

`gsd-tools verify.artifacts`: 9/9 pass we wszystkich trzech planach.

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| main.js | draft.js | `approved(token, c)` dopiero po `submitCase` | ✓ WIRED | `main.js:183` |
| panel.js | main.js | onSafetyNext/onAnswer/onQuestionNext | ✓ WIRED | `panel.js:82,101,110,122` ↔ `main.js:163-167` |
| draft.js | check.js | `detectHints`/`evaluate` | ✓ WIRED | `draft.js:83,109,118` |
| panel.js | strings.pl.js | klucze sygnałów/niewiadomych/kroków | ✓ WIRED | `panel.js:131-147` |
| main.js | draft.js | jedyny punkt zastąpienia = `approved` | ✓ WIRED | `draft.js:77-88` |
| panel.js | main.js | onEditCheckContent/onCancelCheckEdit/onCheckNewSelection | ✓ WIRED | `panel.js:38,83,114,149,186` ↔ `main.js:168-170` |

`gsd-tools verify.key-links`: 7/7 verified.

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| panel.js widok result | `state.check.result` | `evaluate(check.answers, check.hints)` w `draft.js:118` | Tak — z odpowiedzi dziecka i `detectHints(approvedCase)` | ✓ FLOWING |
| panel.js podpowiedzi | `state.check.hints` | `detectHints(approvedCase)` w `draft.js:83` | Tak — z zatwierdzonej treści | ✓ FLOWING |
| check.case | `approvedCase` | `buildCase(draft)` → `submitCase` → `approved` | Tak | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Pełny zestaw jednostkowy | `npm --prefix projects/widget test` | 9 plików, 197 passed | ✓ PASS |
| Pełny zestaw e2e (raz) | `npm --prefix projects/widget run test:e2e -- --reporter=list` | 69 passed, exit 0; 1 `test.fail` z fazy 1 (`edges.spec.mjs:28`, capture-phase) | ✓ PASS |
| Uczciwe wiadomości spoza fixture'ów | `node probe.mjs` (scratchpad) | „Dziś gramy”, „sprawdzian”, „kod do szafki”, „Hasło na zbiórkę”, „nigdy nie podawaj kodu” → `no_signals` | ✓ PASS |
| Wejście null | `evaluate(null,null)` | `insufficient_information`, brak sygnałów | ✓ PASS |
| Uczciwe wiadomości z „teraz”/„tylko dziś” | `node probe.mjs` | „zapłać teraz za pizzę” i „tylko dziś zniżka” → `caution` mimo odpowiedzi `ordinary` | ⚠️ WARNING (decyzja treściowa) |
| Fałszywe negatywy rozpoznawania | `node probe.mjs` | „Daj mi swój kod do konta”, „Potrzebuję kodu z SMS” → brak podpowiedzi (ostrzeżenie nadal powstaje, jeśli dziecko wybierze „kod”) | ℹ️ INFO (reguły celowo wąskie) |

### Probe Execution

| Probe | Command | Result | Status |
|-------|---------|--------|--------|
| — | — | Brak zadeklarowanych `probe-*.sh` w planach i brak `scripts/*/tests/probe-*.sh` | SKIPPED (nie dotyczy) |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| CHK-01 | 02-01, 02-02, 02-03 | Pytania: kto wysłał, czego żąda, presja czasu, oficjalny kanał (reguły i treści z `shared/content/`) | ✓ SATISFIED (pytania) / ? NEEDS HUMAN (źródło treści) | Pytania — prawda 1. Źródło `shared/content/` nie istnieje; roboczy pakiet zgodnie z D-13 — prawda 0. |
| CHK-02 | 02-01, 02-02, 02-03 | Sygnały, brakujące informacje, krok; bez gwarancji | ✓ SATISFIED | Prawdy 2, 5, 8, 9 |
| CHK-03 | 02-01, 02-02, 02-03 | Uczciwa wiadomość i brak pewności bez fałszywego alarmu | ✓ SATISFIED | Prawdy 3, 10, 11, 12 (+ ostrzeżenie o pośpiechu/płatności) |

Wszystkie ID z frontmatter planów (CHK-01, CHK-02, CHK-03) są w REQUIREMENTS.md i zmapowane do Phase 2. Brak osieroconych wymagań.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| (pliki fazy) | — | TBD/FIXME/XXX/TODO/HACK | — | Brak znaczników długu |
| `src/core/draft.js` | 73 | `return null` | ℹ️ Info | Strażnik `beginSubmit`, nie zaślepka |
| `src/core/check.js` | 54, 60, 71-72 | Sygnały z podpowiedzi (`urgency`, `payment`) łączone z odpowiedzią dziecka bez promptu rozbieżności | ⚠️ Warning | Odpowiedź „Zwykła wiadomość” może zakończyć się „Ta wiadomość wymaga ostrożności” bez wyjaśnienia rozbieżności (D-15 tylko dla hasła/kodu) |
| `src/ui/strings.pl.js` | 14, 102 | `guardianNotice`/`howToPrivacy` w czasie przyszłym („zobaczy Twój opiekun”) | ⚠️ Warning | W fazie 2 nic nie jest wysyłane; ocena przy zakazie P7 |
| `src/ui/panel.js` | 74-80 | Nieosiągalny widok `confirmation` (IN-01) | ℹ️ Info | Martwy kod, otwarty w dyspozycji przeglądu |
| `src/core/draft.js` | 3 | Nieużywany re-export (IN-03) | ℹ️ Info | Otwarty w dyspozycji przeglądu |
| `src/ui/strings.pl.js` | 57-70, 88-89 | Nieużywane aliasy kluczy (IN-02) | ℹ️ Info | Może zaciemniać przegląd osoby 4 |

Pozostałe otwarte IN-04..IN-06 (checkboxy dla wyłącznych opcji, utrata pendingSelection przy edycji, fokus przy resize) potwierdzone jako Info — nie blokują celu.

### Human Verification Required

### 1. Źródło reguł: osoba 4 vs roboczy pakiet

**Test:** Zdecydować, czy roboczy pakiet (`src/core/check.js`, `src/ui/strings.pl.js`) spełnia „zgodnie z regułami osoby 4” / CHK-01 „z shared/content/”.
**Expected:** Przegląd i akceptacja przez osobę 4 albo jawny override.
**Why human:** `shared/content/` nie istnieje; akceptacji osoby 4 nie da się udowodnić kodem.

**To wygląda na świadomą decyzję (D-13).** Aby ją przyjąć, dodaj do frontmatter VERIFICATION.md:

```yaml
overrides:
  - must_have: "Reguły zgodne z regułami osoby 4 / CHK-01 z shared/content/"
    reason: "D-13: shared/content/ nie istnieje; roboczy pakiet w projects/widget czeka na przegląd osoby 4 i późniejsze dopasowanie bez zmiany ustalonych zachowań"
    accepted_by: "{name}"
    accepted_at: "{ISO timestamp}"
```

### 2. UAT w Google Chrome/Discord (z planów 02-02 i 02-03)

**Test:** Przejść pięć fikcyjnych scenariuszy z README oraz zamknięcie/wznowienie, korektę, edycję samego linku, nowe zaznaczenie (anuluj/zatwierdź), kartę/reload i przeciąganie.
**Expected:** Język przyjazny dzieciom, bez zawstydzania i straszenia; brak wstępnych zaznaczeń; widoczne podpowiedzi; brak gwarancji bezpieczeństwa; jeden zrozumiały krok; panel osiągalny.
**Why human:** Ton i czytelność wizualna nie są sprawdzalne testami.

### 3. Przegląd 7 zakazów

**Test:** Potwierdzić werdykty z tabeli „Prohibitions”, ze szczególnym uwzględnieniem P3, P5 i P7.
**Expected:** Każdy zakaz rozstrzygnięty przez człowieka.
**Why human:** Zakazy są w trybie judgment i mają status unresolved.

### 4. Ostrożność z podpowiedzi przy odpowiedzi „Zwykła wiadomość”

**Test:** W rozszerzeniu zatwierdzić „Mama: zapłać teraz za pizzę, kurier czeka” i odpowiedzieć: Osoba, którą znam / Zwykła wiadomość / Przez znaną mi aplikację.
**Expected:** Zespół decyduje, czy wynik „Ta wiadomość wymaga ostrożności” z sygnałami pośpiechu i płatności, bez pytania o rozbieżność, jest akceptowalny.
**Why human:** To decyzja o granicy fałszywego alarmu w treściach osoby 4.

### Gaps Summary

Nie znaleziono blokujących luk. Kod realizuje ścieżkę: lokalne zatwierdzenie, potem wskazówka D-16, trzy świadome pytania i wynik z trzema sekcjami oraz jednym krokiem. Całość jest podpięta i sprawdzona testami behawioralnymi, które weryfikator uruchomił sam (unit 197/197, e2e 69 pass). Deklaracje SUMMARY i dyspozycji przeglądu (poprawki CR-01, WR-01..07) zgadzają się z kodem.

Faza nie jest `passed` z czterech powodów:

1. Cel i CHK-01 mówią o regułach osoby 4 z `shared/content/`. Ten katalog nie istnieje, a pakiet jest roboczy (D-13). Potrzebna jest akceptacja albo override.
2. UAT tonu i prezentacji w Chrome/Discord jest zaplanowany jako przegląd człowieka na koniec fazy.
3. Siedem zakazów typu judgment pozostaje nierozstrzygniętych.
4. Podpowiedzi o pośpiechu i płatności mogą dać wynik „wymaga ostrożności” mimo odpowiedzi „Zwykła wiadomość”, bez pytania o rozbieżność. Fikcyjna uczciwa wiadomość z demo tego nie wywołuje, ale to otwarta decyzja treściowa.

---

_Verified: 2026-10-03T22:29:58Z_
_Verifier: Claude (gsd-verifier)_
