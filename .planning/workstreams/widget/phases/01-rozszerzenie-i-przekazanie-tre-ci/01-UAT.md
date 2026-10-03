---
status: complete
phase: 01-rozszerzenie-i-przekazanie-tre-ci
source: [01-VERIFICATION.md]
started: "2026-10-03T17:22:05.578826+00:00"
updated: "2026-10-03T17:38:53.684491+00:00"
---

## Current Test

[testing complete]

## Tests

### 1. Google Chrome: wygląd i obecność rekina
expected: Załaduj widget/dist przez chrome://extensions. Na zwykłej stronie i Discordzie rekin jest ostry, ma poprawne kolory, nieuciętą płetwę, nie zasłania kompozytora; przeciąganie, chowanie i powrót działają.
result: pass

### 2. Discord: podgląd, klawiatura i zaznaczenie kompozytora
expected: Na fikcyjnym koncie przejdź kroki 4–5 README: tylko zaznaczony fragment i hostname discord.com, informacja dla opiekuna, edycja nie trafia do kompozytora i nie uruchamia skrótów; fragment wpisanego zdania przechodzi dokładnie bez wysłania wiadomości; zatwierdzenie daje neutralne Gotowe!.
result: issue
reported: "2 wiekszosc pass, rekin powinien znikac kiedy pojawia sie pole do wpisywania (chyba, ze nie jest to zgodne z wymaganiami)"
severity: minor

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
issues: 1
pending: 0
skipped: 0
blocked: 0

## Gaps

- gap_id: G-01-2
  truth: "Rekin znika po otwarciu formularza widgetu i wraca po jego zamknięciu."
  status: failed
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
  diagnosis_note: "Użytkownik potwierdził opcję 1: chodzi o formularz widgetu. Rekin ma znikać po otwarciu formularza i wracać po jego zamknięciu; nie chodzi o pisanie w kompozytorze Discorda."

