# Kontrakt integracji (minimalny)

Właściciel: osoba 3. Osoba 2 potwierdza przed implementacją. Źródło: `ideas/defence/taski.md`.

## Obiekty

| Obiekt | Pola |
|---|---|
| Sprawa | id, demo_child_id, source, content, signals, selected_action, already_acted, status (nowa / w rozmowie / zakończona), created_at |
| Odpowiedź | id, case_id, message, created_at |
| Wynik testu/misji | participant_code, scenario_id, phase (pre / training / post), selected_action, justification, hints_used, score, origin |

## API (do uzupełnienia przez właściciela: ścieżki, kody błędów, przykładowe JSON)

- Sprawy: utworzenie, lista, szczegóły
- Odpowiedzi: dodanie odpowiedzi do sprawy, zmiana statusu
- Wyniki: zapis odpowiedzi testowych, odczyt wyników (agregaty dla nauczyciela bez prywatnych spraw)

## Reguły

- Backend wylicza `score` według klucza oceny z `shared/content/`; nie przyjmuje punktów od klienta jako prawdy.
- Import wyników z Roblox ma `origin` = roblox; nie mieszać treningu z testem samodzielności.
- Brak wspólnego logowania z Roblox. Demo używa fikcyjnych profili dziecka i opiekuna; przełączanie ról jest demonstracyjne, nie zabezpieczeniem.
- Widok nauczyciela nie zwraca prywatnych spraw.
- Sekrety nigdy w kliencie (Roblox, rozszerzenie).
