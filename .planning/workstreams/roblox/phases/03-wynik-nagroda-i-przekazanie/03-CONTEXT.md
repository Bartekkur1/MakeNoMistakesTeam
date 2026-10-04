# Phase 3: Wynik, nagroda i przekazanie — Context

**Gathered:** 2026-10-04  
**Status:** Ready for replanning — oba istniejące plany wymagają aktualizacji przed wykonaniem.  
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

<discussion_update>
## Aktualizacja po dyskusji GSD — 2026-10-04

Poniższe decyzje zastępują sprzeczne zapisy powyżej oraz w istniejących 03-01 i 03-02. To obowiązująca wersja wymagań fazy 3.

### Zaliczenie i tarcza
- **D-30 (aktualizacja):** Końcowa bezpieczna odmowa zalicza ćwiczenie, również po pomocy Scamerino i błędach w quizie. Bez punktacji.
- **D-31 (aktualizacja):** Zgłoszenie zawiera wyłącznie decyzję końcową i informację o użyciu pomocy; bez transkryptu, prób quizu i sprawdzenia oferty. Stan quizu nadal może służyć logice ćwiczenia.
- **D-32 (aktualizacja):** Ta sama nagroda za odmowę samodzielną, po pomocy i po ponownej próbie po błędzie. Accessory na plecach, BodyBackAttachment, bez duplikatów.
- **D-33 (aktualizacja):** Tarcza w kolorach Scamerino ze złotą obwódką. Krótki złoty rozbłysk tylko przy pierwszym zdobyciu w sesji; nie powtarzać po odrodzeniu ani kolejnym zaliczeniu.
- **D-34 (aktualizacja):** Nagroda zostaje do końca sesji. Reset ćwiczenia jej nie usuwa; odrodzenie automatycznie ją przywraca. Późniejszy błąd nie odbiera zdobytej tarczy. Bez zapisu między sesjami.

### Ekran zakończenia
- **D-38:** Mała karta podsumowania obok czatu, z widoczną mapą i możliwością ponownej próby.
- **D-39:** Po odmowie: „Dobra decyzja! Twoje hasło zostaje u Ciebie” i informacja o tarczy. Kolejne zaliczenie nie sugeruje zdobycia drugiej tarczy.
- **D-40:** Po błędzie: „To było ćwiczenie. Hasło daje dostęp do konta — spróbuj jeszcze raz”. Bez sugestii ujawnienia prawdziwych danych i konieczności zmiany rzeczywistego hasła.
- **D-41:** Tylko status wysyłki do opiekuna; bez podglądu raportu, JSON-a i kopiowania do schowka.

### Zgłoszenie do opiekuna
- **D-35 (aktualizacja):** source=game, attack_type=data_request. Krótkie podsumowanie decyzji i pomocy, wyraźnie oznaczone jako ćwiczenie. Błąd: „Ćwiczenie Roblox: gracz wybrał fikcyjne przekazanie hasła”. Panel nie może przedstawiać symulacji jako rzeczywistego ujawnienia danych; podczas planowania sprawdzić semantykę taken_actions i prezentację ryzyka.
- **D-36 (doprecyzowanie):** Serwer Roblox wysyła POST /api/reports/ingest z x-ingest-secret. Sekret wyłącznie serwerowy; nie wpisywać wartości do kodu ani dokumentacji. Tożsamość z Player, nie od klienta.
- **D-42:** Automatycznie po każdej zakończonej próbie — bezpiecznej i błędnej. Osobne zgłoszenie na próbę. Przerwanie rozmowy nie jest zakończoną próbą.
- **D-43:** Powiązane konto trafia do przypisanego opiekuna. Nieprzypisane konto używa „Mama Oli (demo)”, z wyraźnym oznaczeniem profilu demonstracyjnego. Adresat z odpowiedzi API, bez hardkodowania go dla każdego gracza.

