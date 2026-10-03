# Phase 2: Wybory, konsekwencje i pomocnik - Context

**Gathered:** 2026-10-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Rozbudowa jednej misji w Place1: cztery działania gracza (sprawdzenie oferty, fikcyjne przekazanie hasła, odmowa, pomoc), konsekwencje i ponowna próba; poprawiona sylwetka Scamerino oraz chodzenie i podejście obu NPC. MIS-02..07.

Rozmowa ma przypominać krótki kontakt z innym graczem: automatyczna zaczepka, dymki i symulowany prywatny czat z odpowiedziami do wyboru. To prezentacja scenariusza NPC, bez prawdziwych wiadomości do innych kont i bez wpisywania danych logowania.

Punktacja, nagroda i eksport wyniku należą do fazy 3. Test telefonu pozostaje odłożony przez użytkownika.

</domain>

<decisions>
## Implementation Decisions

### Obowiązujące ustalenia i zastąpione założenia
- **D-01:** Pracujemy na scalonym Place1. Skrypty pochodzą z repo i synchronizujemy je przez `roblox/sync.project.json`; Workspace przygotowujemy w Studio i eksportujemy do repo. Nie synchronizować aktywnej mapy przez pełny `default.project.json`.
- **D-02:** Obowiązujący scenariusz to MatiBuilds oferujący Robuxy w zamian za hasło. Historyczne określenia „kod SMS/kod konta” w wymaganiach nie oznaczają powrotu do poprzedniego scenariusza. Przekazanie hasła jest wyłącznie wyborem przycisku, bez pola na prawdziwe hasło.
- **D-03:** Automatyczny start po podejściu zastępuje wcześniejszy start przez E / ProximityPrompt w `02-SCOPE.md` i fazie 1. Aktywny Scamerino 3D zastępuje ograniczenie GUI-only z fazy 1. Przy rozbieżnościach dotyczących tych decyzji obowiązuje niniejszy kontekst.

### Wygląd i animacje Scamerino
- **D-04:** Poprawić całą sylwetkę, również głowę i kończyny, wzorując się na `assets/Scamerino_Alertinio.png`; nie ograniczać naprawy do torsu.
- **D-05:** Rekin-robot z charakterystyczną głową, dopasowanym torsem i kończynami; zachować kolory i akcesoria maskotki. Przed zmianą zachować kopię aktualnego modelu i ustalić przyczynę wad torsu w Place1.
- **D-06:** Spokojne chodzenie na nogach z lekkim ruchem rąk. Model i akcesoria pozostają spójne podczas ruchu; bez unoszenia się i sprężystego kreskówkowego kroku.
- **D-07:** Podczas pomocy wykonuje gesty, np. lupą lub tarczą. Alarm miga na czerwono dopiero po błędnej decyzji wobec scammera mimo otrzymanej pomocy. Wezwanie pomocnika i błędna odpowiedź na jego pytanie same nie uruchamiają alarmu.

### Zachowanie scammera
- **D-08:** Spaceruje po placu, zauważa gracza w pobliżu, podchodzi i zatrzymuje się w wygodnej odległości. Respektuje przeszkody i nie wchodzi w gracza.
- **D-09:** Po podejściu automatycznie zaczyna krótką rozmowę. Zaczepki w dymkach; dalsza wymiana w symulowanym prywatnym czacie. Gracz nie musi naciskać E.
- **D-10:** Gdy gracz odchodzi bez podjęcia rozmowy, scammer krótko idzie za nim, rzuca jedną dodatkową zaczepkę z presją czasu (np. „Zostało jedno miejsce w giveawayu, zaraz przepada!”), potem odpuszcza i wraca do spacerowania. Po zmianie na automatyczny start „bez rozmowy” oznacza brak odpowiedzi na zaczepkę.
- **D-11:** Oddalenie w trakcie rozmowy przerywa ją i zamyka okno. Po powrocie można zacząć od początku. Nie blokować ruchu gracza.
- **D-12:** Po pierwszej odmowie jeszcze raz próbuje przekonać, np. „Przecież możesz potem zmienić hasło”, i daje kolejny wybór. Po drugiej odmowie odpuszcza, mówi np. „Dobra, jak nie chcesz, to nie”, odchodzi i uruchamia dobre zakończenie.
- **D-13:** Po przyjściu Scamerino próbuje go podważyć jednym dymkiem, np. „On przesadza, przecież to tylko giveaway”. Nie przerywa wskazówek i nie widzi prywatnej rozmowy z pomocnikiem.

