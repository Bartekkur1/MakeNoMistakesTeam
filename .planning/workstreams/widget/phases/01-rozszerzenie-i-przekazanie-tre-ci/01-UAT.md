---
status: testing
phase: 01-rozszerzenie-i-przekazanie-tre-ci
source: [01-VERIFICATION.md]
started: "2026-10-03T17:22:05.578826+00:00"
updated: "2026-10-03T17:22:05.578826+00:00"
---

## Current Test

number: 1
name: Google Chrome: wygląd i obecność rekina
expected: |
  Załaduj widget/dist przez chrome://extensions. Na zwykłej stronie i Discordzie rekin jest ostry, ma poprawne kolory, nieuciętą płetwę, nie zasłania kompozytora; przeciąganie, chowanie i powrót działają.
awaiting: user response

## Tests

### 1. Google Chrome: wygląd i obecność rekina
expected: Załaduj widget/dist przez chrome://extensions. Na zwykłej stronie i Discordzie rekin jest ostry, ma poprawne kolory, nieuciętą płetwę, nie zasłania kompozytora; przeciąganie, chowanie i powrót działają.
result: [pending]

### 2. Discord: podgląd, klawiatura i zaznaczenie kompozytora
expected: Na fikcyjnym koncie przejdź kroki 4–5 README: tylko zaznaczony fragment i hostname discord.com, informacja dla opiekuna, edycja nie trafia do kompozytora i nie uruchamia skrótów; fragment wpisanego zdania przechodzi dokładnie bez wysłania wiadomości; zatwierdzenie daje neutralne Gotowe!.
result: [pending]

### 3. Discord: zmiana kanału i przeładowanie
expected: Szkic zostaje po zmianie kanału, a znika po przeładowaniu dokumentu; menu wraca przy pustym zaznaczeniu.
result: [pending]

### 4. Prawdziwa ikona: nieziniektowana karta i przeładowanie rozszerzenia
expected: Przejdź kroki 7–8 README: prawdziwe kliknięcie ikony na karcie otwartej przy wyłączonym rozszerzeniu montuje rekina; po przeładowaniu rozszerzenia bez odświeżenia karty zostaje jeden działający rekin i zatwierdzenie działa.
result: [pending]

### 5. Język i ton dla dzieci 9–13
expected: Wszystkie widoki są po polsku, przyjazne, bez straszenia i zawstydzania. Jak to działa zawiera trzy uporządkowane kroki i zdanie o prywatności.
result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps

None reported. Automated review findings fixed; no human result has been assumed.