### Brak połączenia
- **D-37 (aktualizacja):** Kilka ograniczonych prób wysyłki w tle. Ćwiczenie i nagroda działają dalej. Po wyczerpaniu prób: „Nie udało się wysłać do opiekuna”. Bez kolejki późniejszego wysłania, podglądu offline i deklarowania zapisu.
- **D-44:** „Wysyłanie do opiekuna…” w trakcie, następnie potwierdzenie odbioru API albo błąd. Doręczenie nie oznacza przeczytania przez opiekuna.
- **D-45:** Ponowna próba dostępna podczas wysyłki; poprzednie żądanie kończy się w tle. Status starej próby nie nadpisuje statusu nowej.

### Swoboda techniczna i granice
- Rozmiar karty, geometria tarczy, czas rozbłysku oraz limit i odstępy ponowień: do ustalenia w planie.
- Stan zdobytej nagrody na sesję oddzielić od stanu pojedynczego ćwiczenia.
- Ponowienia wymagają rozwiązania ryzyka duplikatów po zapisaniu raportu i utracie odpowiedzi. Nie zakładać istniejącej deduplikacji backendu.
- Odbiór desktopowy; telefon nadal odłożony. PASS w raportach dopiero po faktycznej weryfikacji.
- Bez rozszerzania zakresu o panel nauczyciela, trwały zapis nagrody lub kolejkę offline.
</discussion_update>

<canonical_refs>
## Canonical References

Downstream agents MUST read these before planning or implementing.

- `.planning/PROJECT.md` — fikcyjne dane i granice demo.
- `.planning/workstreams/roblox/ROADMAP.md` i `.planning/workstreams/roblox/REQUIREMENTS.md` — historyczne zapisy punktacji wymagają uzgodnienia z D-30.
- `.planning/workstreams/roblox/phases/02-wybory-konsekwencje-i-pomocnik/02-CONTEXT.md` — misja, pomoc i bezpieczny sync.
- `.planning/shared/CONTRACT.md` i `.planning/shared/MEASUREMENT.md` — wspólne historyczne zasady; nie zmieniać zasad pozostałych workstreamów przy usuwaniu punktacji Roblox.
- `assets/scamerino_palette.json` i `assets/Scamerino_Alertinio.png` — wygląd nagrody.
- `roblox/src/server/MissionService.server.luau`, `roblox/src/shared/MissionContent.luau`, `roblox/src/client/MissionController.client.luau` — integracja stanu i prezentacji.
- `roblox/sync.project.json` — konfiguracja live; nie nadpisywać mapy przez default.project.json.
- `projects/web-app/src/app/api/reports/ingest/route.ts`, `projects/web-app/src/lib/server/validate.ts`, `projects/web-app/src/lib/server/roblox.ts`, `projects/web-app/src/lib/contract/types.ts`, `projects/web-app/src/app/_panel/ReportCards.tsx`, `projects/web-app/src/app/_panel/ReportActionsCard.tsx` — aktualny kontrakt i prezentacja. Podczas scoutingu dostępne w lokalnej referencji origin/master, nie w working tree gałęzi; odświeżyć podstawę gałęzi przed planowaniem.
</canonical_refs>

<code_context>
## Existing Code Insights

- MissionService: stan per gracz, revision, helpReceived, quizAttempts. MissionController: czat i replay. Nagroda i zaliczenie kontrolowane przez serwer.
- Ingest sprawdzony w origin/master przyjmuje outcome, nie test_outcome. score opcjonalne — pominąć w tej fazie; wartości outcome sprawdzić w aktualnym kontrakcie.
- Odpowiedź API: ok, report_id, child_name, parent_name, state, matched. Nieprzypisane konto ma fallback demo.
- Obecny ingest tworzy raport przy każdym wywołaniu; brak wykazanej deduplikacji.
- Istniejące plany nie spełniają aktualnych decyzji; nie wykonywać przed ponownym planowaniem.
</code_context>

<deferred>
## Deferred Ideas

Nie dodano nowych funkcji poza zakresem. Trwała nagroda, kolejka offline i test telefonu nie należą do tej fazy.
</deferred>
