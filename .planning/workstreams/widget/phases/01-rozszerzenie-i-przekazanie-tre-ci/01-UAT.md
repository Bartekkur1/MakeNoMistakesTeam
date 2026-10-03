---
status: testing
phase: 01-rozszerzenie-i-przekazanie-tre-ci
source: [01-VERIFICATION.md]
started: "2026-10-03T17:22:05.578826+00:00"
updated: "2026-10-03T18:13:10.468757+00:00"
---

## Current Test

number: 2
name: G-01-2-drag: otwarte okno podąża za widocznym rekinem
expected: |
  Załaduj nowy ZIP albo widget/dist, przeładuj rozszerzenie i odśwież kartę Discorda. Rekin pozostaje widoczny. Przeciągaj go z otwartym menu, Jak to działa, formularzem, podglądem i Gotowe: okno podąża za nim, a tekst, link i aktywne pole zostają. Sprawdź krawędzie ekranu, resize oraz zamknięcie przez × i Escape z zachowaniem szkicu.
awaiting: user response

## Tests

### 1. Google Chrome: wygląd i obecność rekina
expected: Załaduj widget/dist przez chrome://extensions. Na zwykłej stronie i Discordzie rekin jest ostry, ma poprawne kolory, nieuciętą płetwę, nie zasłania kompozytora; przeciąganie, chowanie i powrót działają.
result: pass

### 2. G-01-2-drag: otwarte okno podąża za widocznym rekinem
expected: Załaduj nowy ZIP albo widget/dist, przeładuj rozszerzenie i odśwież kartę Discorda. Rekin pozostaje widoczny. Przeciągaj go z otwartym menu, Jak to działa, formularzem, podglądem i Gotowe: okno podąża za nim, a tekst, link i aktywne pole zostają. Sprawdź krawędzie ekranu, resize oraz zamknięcie przez × i Escape z zachowaniem szkicu.
result: [pending]

### 3. Discord: zmiana kanału i przeładowanie
expected: Szkic zostaje po zmianie kanału, a znika po przeładowaniu dokumentu; menu wraca przy pustym zaznaczeniu.
result: pass

### 4. Prawdziwa ikona: nieziniektowana karta i przeładowanie rozszerzenia
expected: Przejdź kroki 7–8 README: prawdziwe kliknięcie ikony na karcie otwartej przy wyłączonym rozszerzeniu montuje rekina; po przeładowaniu rozszerzenia bez odświeżenia karty zostaje jeden działający rekin i zatwierdzenie działa.
result: pass

### 5. Język i ton dla dzieci 9–13
expected: Wszystkie widoki są po polsku, przyjazne, bez straszenia i zawstydzania. Jak to działa zawiera trzy uporządkowane kroki i zdanie o prywatności.
result: pass

## Summary

total: 5
passed: 4
issues: 0
pending: 1
skipped: 0
blocked: 0

## Gaps

- gap_id: G-01-2
  truth: "Rekin znika po otwarciu formularza widgetu i wraca po jego zamknięciu."
  status: superseded
  reason: "User reported: 2 wiekszosc pass, rekin powinien znikac kiedy pojawia sie pole do wpisywania (chyba, ze nie jest to zgodne z wymaganiami)"
  severity: minor
  test: 2
  artifacts:
    - path: widget/src/content/main.js
      issue: "render() przekazuje setHidden tylko state.hidden, bez uwzględnienia otwartego formularza."
    - path: widget/src/content/avatar.js
      issue: "setHidden chowa cały host zawierający też panel; potrzebna osobna widoczność awatara."
  root_cause: "Widoczność całego widgetu jest sterowana flagą ręcznego schowania. Brakuje niezależnego chowania awatara w widokach paste i preview."
  missing:
    - "Osobna widoczność avatar-wrap w formularzu paste i preview, bez chowania panelu."
    - "Powrót awatara po zamknięciu formularza z zachowaniem pozycji i szkicu."
  superseded_by: G-01-2-drag
  resolution_note: "Użytkownik zmienił kryterium: rekin może zostać widoczny, jeśli otwarte okno podąża za nim."
  diagnosis_note: "Użytkownik potwierdził opcję 1: chodzi o formularz widgetu. Rekin ma znikać po otwarciu formularza i wracać po jego zamknięciu; nie chodzi o pisanie w kompozytorze Discorda."


- gap_id: G-01-2-drag
  truth: "Przeciąganie widocznego rekina przesuwa również otwarty panel, bez utraty szkicu."
  status: implemented_awaiting_retest
  resolved_by: 01-06-PLAN.md
  reason: "User reported: przesuniecie rekina powinno przesunac tez otwarte okna, rekin jednak nie musi znikac o ile okno bedzie sie przesuwalo razem z nim"
  severity: minor
  test: 2
  root_cause: "moveTo zmienia wyłącznie style hosta. Panel ma position: fixed i własne left/top; panel.place jest wywoływane przez render/resize, bez powiadomienia o przeciąganiu. setFormOpen dodatkowo ukrywa i blokuje rekina w paste/preview."
  artifacts:
    - path: widget/src/content/avatar.js
      issue: "Brak powiadomienia o zmianie pozycji; setFormOpen ukrywa uchwyt przeciągania."
    - path: widget/src/content/main.js
      issue: "Brak aktualizacji pozycji panelu na pointermove; render przebudowuje formularz."
    - path: widget/src/ui/panel.js
      issue: "Panel jest fixed i potrzebuje jawnego place po zmianie pozycji awatara."
  missing:
    - "Powiadomienie o ruchu rekina i aktualizacja samej pozycji otwartego panelu."
    - "Widoczny, aktywny rekin również w formularzu."
    - "Regresje dla tekstu, fokusu, kliknięcia po drag i krawędzi ekranu."
  debug_session: .planning/workstreams/widget/debug/drag-open-panel.md

## Gap closure execution

01-05 implemented and automated checks passed: 38 Vitest, 38 Playwright (one existing expected failure). Original report retained above; user has not yet accepted the visual fix. Four prior pass results remain unchanged. Retest artifact: `/workspace/artifacts/bezpieczna-aura-widget-phase1-gap-01-05.zip`.

## Latest UAT report

przesuniecie rekina powinno przesunac tez otwarte okna, rekin jednak nie musi znikac o ile okno bedzie sie przesuwalo razem z nim

## Original test 2 report (historical)

> ### 2. Discord: podgląd, klawiatura i zaznaczenie kompozytora
> expected: Na fikcyjnym koncie przejdź kroki 4–5 README: tylko zaznaczony fragment i hostname discord.com, informacja dla opiekuna, edycja nie trafia do kompozytora i nie uruchamia skrótów; fragment wpisanego zdania przechodzi dokładnie bez wysłania wiadomości; zatwierdzenie daje neutralne Gotowe!.
> result: issue
> reported: "2 wiekszosc pass, rekin powinien znikac kiedy pojawia sie pole do wpisywania (chyba, ze nie jest to zgodne z wymaganiami)"
> severity: minor
>
>

## Gap closure execution 01-06

Implemented revised visible-avatar drag behavior. 38 Vitest pass; Playwright 45 passed including one existing expected failure. Four human passes preserved; revised test 2 awaits user acceptance. Retest ZIP: `/workspace/artifacts/bezpieczna-aura-widget-phase1-gap-01-06.zip`.
