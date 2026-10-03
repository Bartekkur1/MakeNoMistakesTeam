# Phase 1: Rozszerzenie i przekazanie treści - Context

**Gathered:** 2026-10-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Faza ma dać rozszerzenie Chrome, w którym:
1. **Awatar pomocnika** jest widoczny na stronach i otwiera małe okno (WID-01).
2. **Dziecko przekazuje treść**: zaznacza tekst i klika awatara albo wkleja wiadomość/link ręcznie, widzi podgląd, może edytować, i zatwierdza (WID-02).

Zatwierdzenie treści jest końcem fazy 1. Faza 1 NIE obejmuje: ścieżki pytań i wyniku (faza 2), wysyłki sprawy do opiekuna i obsługi błędów backendu (faza 3) ani wersji mobilnej (faza 4).

</domain>

<decisions>
## Implementation Decisions

### Model pomocy i dostęp do treści
- **D-01:** Pomocnik startuje **tylko na prośbę dziecka** (kliknięcie awatara). Poza naszą grą Roblox żadnego automatycznego reagowania ani monitorowania. (Roblox to osobny workstream.)
- **D-02:** Pomocnik dostaje **wyłącznie wybrany tekst i opcjonalny link**: to, co dziecko zaznaczyło lub wkleiło. Bez całej rozmowy i bez otaczającego kontekstu.
- **D-03:** Przed zatwierdzeniem: **podgląd treści, edycja (np. usunięcie imienia czy danych), opcjonalne pole na link i informacja, że treść i wynik zobaczy opiekun**. Zatwierdzenie to granica: dopiero ono tworzy sprawę (w fazie 3 wysyłaną od razu). Wyświetlenie awatara, otwarcie okna i podgląd **nie tworzą sprawy**.
- **D-04:** Szerokie uprawnienia potrzebne do obecności na stronach **nie są zgodą na czytanie ich treści**. Odczyt strony tylko w reakcji na kliknięcie awatara i tylko z bieżącego zaznaczenia. Egzekwowane w kodzie i sprawdzone testem (np. brak listenerów czytających DOM/zaznaczenie w tle, brak wysyłki czegokolwiek przed zatwierdzeniem).

### Platforma i obecność awatara
- **D-05:** MVP: **rozszerzenie Chrome (Manifest V3)** na zwykłych stronach i **Discordzie w przeglądarce**. Bez desktopowej i mobilnej aplikacji Discord.
- **D-06:** Awatar jest **automatycznie widoczny na wszystkich stronach**, na których Chrome pozwala działać rozszerzeniom (bez listy witryn i bez ręcznego włączania).
- **D-07:** Awatar można **przeciągać i schować na bieżącej stronie**. Po schowaniu wraca po przeładowaniu strony albo po kliknięciu ikony rozszerzenia.

### Okno pomocnika
- **D-08:** Kliknięcie awatara otwiera **małe okno przy awatarze**. Nie panel boczny Chrome i nie duże okno modalne.
- **D-09:** Jeśli dziecko ma zaznaczony tekst, kliknięcie awatara otwiera **podgląd z zaznaczeniem** (D-03).
- **D-10:** Bez zaznaczenia okno pokazuje **menu z dwoma przyciskami**: „Sprawdź wiadomość” (pole do wklejenia tekstu/linku, potem ten sam podgląd) oraz „Jak to działa”.
- **D-11:** „Jak to działa” to **3 kroki** (1. zaznacz wiadomość, 2. kliknij mnie, 3. sprawdź i zatwierdź) i jedno zdanie o prywatności w duchu: „Widzę tylko to, co mi pokażesz; zatwierdzoną sprawę zobaczy Twój opiekun”.
- **D-12:** **Szkic** (niezatwierdzona, edytowana treść) **przetrwa zamknięcie okna w obrębie tej samej karty**. Po ponownym kliknięciu awatara szkic wraca. Zamknięcie karty, przeładowanie albo przejście na inną stronę w karcie kasuje szkic. **Nic nie zapisujemy na dysku** (bez `chrome.storage` dla treści).
- **D-13:** Przy zmianie karty okno **zostaje na swojej karcie**. Na innych kartach go nie ma, a po powrocie stan jest taki jak przed wyjściem. Okno nie „chodzi” za dzieckiem między kartami.

### Wygląd
- **D-14:** Awatar to **nowa grafika na bazie `assets/Scamerino_Alertinio.png`**, przygotowana pod mały przycisk (przezroczyste tło, czytelna przy 48–64 px) i ikony rozszerzenia 16/32/48/128. Generowanie zlecone Codexowi 2026-10-03, z wynikiem w `assets/widget-avatar/`. **Zaakceptowane przez użytkownika 2026-10-03**: kod używa tych plików (`avatar-48/64/128.png` dla awatara, `icon-16/32/48/128.png` dla ikon rozszerzenia; `avatar-master.png` to źródło). Tymczasowa ikona nie jest już potrzebna.
- **D-15:** Okno i awatar używają **palety `assets/scamerino_palette.css`** (shark-blue `#0F62DB`, siren-amber, hook-crimson itd.) i zaokrągleń 20px (`widget` radius).
- **D-16:** Interfejs **tylko po polsku**, język dla dzieci 9–13 lat.

