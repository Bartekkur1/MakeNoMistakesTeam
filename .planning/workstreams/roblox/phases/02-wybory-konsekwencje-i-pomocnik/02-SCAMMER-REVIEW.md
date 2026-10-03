# Przegląd scammera i czatu — plan 02-02

Data: 2026-10-03. Cel: aktualny Place1, placeId 74400324861465. Przegląd źródeł i rzeczywisty desktop Play. Nie zmieniono kodu produkcyjnego ani właściwości sceny Edit. Po kontroli Studio wróciło do Edit. Telefon i Local Server z dwoma klientami nie były sprawdzane w tym przeglądzie.

## Wynik

PARTIAL — podstawowe podejście i czat działają; planu 02-02 nie można uznać za ukończony. Zapisane wcześniej statusy complete/PASS nie pokrywają się z obecną implementacją. Szczególnie PASS kolejki i zachowania po braku odpowiedzi są sprzeczne z kodem.

## Zaobserwowane w Play

- MatiBuilds przemieścił się od startu HRP (0,3,0) w stronę gracza przy (2.07,4.10,27.33); próbka HRP NPC (1.53,3.59,21.03), dystans około 6.35 studa. Panel rozmowy otworzył się automatycznie bez E.
- Nowy panel istnieje, ma tytuł MatiBuilds, historię i dwa neutralne przyciski. W próbie desktop miał 440×355 px. Wszystkie cztery początkowe wiadomości były obecne razem.
- Po wysłaniu produkcyjnej akcji close panel po chwili ponownie był Visible=true. Kod ponownie wybiera tego samego pobliskiego gracza bez warunku odejścia/cooldownu.
- Po przesunięciu wyłącznie runtime postaci poza promień, do (70,4,27), panel był Visible=false, a NPC wrócił w okolice punktów patrolu. Po Stop runtime przesunięcie nie zmienia sceny Edit.
- NPC nie zawiera skryptu Animate ani instancji Animation; Animator raportował 0 aktywnych ścieżek. Kod managera animuje tylko szyję/waist, nie nogi podczas marszu.
- Studio ma źródła zgodne z repo dla NPCNavigation, MissionService, MissionContent i MissionController. ScammerNPCManager ma różnicę formatowania wewnętrznej pętli; obserwowana logika odpowiada plikowi repo, ale bajty nie są identyczne.

## Ustalenia wymagające naprawy

1. **HIGH — fałszywy sukces nawigacji.** NPCNavigation.luau:319 zwraca arrived nawet wtedy, gdy końcowy dystans przekracza dopuszczalny próg. MoveToFinished nie sprawdza argumentu reached, a każdy waypoint jest porzucany po 1.5 s. Brak obsługi Path.Blocked i ponownego obliczania trasy do poruszającego się gracza. Start rozmowy może nastąpić mimo niedojścia. Wariant po braku ścieżki próbuje iść bezpośrednio do postaci. Próby omijania przeszkód nie powtórzono; obecny kod nie uzasadnia blanket PASS.
2. **HIGH — kolejka FIFO nie jest podłączona.** Manager nie wywołuje arbiter.enqueue ani nie skanuje nowych kandydatów w czasie blokującej rozmowy. Wybiera najbliższego gracza, bez wymaganej kolejności pierwszego zauważenia i deterministycznego tie-breaku. releaseOwner w module wywołuje advanceQueue również dla gracza niebędącego ownerem; po podłączeniu kolejki może to nadpisać innego ownera. Nie wykonano próby dwóch klientów; deklaracja two_player_ownership: PASS nie jest potwierdzona.
3. **HIGH — presja nie kończy spotkania.** Po 5 s manager jedynie wysyła jeden dymek; nie podąża przez ograniczony czas i nie zwalnia ownera. Nie sprawdza, czy gracz już odpowiedział. MissionService po wyniku nie zwalnia NPC, więc monitor może ponaglać także po wyborze.
4. **MEDIUM — zamknięcie natychmiast otwiera rozmowę ponownie.** Potwierdzone w Play; brak warunku ponownego podejścia lub cooldownu.
5. **HIGH — niepełne anulowanie i revision.** Brak CharacterRemoving. beginEncounter nie odrzuca starszego revision i nie weryfikuje ownera. RequestAction nie przenosi revision; akcja jest sprawdzana według stage, bez sprawdzenia ownera i numeru przebiegu. Klient renderuje każdy snapshot bez odrzucania starszych. Nawigacja przed niektórymi skutkami sprawdza sam isCancelled, a nie captured owner/revision. W części oczekiwania na waypoint brak ponownej walidacji postaci i absolutnego timeoutu.
6. **MEDIUM — brak animacji chodu scammera.** Ruch pozycji jest obecny, ale nie ma implementacji ruchu nóg/rąk podczas chodzenia. Należy dodać animację dla rzeczywistego R15, zachowując head tracking.
7. **MEDIUM — czat jest wysyłany jednorazowo.** beginEncounter wypełnia całą historię i wysyła jeden snapshot. time jest metadanymi, nie opóźnieniem. Wymagana krótka kolejka wiadomości z kontrolą revision nie istnieje. UI centruje tekst w dymkach i nie pokazuje nicka przy poszczególnych wiadomościach; podstawowy panel jest czytelny, ale odbiór naturalnej rozmowy wymaga dopracowania.

## Granice zakresu

Dwie odmowy, sprawdzenie oferty i osobny czat pomocnika należą do planu 02-03; ich brak nie jest tutaj traktowany jako błąd planu 02-02. Gest i czerwony alarm modelu nie zostały tym przeglądem zaliczone. Model został zaakceptowany wizualnie przez Roberta, ale jego zaktualizowany eksport nadal wymaga odświeżenia.

Zalecana kolejność: poprawność nawigacji i ownera → anulowanie/presja/ponowne zaczepienie → animacja chodu → sekwencyjne wiadomości → ponowny desktop Play oraz dwa klienty. Nie wykonano napraw w ramach tego przeglądu.
