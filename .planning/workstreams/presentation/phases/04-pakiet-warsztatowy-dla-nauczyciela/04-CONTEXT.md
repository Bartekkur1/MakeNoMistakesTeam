# Phase 4: Pakiet warsztatowy dla nauczyciela - Context

**Gathered:** 2026-10-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Osobny PDF do druku A4 („pakiet warsztatowy”), z którego nauczyciel przeprowadzi 3 lekcje (po 45 min) o bezpiecznym poruszaniu się w internecie dla uczniów klas 4–8. Pakiet zawiera konspekty dla nauczyciela, karty pracy do ksero, plansze na rzutnik, quizy z kluczem i karty do domu. Rozszerza istniejący poradnik dla rodziców i nauczycieli (quick 261003-vel); sam poradnik dostaje tylko odsyłacz. Faza obejmuje też jedną drobną wzmiankę o pakiecie na slajdzie o szkole.

Poza zakresem: zmiany w grze Roblox, widgecie i backendzie (zasada zespołu: tylko prezentacja i materiały).

</domain>

<decisions>
## Implementation Decisions

### Forma i miejsce
- **D-01:** Osobny plik PDF, np. `projects/presentation/warsztaty/warsztaty-bezpieczna-aura.pdf`, ze źródłem HTML obok. Poradnik (`poradnik.html`) dostaje tylko odsyłacz do pakietu, np. w rozdziale dla nauczyciela; nie dopisujemy do niego rozdziałów.
- **D-02:** Wspólna szata graficzna z poradnikiem: paleta ze `slides/style.css`, maskotka Scamerinio z `assets/`, układ A4 do druku, render przez Edge headless (jak w poradniku).
- **D-03:** Własna okładka z maskotką, spis lekcji i strona „Jak korzystać z pakietu”.
- **D-04:** Trzy rodzaje materiałów: (a) konspekty dla nauczyciela, (b) karty pracy dla ucznia: czarno-białe, łatwe do kserowania, każda na osobnej stronie, (c) kolorowe plansze na rzutnik z przykładowymi wiadomościami. Do tego klucze odpowiedzi dla nauczyciela.
- **D-05:** Przykładowe wiadomości jako makiety podobne do zrzutów ekranu (dymki czatu Roblox, Discord, SMS, e-mail narysowane w HTML/CSS), z fikcyjnymi nickami i domenami i wyraźnym oznaczeniem „ćwiczenie / przykład fikcyjny”. Linki jako nieklikalny tekst z `[.]`. Bez prawdziwych zrzutów ekranu i bez prawdziwych logo platform.

### Skala i układ lekcji
- **D-06:** 3 lekcje po 45 min. Proponowany podział, który planner może dopracować: (1) Rozpoznaj oszustwo: darmowe Robuxy, fałszywy admin, phishing SMS/mail; (2) Chroń konto i dane: kody, hasła, przejęte konto kolegi, wymiany, pliki HAR/cookies; (3) Obcy i presja: przejście na Discorda, sekrety, prezenty, pieniądze/BLIK, plus kogo prosić o pomoc.
- **D-07:** Jeden poziom: klasy 4–8, bez osobnych wariantów dla młodszych i starszych.
- **D-08:** Każdy konspekt w stałym, klasycznym układzie: cele („uczeń potrafi…”), potrzebne materiały, przebieg z minutami (wstęp, ćwiczenia, omówienie, quiz, podsumowanie), ramka „jeśli uczeń ujawni, że to mu się przytrafiło”, karta do domu.
- **D-09:** Każda lekcja kończy się kartą do domu (pół strony A4): „porozmawiaj z rodzicem o…” z odsyłaczem do poradnika i umowy rodzinnej.

### Rodzaje ćwiczeń
- **D-10:** W każdej lekcji 2–3 formy: „detektyw” (w parach zakreślają czerwone flagi na makietach i decydują: oszustwo czy nie), krótka scenka lub odgrywanie ról (ćwiczenie odmowy i proszenia o pomoc) oraz karty decyzji „co zrobisz?”.
- **D-11:** Około 1/3 przykładów to uczciwe wiadomości (np. oficjalny event, prawdziwy kolega z klasy), żeby uczniowie nie oznaczali wszystkiego jako oszustwo.
- **D-12:** Krótki quiz (3–5 pytań „co zrobisz?”) na koniec każdej lekcji, z kluczem odpowiedzi; bez ocen.
- **D-13:** Ujawnienie przez ucznia: w każdym konspekcie krótka ramka (nie dopytuj przy klasie, porozmawiaj po lekcji, dalej według „Rozdziału dla nauczyciela” i standardów ochrony małoletnich w poradniku). Bez duplikowania pełnej procedury.
- **D-14:** Scenki uczą rozpoznawania i reakcji, nie wykonania oszustwa: żadnych instrukcji, jak oszukiwać.

### Powiązanie z BezpiecznąAurą i pitchem
- **D-15:** Lekcje działają w pełni bez produktu: wystarczą wydruki i rzutnik (ew. tablica), bez komputerów dla uczniów i bez Roblox. Pakiet nie może zależeć od misji ani testu przed–po.
- **D-16:** Bez odwołań do podstawy programowej.
- **D-17:** Treści przykładów oparte na 10 scenariuszach poradnika i scenkach B13 (`ideas/defence/research.md`), uzupełnione o **nowy research**: aktualne przykłady oszustw na dzieci i istniejące lekcje i scenariusze (np. NASK, FDDS, Dyżurnet, Europol Cyber Defenders) jako wzór formy. Research robi Claude Code przez **Claude in Chrome** (narzędzia `mcp__claude-in-chrome__*`, przeglądanie stron w przeglądarce użytkownika) w kroku planowania. Użytkownik wskazał to narzędzie wprost; WebSearch/WebFetch najwyżej pomocniczo. W konfiguracji `workflow.research` jest wyłączony, ale użytkownik wprost zgodził się na research w tej fazie. Źródła wymienić w pakiecie na stronie z bibliografią lub źródłami.
- **D-18:** Dopisać krótką wzmiankę o pakiecie (jedna linijka, ewentualnie miniatura okładki) do slajdu o szkole w `slides/slides.md`. Kandydaci: slajd „Bezpieczne dla dziecka, opłacalne dla szkoły” (~l. 289) albo „Pilotaż w jednej szkole” (~l. 324). Liczba slajdów się nie zmienia (limit 10). Po zmianie przebudować `slides/scamerino-pitch.pdf`, jeśli jest generowany z `slides.md`.

### Claude's Discretion
- Dokładny podział tematów między 3 lekcje i dobór scenariuszy do każdej, z zachowaniem zasady 2/3 oszustw i 1/3 uczciwych.
- Nazwa pakietu i pliku, układ strony „Jak korzystać z pakietu”.
- Czy w lekcji wspomnieć w jednym zdaniu, że istnieje BezpiecznaAura (dozwolone tylko jako opcjonalna informacja, nie jako krok lekcji; patrz D-15).
- Wybór slajdu z D-18.
- Liczba makiet i plansz na lekcję.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Źródło treści i stylu
- `projects/presentation/poradnik/poradnik.html` — istniejący poradnik: styl, komponenty CSS, 10 scenariuszy, „Rozdział dla nauczyciela” (ok. l. 862), kontakty, umowa rodzinna, karta szybkiej reakcji; tu dodać odsyłacz do pakietu
- `.planning/quick/261003-vel-poradnik-pdf-dla-nauczyciela-i-rodzica-j/261003-vel-SUMMARY.md` — jak powstał poradnik i komenda renderu PDF przez Edge headless
- `ideas/defence/research.md` §A3 (schematy oszustw w Roblox), §B8 (Discord, SMS, mail), §B9 (skuteczność treningu), §B13 (scenki fikcyjne, w tym uczciwe oferty 6–7), „Otwarte pytania / do walidacji z nauczycielem”
- `slides/style.css` — paleta kolorów
- `assets/` — maskotka Scamerinio

### Prezentacja
- `slides/slides.md` — slajdy (~l. 289 i ~l. 324: slajdy o szkole) do drobnej wzmianki
- `.planning/workstreams/presentation/phases/03-prezentacja-demo-i-zg-oszenie/03-CONTEXT.md` — wcześniejsze decyzje o prezentacji (limit slajdów, ton)

### Zasady projektu
- `.planning/PROJECT.md` — tylko fikcyjne dane; nauczyciel nie widzi prywatnych spraw; brak rankingów i kar za proszenie o pomoc

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `poradnik.html`: gotowy szablon A4 (okładka, spis treści, łamanie stron, ramki, tabele, styl „karty”) do skopiowania lub współdzielenia w pakiecie
- Scenki B13: 5 oszustw i 2 uczciwe wiadomości gotowe do przerobienia na makiety

### Established Patterns
- HTML → PDF przez `msedge --headless=new --no-pdf-header-footer --print-to-pdf=...`
- Każda sekcja mieści się na jednej stronie; weryfikacja przez podgląd wybranych stron PDF
- Treści po polsku, prosty język, linki jako tekst z `[.]`

### Integration Points
- Odsyłacz z `poradnik.html` (rozdział dla nauczyciela, ewentualnie spis treści) do pakietu, a potem ponowny render poradnika
- Jedna linijka na slajdzie o szkole w `slides/slides.md`

</code_context>

<specifics>
## Specific Ideas

- Ćwiczenie „detektyw”: uczniowie w parach zakreślają czerwone flagi (pośpiech, „darmowe”, prośba o kod lub hasło, literówka w domenie, przejście poza platformę, sekret).
- Karty pracy czarno-białe do ksero; kolorowe makiety tylko na planszach na rzutnik.
- Karta do domu łączy lekcję z poradnikiem i umową rodzinną.

</specifics>

<deferred>
## Deferred Ideas

- Wariant lekcji z BezpiecznąAurą (misja Roblox i test przed–po jako część zajęć) — przyszła faza, jeśli powstanie pilotaż w szkole
- Odwołania do podstawy programowej — odrzucone na teraz
- Osobne poziomy trudności (kl. 4–6 i 7–8) — odrzucone na teraz

</deferred>

---

*Phase: 04-pakiet-warsztatowy-dla-nauczyciela*
*Context gathered: 2026-10-03*