### Symulacja prywatnego czatu
- **D-14:** Zastąpić duży panel scenki małym panelem przypominającym czat Roblox: nicki, historia krótkich wiadomości i odpowiedzi do wyboru. Wybrana odpowiedź gracza pojawia się w historii jako jego wiadomość.
- **D-15:** Dwie osobne rozmowy w jednym panelu: MatiBuilds i Scamerino. Każda ma własną historię. Pomocnik nie dołącza jako trzeci uczestnik prywatnej rozmowy ze scammerem.
- **D-16:** Po wezwaniu pomocnika otwiera się rozmowa ze Scamerino; po wskazówkach wracamy do zachowanej rozmowy z MatiBuilds. Dymki zaczepki są osobne od wiadomości prywatnych: nie wyświetlać treści całej prywatnej rozmowy jako publicznych dymków.
- **D-17:** Rozmowa ma być krótka i naturalna; krótkie wiadomości zamiast monologu. Propozycja 2–3 wiadomości do pierwszej decyzji jest wskazówką planowania, nie narzuconym limitem użytkownika. Zachować polski język oraz pozornie zwyczajny wygląd gracza MatiBuilds.
- **D-18:** Czat jest symulacją opartą na gotowych odpowiedziach, a nie swobodnym pisaniem ani faktycznym kanałem whisper konta Roblox. Nie wymaga włączania komunikacji z innymi graczami.

### Pomoc Scamerino
- **D-19:** Wybór pomocy uruchamia podejście do proszącego gracza. Pojawia się „Scamerino idzie…”, scammer rzuca jedną zaczepkę. Rozmowa czeka: gracz nie podejmuje kolejnych decyzji wobec scammera przed zakończeniem wskazówek.
- **D-20:** Po dojściu Scamerino daje krótką wskazówkę i pytanie z odpowiedziami do wyboru, np. „Do przekazania Robuxów nie potrzeba twojego hasła. Dlaczego on o nie prosi?”.
- **D-21:** Pierwsza błędna odpowiedź powoduje dodatkową podpowiedź i ponowienie pytania. Druga błędna odpowiedź powoduje krótkie wyjaśnienie i powrót do decyzji. Maksymalnie dwie próby, bez pętli wymagającej poprawnej odpowiedzi.
- **D-22:** Scamerino zostaje przy graczu do końca decyzji. Po fikcyjnym przekazaniu hasła mimo pomocy: czerwony migający alarm oraz krótka wiadomość w czacie Scamerino, np. „Stop! Hasło daje dostęp do konta. To było ćwiczenie — spróbuj jeszcze raz”.
- **D-23:** Po bezpiecznej decyzji: krótka pochwała w czacie Scamerino, np. „Dobrze, hasło zostaje u ciebie”, bez alarmu. Dotyczy ścieżki, na której pomocnik został wezwany.
- **D-24:** Ponowne wezwanie nie tworzy równoległych podejść. Brak ścieżki kończy oczekiwanie czytelnym komunikatem; nie zostawia misji zablokowanej. Restart lub zniknięcie gracza przerywa nieaktualne podejście i resetuje stan obu NPC.

### Sprawdzenie oferty i konsekwencje
- **D-25:** „Sprawdź ofertę” obejmuje dopytanie scammera o potrzebę hasła, jego wymówkę i możliwość porównania jej z zasadami przekazywania Robuxów.
- **D-26:** Zasady pokazać na krótkiej karcie w grze ze źródłem Roblox, bez wychodzenia z misji. Treść i źródło należy sprawdzić podczas przygotowania planu/implementacji; nie przedstawiać tekstu scammera jako zasad platformy.
- **D-27:** Po zamknięciu karty wraca rozmowa i samodzielna decyzja: odmowa, pomoc lub fikcyjne przekazanie hasła. Sprawdzenie oferty nie rozstrzyga automatycznie zakończenia i nie wymaga dodatkowego pytania sprawdzającego.
- **D-28:** Po fikcyjnym przekazaniu hasła scammer odchodzi; krótka animacja z symbolem utraty dostępu do fikcyjnego konta, następnie wyjaśnienie i „Spróbuj ponownie”. Nie zmieniać rzeczywistego konta Roblox. Alarm pomocnika tylko według D-07 i D-22.
- **D-29:** Ponowna próba resetuje przebieg, historie rozmów, alarm oraz stan ruchu NPC i przywraca gracza na start. Etapy i decyzje pozostają kontrolowane przez serwer; klient prezentuje rozmowę i wysyła wybór.

### Swoboda implementacji
- Konkretne odległości zauważenia, przerwania rozmowy i zatrzymania, czas krótkiego podążania oraz przerwy między wiadomościami: do dobrania podczas planowania, aby uniknąć natarczywych ponownych otwarć.
- Wymiary panelu, detale animacji, rig i rozwiązanie nawigacji: do ustalenia technicznie na podstawie istniejących modeli. Użytkownik określił zachowanie i wygląd, nie technologię.
- Przykładowe wypowiedzi wyznaczają ton; dopuszczalne krótkie poprawki redakcyjne zgodne z research i treściami zespołu.
- Zasady wyboru celu przy kilku graczach wymagają rozwiązania w planie, bez mieszania historii i stanów misji między graczami.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Zakres i historia decyzji
- `.planning/PROJECT.md` — cel produktu i ograniczenia fikcyjnych danych.
- `.planning/workstreams/roblox/REQUIREMENTS.md` — MIS-02..07; historyczny kod zastąpiony scenariuszem hasła według D-02.
- `.planning/workstreams/roblox/ROADMAP.md` — cel fazy 2 i granica fazy 3.
- `.planning/workstreams/roblox/phases/02-wybory-konsekwencje-i-pomocnik/02-SCOPE.md` — zakres rozszerzony przez Roberta; start przez E zastąpiony D-03.
- `.planning/workstreams/roblox/phases/01-studio-publikacja-i-szkielet-levelu/01-CONTEXT.md` — serwerowy stan, fikcyjne dane, Rojo i geometria Studio; aktualizacje D-01..03 mają pierwszeństwo.
- `.planning/workstreams/roblox/phases/01-studio-publikacja-i-szkielet-levelu/01-02-SUMMARY.md` — granice odbioru fazy 1 i test telefonu odłożony przez użytkownika.
- `ideas/defence/research.md` — schematy scamów Roblox; brak rankingu częstości.
- `.planning/shared/README.md` — podział odpowiedzialności; wspólne artefakty tylko do odczytu.
- `.planning/shared/CONTRACT.md` i `.planning/shared/MEASUREMENT.md` — kontekst integracji i wyniku na fazę 3.
- `.planning/shared/content/` — docelowe treści zespołu; katalog nie istnieje w chwili dyskusji. Nie blokować planu na nieistniejącym pliku i nie wymyślać zatwierdzenia treści przez osobę 4.

