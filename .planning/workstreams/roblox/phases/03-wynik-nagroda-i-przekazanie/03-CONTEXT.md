# Phase 3: Wynik, nagroda i przekazanie — Context

**Gathered:** 2026-10-04  
**Status:** Ready for planning  
**Workstream:** roblox  
**Phase:** 03-wynik-nagroda-i-przekazanie  
**Requirements:** SCR-01 (zaktualizowane: ocena binarna/zaliczony test zamiast punktacji numerycznej), SCR-02, SCR-03  

<domain>
## Phase Boundary

Faza 3 integruje grę Roblox z panelem opiekuna (rodzica i szkoły) oraz nagradza gracza za bezpieczną postawę:
1. **Brak punktacji numerycznej (Decyzja użytkownika):**
   - Misja nie wystawia ocen cyfrowych ani punktów (np. 0-3 pkt).
   - Wynik ma charakter jakościowy i edukacyjny: **Test zdany pomyślnie** (bezpieczna odmowa) lub **Symulacja: konto zagrożone** (uległość).
2. **Wizualna nagroda kosmetyczna za zdany test (SCR-02):**
   - Gracz za bezpieczną odmowę i obronę przed scammerem otrzymuje kosmetyczną nagrodę 3D: Złotą Tarczę Bezpieczeństwa Scamerino (`ScamerinoShieldAccessory`) nałożoną na postać gracza (Accessory do `BodyBackAttachment`) wraz z rozbłyskiem złotych cząsteczek (`ParticleEmitter`).
   - Przy restarcie misji (`resetForPlayer`) tarcza jest zdejmowana, aby gracz mógł przejść test ponownie.
3. **Komunikacja z panelem opiekuna w formacie istniejącego panelu (SCR-03):**
   - Serwer gry generuje raport incydentu dokładnie w formacie oczekiwanym przez panel `web-app` (`Report`):
     - `source: "game"` (w panelu: etykieta „gra”).
     - `attack_type: "data_request"` (w panelu: „Prośba o dane, hasło lub kod”).
     - `taken_actions`: `[]` (gdy uczeń odmówił – w panelu zielony komunikat: *„Nic z tych rzeczy: dziecko nie kliknęło, nie podało danych i nie zapłaciło”*) lub `["entered_password"]` (gdy uczeń uległ w symulacji – w panelu: *„Ryzyko: podanie danych”*).
     - `content`: sformatowany opis incydentu, który idealnie prezentuje się w karcie treści wiadomości panelu (`ReportContentCard`).
   - Wysłanie raportu do skrzynki `POST /api/reports/ingest` z autoryzacją M2M nagłówkiem `x-ingest-secret`.
   - Powiązanie tożsamości: nick gracza w Roblox (`Robloxianu5a9m1s7a`) jest mapowany na dziecko `Ola (demo)` i trafia do skrzynki `Mama Oli (demo)` ze statusem `pending_parent`.
   - Ekran końcowy w Robloxie prezentuje status wysyłki do rodzica, odznakę 3D oraz podgląd danych.

</domain>

<decisions>
## Implementation Decisions

### Ocena i wynik (SCR-01 update)
- **D-30:** Brak punktacji numerycznej. Wynik to status: `status = "passed"` (bezpieczna odmowa) lub `status = "failed"` (przekazanie hasła w symulacji).
- **D-31:** Rejestrowane są metryki przebiegu: czy gracz użył pomocy Scamerino (`helpReceived`), ile prób potrzebował w quizie (`quizAttempts`), oraz czy sprawdził kartę zasad (`checkedOffer`).

### Kosmetyczna nagroda 3D (SCR-02)
- **D-32:** Nagroda przyznawana wyłącznie za zdany test (`status == "passed"`): obiekt `Accessory` o nazwie `ScamerinoShieldAccessory` przyczepiany do `BodyBackAttachment` postaci.
- **D-33:** Wygląd tarczy: złota barwa, emblemat tarczy ochronnej oraz 3-sekundowy efekt złotych cząsteczek (`ParticleEmitter`).
- **D-34:** Przy resecie (`resetForPlayer`) tarcza jest zdejmowana z postaci.

### Komunikacja z panelem opiekuna (SCR-03)
- **D-35:** Format danych dopasowany 1:1 do encji `Report` z panelu (`source: "game"`, `attack_type: "data_request"`, `taken_actions`).
- **D-36:** Bezpieczny transfer M2M: serwer gry (`ReportExportService.luau`) wysyła zapytanie na skrzynkę `POST /api/reports/ingest` z nagłówkiem `x-ingest-secret`.
- **D-37:** Odporność sieciowa: zapytanie wykonywane przez `pcall`. W przypadku braku sieci/tunelu interfejs Robloxa wyświetla podgląd wygenerowanego raportu ze statusem gotowości do importu ręcznego.

</decisions>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Klient Roblox → Serwer Roblox | Klient nie może sam przyznać sobie nagrody ani zmienić statusu zdanego testu. |
| Serwer Roblox → Backend Panelu | Wysyłka wyłącznie przez M2M z nagłówkiem `x-ingest-secret`. Gra nie ma dostępu do kont rodziców ani tokenów użytkowników. |
</threat_model>
