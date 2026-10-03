---
status: diagnosed
phase: 02-cie-ka-sprawdzania
source: [02-VERIFICATION.md]
started: 2026-10-03T22:32:30Z
updated: 2026-10-03T23:12:36Z
---

## Current Test

[testing complete]

## Tests

### 1. Źródło reguł — akceptacja osoby 4 albo override (D-13)
expected: Pakiet reguł zaakceptowany przez osobę 4 lub override z uzasadnieniem D-13; .planning/shared/content/ nie istnieje.
result: pass
note: "Override D-13 dodany do 02-VERIFICATION.md (accepted_by: pbartela)"

### 2. UAT w Google Chrome/Discord — pięć fikcyjnych wiadomości z README
expected: Język przyjazny dziecku 10–13 lat, brak wstępnych zaznaczeń, widoczna „Podpowiedź z wiadomości”, działają „Popraw odpowiedź” / „Zostaw moją odpowiedź”, brak gwarancji bezpieczeństwa, jeden zrozumiały krok, wznowienie/edycja/nowe zaznaczenie, panel przeciągalny i osiągalny.
result: issue
reported: "A.b.c calosc sie udala, ale nie mozliwosci wyslania do opiekuna i prosby o weryfikacje [...] samo api jest odlozone, ale mock tak jak w fazie 1 dalej powinien dzialac, wiec twierdzenie, ze wyslane do opiekuna to tylko mock na potrzeby prezentacji, samo api dojdzie pozniej"
severity: major
note: "Scenariusze A, B, C przeszły. C.6: szkic zostaje po odznaczeniu i kliknięciu rekina — akceptowane; przeładowanie kasuje stan. Brakuje mocka wysyłki do opiekuna z fazy 1."

### 3. Przegląd 7 zakazów z planów (tabela Prohibitions w 02-VERIFICATION.md)
expected: Człowiek potwierdza lub odrzuca każdy niewiążący werdykt; szczególnie guardianNotice/howToPrivacy („…zobaczy Twój opiekun”) wobec zakazu twierdzenia, że opiekun coś otrzymał (w fazie 2 nic nie jest wysyłane).
result: pass
note: "Wszystkie 7 zakazów potwierdzone; P7 teksty guardianNotice/howToPrivacy zostają (mock wysyłki na prezentację, API w fazie 3)."

### 4. Decyzja treściowa — pośpiech/płatność przy odpowiedzi „Zwykła wiadomość”
expected: Zespół akceptuje, że rozpoznany pośpiech lub zapłata + pośpiech dają „Ta wiadomość wymaga ostrożności” mimo odpowiedzi dziecka „Zwykła wiadomość” (np. „Mama: zapłać teraz za pizzę, kurier czeka”), albo zleca rozszerzenie pytania o rozbieżność (D-15) lub stonowanie wyniku.
result: pass

## Summary

total: 4
passed: 3
issues: 1
pending: 0
skipped: 0
blocked: 0

## Gaps

- gap_id: G-02-2
  truth: "Po zakończeniu ścieżki sprawdzania (wynik) dziecko może — jak w fazie 1 — przekazać sprawę opiekunowi przez lokalny mock wysyłki (bez API, na potrzeby prezentacji); prawdziwe API dochodzi w fazie 3."
  status: failed
  reason: "User reported: brak możliwości wysłania do opiekuna i prośby o weryfikację; mock jak w fazie 1 dalej powinien działać — 'wysłane do opiekuna' to tylko mock na prezentację, API dojdzie później"
  severity: major
  test: 2
  root_cause: "Commit 5e9600a (02-01) przełączył draft.approved() z 'confirmation' na 'safety'; ścieżka kończy się na 'result' bez akcji przekazania opiekunowi. Widok confirmation (panel.js:74-80, IN-01) stał się martwy, a mock SW zapisuje tylko sprawę przy zatwierdzeniu (bez wyniku). Plany fazy 2 jawnie wykluczyły wysyłkę (02-CONTEXT:50, README:9, P7) — nie uchwycono wymagania, że demo-mock ma dalej działać."
  artifacts:
    - path: "projects/widget/src/core/draft.js"
      issue: "approved() → 'safety'; brak przejścia result → confirmation/przekazanie opiekunowi"
    - path: "projects/widget/src/ui/panel.js"
      issue: "Widok result (129-153) bez przycisku przekazania; confirmation (74-80) nieosiągalny"
    - path: "projects/widget/src/content/main.js"
      issue: "Brak handlera prośby o weryfikację opiekuna"
    - path: "projects/widget/src/core/integration.js / messages.js / background/sw.js"
      issue: "Mock przyjmuje tylko MSG_CASE_APPROVED; brak lokalnej wiadomości z prośbą o weryfikację i wynikiem"
    - path: "projects/widget/src/ui/strings.pl.js"
      issue: "confirmation copy nie mówi o przekazaniu opiekunowi ani o trybie demo"
    - path: "projects/widget/README.md"
      issue: "l.7,9,102 twierdzą, że faza 2 nie ma przycisku wysyłki"
  missing:
    - "Jawny przycisk na ekranie wyniku (np. „Poproś opiekuna o sprawdzenie”) poza 3 .result-section, fokus pierwszego przycisku bez zmian"
    - "Przejście w store result → confirmation (reuse widoku, zamyka IN-01) + handler w main.js"
    - "Lokalny mock: nowa wiadomość (np. aura/guardian-request ze sprawą i kluczem wyniku) tylko przez core/integration.js, zapis w pamięci SW (self.__aura.guardianRequests), bez sieci i storage"
    - "Copy potwierdzenia: przekazano opiekunowi — wyraźnie oznaczone jako demo/mock (API w fazie 3)"
    - "Testy: unit store/panel/copy, e2e result → przycisk → potwierdzenie + rekord mocka + assertOnlyLocal; aktualizacja README"
  debug_session: .planning/debug/guardian-send-mock-missing.md