### Referencje wyglądu
- `assets/Scamerino_Alertinio.png` — główna referencja wizualna.
- `assets/scamerino_palette.json` — istniejąca paleta.
- `assets/scamerino_alertino.blend`, `assets/scamerino_alertino.fbx`, `assets/scamerino_alertino.glb`, `assets/scamerino_alertino_preview.png` — istniejące assety do oceny przy planowaniu; nie dowodzą poprawności aktualnego modelu w Place1.

### Zewnętrzna dokumentacja czatu
- https://create.roblox.com/docs/chat/bubble-chat — dymki NPC i graczy.
- https://create.roblox.com/docs/chat/chat-window — wygląd czatu i wiadomości NPC.
- https://create.roblox.com/docs/reference/engine/classes/TextChatService — whisper między dwoma graczami; symulacja dwóch oddzielnych rozmów.
- https://en.help.roblox.com/hc/en-us/articles/203313520-Experience-Chat — czat w grze i warunki komunikacji.
- https://en.help.roblox.com/hc/en-us/articles/32461054421012-Party-FAQ — rozmowy grupowe są odrębnym mechanizmem, którego tu nie odtwarzamy.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `roblox/src/shared/MissionContent.luau`: obecny scenariusz MatiBuilds i dwa wybory; rozbudować do krótkich etapów i czterech działań.
- `roblox/src/client/MissionController.client.luau`: istniejący interfejs decyzji i replay; zastąpić prezentację panelem czatu.
- `roblox/src/client/ScamerinoDialogueController.client.luau`: osobny panel pomocnika i edukacyjne teksty; połączyć przebieg z misją i nową rozmową. Stare odniesienia do FreeRobux_Giver/kodu SMS nie są docelowym scenariuszem.
- `roblox/src/server/ScammerNPCManager.server.luau`: obecnie idle, zaczepki i śledzenie głową; nie realizuje chodzenia.
- `scripts/build_scamerino_npc.luau`: istniejący builder pomocnika do oceny, nie dowód zgodności z aktualnym modelem Studio.

### Established Patterns
- Luau strict, podział server/client/shared, teksty w module danych.
- `roblox/src/server/MissionService.server.luau`: stan per gracz, walidacja wyborów przez serwer, RemoteEventy, ograniczanie częstotliwości żądań i replay.
- Bezpieczny sync skryptów przez `roblox/sync.project.json`; mapa/model z Studio do repo. Bez testów telefonu w tej fazie.

### Integration Points
- Zastąpić uruchomienie przez ProximityPrompt automatycznym zdarzeniem po podejściu, z walidacją serwera.
- Powiązać ruch NPC, przerwanie po oddaleniu, pomoc, osobne historie czatu i zakończenia z jednym stanem misji per gracz.
- Przygotować dane o użyciu pomocy pod fazę 3; nie implementować teraz punktacji ani eksportu.
- Aktualną geometrię i rig trzeba sprawdzić w Place1 przed zmianą; w tej dyskusji nie wykonywano inspekcji ani modyfikacji Studio.

</code_context>

<specifics>
## Specific Ideas

- Użytkownik odrzucił wrażenie sztucznej scenki: „symulowany prywatny czat w którym można wybrać odpowiedzi” i „dwie osobne rozmowy żeby gracz miał wrażenie że to prawdziwy czat”.
- Scammer wygląda jak zwykły gracz; oferuje Robuxy, stopniowo przechodzi do prośby o hasło, naciska tylko krótko.
- Prośba o pomoc nie rozstrzyga decyzji za gracza. Alarm komunikuje błędny wybór mimo wskazówek, nie karę za proszenie o pomoc.

</specifics>

<deferred>
## Deferred Ideas

Nie dodano nowych pomysłów poza zakresem fazy. Punktacja, kosmetyczna nagroda i eksport pozostają w fazie 3. Test telefonu odłożony na życzenie użytkownika.

</deferred>

---

*Phase: 02-wybory-konsekwencje-i-pomocnik*
*Context gathered: 2026-10-03*
