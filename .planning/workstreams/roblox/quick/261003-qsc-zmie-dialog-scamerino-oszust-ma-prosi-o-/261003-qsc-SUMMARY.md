---
status: complete
quick_id: 261003-qsc
slug: zmie-dialog-scamerino-oszust-ma-prosi-o-
date: 2026-10-03
---

# Quick Task Summary: dialog Scamerino prosi o hasło

Zmieniono ofertę oszusta na prośbę o hasło do konta w zamian za 10 000 darmowych Robuxów. Przycisk symulacji ma etykietę „Podaj hasło”, a złe zakończenie wyjaśnia ryzyko przejęcia konta i przypomina, że kliknięcie nie wymaga wpisywania prawdziwych danych.

Zaktualizowano objaśnienie phishingu i czerwoną flagę w dialogu Scamerino. Ogólne ostrzeżenia o kodach SMS zostały zachowane.

Klient wysyła jedynie identyfikator wyboru, a serwer pobiera jego zdefiniowany skutek przez `MissionContent.getChoice`. Nie dodano pola tekstowego ani przesyłania hasła.

## Weryfikacja

- `selene src` — 0 błędów, 0 ostrzeżeń.
- `stylua --check src` — zaliczone.
- `rojo build default.project.json -o /tmp/roblox-password-dialog.rbxlx` — zaliczone.
- `git diff --check` — zaliczone.
- Ręczny test interakcji w Roblox Studio pozostaje do wykonania.
