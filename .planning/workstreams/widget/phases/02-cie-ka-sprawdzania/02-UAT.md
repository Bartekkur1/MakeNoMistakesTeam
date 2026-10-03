---
status: testing
phase: 02-cie-ka-sprawdzania
source: [02-VERIFICATION.md]
started: 2026-10-03T22:32:30Z
updated: 2026-10-03T22:32:30Z
---

## Current Test

number: 1
name: Źródło reguł — akceptacja osoby 4 albo override (D-13)
expected: |
  Osoba 4 przegląda i akceptuje roboczy pakiet reguł (src/core/check.js + src/ui/strings.pl.js) albo właściciel projektu dodaje override z uzasadnieniem D-13 (szablon w 02-VERIFICATION.md).
awaiting: user response

## Tests

### 1. Źródło reguł — akceptacja osoby 4 albo override (D-13)
expected: Pakiet reguł zaakceptowany przez osobę 4 lub override z uzasadnieniem D-13; .planning/shared/content/ nie istnieje.
result: [pending]

### 2. UAT w Google Chrome/Discord — pięć fikcyjnych wiadomości z README
expected: Język przyjazny dziecku 10–13 lat, brak wstępnych zaznaczeń, widoczna „Podpowiedź z wiadomości”, działają „Popraw odpowiedź” / „Zostaw moją odpowiedź”, brak gwarancji bezpieczeństwa, jeden zrozumiały krok, wznowienie/edycja/nowe zaznaczenie, panel przeciągalny i osiągalny.
result: [pending]

### 3. Przegląd 7 zakazów z planów (tabela Prohibitions w 02-VERIFICATION.md)
expected: Człowiek potwierdza lub odrzuca każdy niewiążący werdykt; szczególnie guardianNotice/howToPrivacy („…zobaczy Twój opiekun”) wobec zakazu twierdzenia, że opiekun coś otrzymał (w fazie 2 nic nie jest wysyłane).
result: [pending]

### 4. Decyzja treściowa — pośpiech/płatność przy odpowiedzi „Zwykła wiadomość”
expected: Zespół akceptuje, że rozpoznany pośpiech lub zapłata + pośpiech dają „Ta wiadomość wymaga ostrożności” mimo odpowiedzi dziecka „Zwykła wiadomość” (np. „Mama: zapłać teraz za pizzę, kurier czeka”), albo zleca rozszerzenie pytania o rozbieżność (D-15) lub stonowanie wyniku.
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps
