# Phase 2: Ścieżka sprawdzania - Context

**Gathered:** 2026-10-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Rozszerzenie prowadzi dziecko przez sprawdzanie zatwierdzonej wiadomości: krótka wskazówka bezpieczeństwa, pytania, sygnały, brakujące informacje i proponowany krok (CHK-01, CHK-02, CHK-03). Działa według jawnych reguł, bez gwarancji bezpieczeństwa. Faza obejmuje roboczy pakiet treści w widget, ponieważ wspólny pakiet osoby 4 jeszcze nie istnieje.

Wysyłka i odpowiedź opiekuna oraz awarie backendu należą do fazy 3; mobilna strona do fazy 4. AI pozostaje poza tą fazą.
</domain>

<decisions>
## Implementation Decisions

### Przebieg pytań

- **D-01:** Gotowe odpowiedzi, jedno pytanie na ekranie, opcja „Nie wiem”.
- **D-02:** Trzy pytania: kto wysłał; czego chce i czy pogania (wielokrotny wybór); jak sprawdzić poza wiadomością.
- **D-03:** Pomocnik wstępnie zaznacza rozpoznane odpowiedzi; dziecko potwierdza lub poprawia.
- **D-04:** Nic nie zaznaczać; dziecko wybiera odpowiedź lub „Nie wiem”. Rozpoznane propozycje oznaczone „Podpowiedź z wiadomości”; wymagane kliknięcie „Dalej”.

### Prezentacja wyniku

- **D-05:** Krótkie podsumowanie i trzy sekcje: Co zwraca uwagę, Czego jeszcze nie wiemy, Co możesz teraz zrobić. Bez oceny bezpieczne.
- **D-06:** Spokojnie, z ograniczeniami: Nie widzę typowych sygnałów oszustwa. To nie daje pewności — sprawdź wiadomość oficjalnym kanałem.
- **D-07:** Konkretny powód i działanie, np. Prośba o kod do konta to sygnał ostrzegawczy. Nie podawaj go.
- **D-08:** Jeden główny krok dopasowany do wyniku, z krótkim wyjaśnieniem jak go wykonać.

### Przerwanie i poprawianie odpowiedzi

- **D-09:** Powrót do tego samego pytania z zachowanymi odpowiedziami w pamięci karty. Przeładowanie usuwa stan.
- **D-10:** Wróć przy pytaniach i Popraw odpowiedzi na wyniku. Zachować odpowiedzi; po zmianach przeliczyć wynik.
- **D-11:** Powrót do edycji. Zmiana tekstu lub linku i ponowne zatwierdzenie rozpoczyna pytania od nowa oraz usuwa poprzednie odpowiedzi i wynik.
- **D-12:** Wrócić do trwającego sprawdzania i pokazać Sprawdź nowe zaznaczenie. Przycisk otwiera podgląd nowej treści. Usunąć dotychczasowy postęp dopiero po zatwierdzeniu nowej treści.

### Treści i reguły na demo

- **D-13:** Roboczy pakiet pytań, odpowiedzi i reguł w widget, do przejrzenia i późniejszego dopasowania do materiałów osoby 4.
- **D-14:** Wyłudzanie hasła lub kodu, darmowa nagroda z podejrzanym linkiem, presja na zapłatę, uczciwa wiadomość i przypadek z brakującymi informacjami.
- **D-15:** Pokazać rozbieżność i pozwolić poprawić odpowiedź. Jeśli dziecko zachowa wybór, wynik wyjaśnia niepewność i zachowuje konkretne ostrzeżenie, np. dotyczące kodu.
- **D-16:** Stała dla każdej wiadomości: Zanim sprawdzimy: nie podawaj hasła ani kodu i nie klikaj nieznanego linku.

### Ustalenia przeniesione z fazy 1

- Małe okno przy widocznym rekinie; panel przesuwa się razem z awatarem, zachowując tekst i fokus. Polska treść dostosowana do dzieci, istniejąca paleta i grafika.
- Odczyt strony wyłącznie po działaniu dziecka i tylko z przekazanego zaznaczenia; brak monitorowania kontekstu rozmowy.
- Stan pytań i wyniku pozostaje w pamięci bieżącej karty, bez zapisu treści na dysku. Zamknięcie karty lub zmiana dokumentu usuwa stan; zmiana karty go zachowuje.
- W fazie 3 zatwierdzenie oznacza natychmiastowe przekazanie sprawy opiekunowi, wynik dopisywany później. To wcześniejsza decyzja, której starszy kontrakt i HND-02 jeszcze nie odzwierciedlają; nie implementować wysyłki w fazie 2.

### Zakres swobody planowania

- Dokładne warianty odpowiedzi, reguły rozpoznawania, priorytety sygnałów oraz struktura roboczego pakietu wymagają opracowania zgodnie z decyzjami powyżej. Użytkownik nie wybrał konkretnej biblioteki ani architektury.
- Roboczy pakiet umieścić w projects/widget/. Wspólne materiały pozostają tylko do odczytu; późniejsze dopasowanie do osoby 4 nie może po cichu zmieniać ustalonych zachowań.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

- .planning/workstreams/widget/ROADMAP.md — granice fazy 2 i kryteria sukcesu.
- .planning/workstreams/widget/REQUIREMENTS.md — CHK-01, CHK-02, CHK-03.
- .planning/workstreams/widget/phases/01-rozszerzenie-i-przekazanie-tre-ci/01-CONTEXT.md — wcześniejsze decyzje, prywatność i model przekazania opiekunowi.
- .planning/workstreams/widget/STATE.md — końcowe ustalenie UAT: panel podąża za widocznym rekinem.
- .planning/PROJECT.md — ograniczenia demo i tylko fikcyjne dane.
- .planning/shared/README.md — własność wspólnych materiałów i granice workstreamów.
- .planning/shared/CONTRACT.md — wstępny kontrakt; integracja backendu w fazie 3, nie jest jeszcze kompletny.
- .planning/shared/content/ — planowane źródło pytań i reguł osoby 4; katalog nie istnieje w chwili dyskusji. Nie traktować jako istniejącej zależności blokującej roboczy pakiet widget.
- assets/scamerino_palette.css — istniejące tokeny wizualne.
- projects/widget/README.md — budowanie i sprawdzanie rozszerzenia.
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- projects/widget/src/ui/panel.js — istniejący panel i widoki menu, wklejania, podglądu oraz potwierdzenia; punkt rozszerzenia o pytania i wynik.
- projects/widget/src/ui/strings.pl.js — centralne teksty polskie.
- projects/widget/src/ui/widget.css — izolowany wygląd panelu.
- projects/widget/src/core/case.js — normalizacja, limity tekstu i linku, budowa zatwierdzonej sprawy.
- assets/widget-avatar/ — zaakceptowana grafika rekina i ikony.

### Established Patterns

- Vanilla JavaScript, Shadow DOM, renderowanie tekstów przez textContent i jawne handlery zdarzeń.
- Stan szkicu w pamięci karty; jawne zatwierdzenie treści i brak wysyłki sieciowej w dotychczasowym przepływie.

### Integration Points

- projects/widget/src/core/integration.js — submitCase przekazuje zatwierdzoną sprawę do service workera i wymaga odpowiedzi ok.
- projects/widget/src/content/main.js — istniejący przepływ wejścia i sterowanie stanem.
- Obecny ekran confirmation jest punktem podłączenia ścieżki fazy 2. Rozróżniać lokalne przyjęcie sprawy od wysyłki opiekunowi w przyszłej fazie.
</code_context>

<specifics>
## Specific Ideas

- Podsumowanie bez sygnałów: „Nie widzę typowych sygnałów oszustwa. To nie daje pewności — sprawdź wiadomość oficjalnym kanałem”.
- Ostrzeżenie: „Prośba o kod do konta to sygnał ostrzegawczy. Nie podawaj go”.
- Rozbieżność: „W wiadomości jest prośba o kod. Czy chcesz zmienić odpowiedź?”.
- Sekcje wyniku: „Co zwraca uwagę”, „Czego jeszcze nie wiemy”, „Co możesz teraz zrobić”.
</specifics>

<deferred>
## Deferred Ideas

Brak nowych pomysłów poza zakresem. Wysyłka i odpowiedź opiekuna pozostają w fazie 3, mobilna strona w fazie 4; AI i zrzuty ekranu w v2.
</deferred>

---
*Phase: 02-cie-ka-sprawdzania*
*Context gathered: 2026-10-03*