### Ustalenia dla późniejszych faz (NIE implementować w fazie 1)
- **Faza 2:** najpierw krótka wskazówka bezpieczeństwa, potem 2–3 pytania, wyjaśnienie sygnałów i proponowany krok. Bez gwarancji bezpieczeństwa.
- **Faza 3:** **każda zatwierdzona sprawa automatycznie i od razu trafia do opiekuna** ze statusem „sprawdzanie w toku”, a wynik dopisuje się później. Przerwanie rozmowy nie usuwa sprawy. Dziecko nie wybiera osobno „Pokaż opiekunowi”, bo zgoda jest w zatwierdzeniu (D-03). Opiekun dostaje tylko przekazaną sprawę. Nauczyciel nie dostaje prywatnych spraw. Nieudana wysyłka jest jawna, bez fikcyjnego potwierdzenia.
- To **zmienia starszy model** z HND-02 / `ideas/defence/koncepcja.md` (opcjonalny przycisk „Pokaż opiekunowi”). Przed fazą 3 trzeba zaktualizować REQUIREMENTS i uzgodnić kontrakt z `api-ui`.

### Claude's Discretion
- Struktura katalogu `widget/` (content script / service worker / popup), bundler lub jego brak, framework UI (np. vanilla + Shadow DOM, Preact).
- Izolacja stylów okna od strony (Shadow DOM zalecany, żeby strony nie psuły wyglądu i odwrotnie).
- Pozycja startowa awatara (np. prawy dolny róg z odstępem od pól pisania Discorda) i czy pozycja po przeciągnięciu jest pamiętana (sama pozycja to nie treść, więc może trafić do `chrome.storage`).
- Nawigacja SPA (np. zmiana kanału w Discordzie bez przeładowania): domyślnie **nie** kasuje szkicu. Kasuje go tylko przeładowanie lub zmiana dokumentu.
- Co widać po zatwierdzeniu w fazie 1, zanim istnieje faza 2: neutralny ekran potwierdzenia i ustrukturyzowany obiekt sprawy (tekst, link, źródło/URL strony, czas) przekazany do punktu integracji, bez wysyłki sieciowej.
- Narzędzia testów (np. Vitest + Playwright z załadowanym rozszerzeniem).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Zakres i wymagania workstreamu
- `.planning/workstreams/widget/ROADMAP.md`: cel i kryteria sukcesu fazy 1
- `.planning/workstreams/widget/REQUIREMENTS.md`: WID-01, WID-02. Uwaga: HND-02 opisuje stary, opcjonalny model wysyłki (patrz „Ustalenia dla późniejszych faz”).
- `.planning/workstreams/widget/phases/01-rozszerzenie-i-przekazanie-tre-ci/01-DISCUSS-CHECKPOINT.json`: pełny zapis pytań i opcji z pierwszej części dyskusji
- `ideas/defence/koncepcja.md`, `ideas/defence/taski.md`: koncepcja produktu i zadania osoby 3 (W2–W7). Starszy opis wysyłki nie odzwierciedla decyzji z fazy 3.

### Zasady wspólne między workstreamami
- `.planning/shared/README.md`: kod tylko w `widget/`, `shared/` tylko do odczytu
- `.planning/shared/CONTRACT.md`: minimalny kontrakt z backendem (`api-ui`), ważny od fazy 3; nie trzymać sekretów w rozszerzeniu
- `.planning/shared/content/`: **jeszcze nie istnieje**; treści pytań i wyjaśnień (faza 2) przygotuje osoba 4
- `.planning/PROJECT.md`: ograniczenia hackathonu (~24 h, tylko fikcyjne dane)

### Assety
- `assets/Scamerino_Alertinio.png`: źródłowa grafika maskotki (nie modyfikować)
- `assets/widget-avatar/`: awatar i ikony rozszerzenia (w trakcie generowania przez Codex, do weryfikacji)
- `assets/scamerino_palette.css` / `.json` / `.md`: paleta i tokeny

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Brak kodu. Katalog `widget/` jeszcze nie istnieje, to nowy projekt.
- Paleta CSS gotowa do zaimportowania: `assets/scamerino_palette.css`.

### Established Patterns
- Repo dzieli pracę na workstreamy z osobnymi katalogami kodu (`api-ui/`, `widget/`, `roblox/`, `presentation/`).
- Commity dokumentacji: `docs(...)`.

### Integration Points
- Faza 1: brak sieci. Zatwierdzona sprawa trafia do lokalnego punktu integracji (funkcja lub wiadomość do service workera), który faza 2 (ścieżka) i faza 3 (API `api-ui`) podepną.

</code_context>

<specifics>
## Specific Ideas

- Scenariusz demo: fikcyjna wiadomość na Discordzie w przeglądarce typu „darmowe Nitro, kliknij link”. Dziecko zaznacza ją, klika rekina, usuwa swoje imię w podglądzie i zatwierdza.
- Awatar nie może zasłaniać pola pisania na Discordzie, więc przesuwanie i chowanie są ważne na demo.

</specifics>

<deferred>
## Deferred Ideas

- Ścieżka pytań i wynik: faza 2. Wysyłka do opiekuna, odpowiedź opiekuna i błędy: faza 3. Strona mobilna: faza 4.
- Zrzuty ekranu z zamazywaniem danych, analiza wspomagana AI, natywne aplikacje: v2 (WID-V2-01..03).
- Pomocnik reagujący sam w zaplanowanych momentach: tylko we własnej grze Roblox (osobny workstream).
- Punkty za trening, a nie za liczbę prawdziwych zgłoszeń (`.planning/shared/MEASUREMENT.md`).

</deferred>

---

*Phase: 01-rozszerzenie-i-przekazanie-tre-ci*
*Context gathered: 2026-10-03*
