# Poprawa czatu i chodu MatiBuilds

Data: 2026-10-03. Zakres zlecony przez Roberta: okno czatu oraz animacja ruchu scammera. Nie oznacza ukończenia całego planu 02-02 ani fazy 2.

## Zmiany

- `NPCWalkAnimation.luau` animuje istniejący R15: biodra i ramiona naprzemiennie, kolana i kostki podczas przenoszenia nóg, lekkie zgięcie łokci. Prędkość fizyczna i kontakt z podłożem sterują cyklem; po zatrzymaniu następuje łagodny powrót do neutralnej pozy. Serwer replikuje C0, bez zależności od uprawnień do zewnętrznego assetu animacji. Szyja i waist pozostają pod kontrolą managera. MatiBuilds chodzi z WalkSpeed=8.
- Panel w stylu czatu: małe szare przezroczyste okno, nick przy każdej wiadomości, tekst wyrównany do lewej, ograniczona szerokość, przewijanie i neutralne przyciski. Nie ma pola na hasło ani rzeczywistego whispera. Dwie historie pozostają oddzielne; zakładki pomocnika pojawią się dopiero po otrzymaniu jego wiadomości w dalszej integracji.
- Cztery krótkie wiadomości oferty dochodzą kolejno (0.55 s do pierwszej, następnie 1.25 s przerwy); status pisania i brak przycisków podczas wypowiedzi. Wybrana odpowiedź staje się wiadomością gracza, a odpowiedź NPC i podsumowanie przychodzą osobno.
- Serwer pilnuje revision, etapu i ownera; klient odrzuca starsze snapshoty i sprawdza sequence. Subskrypcja + żądanie początkowego snapshotu chronią przed utratą wiadomości przy starcie.
- Zamknięcie przerywa kolejkę wypowiedzi. Ponowna zaczepka wymaga wyjścia z obszaru poprzedniego spotkania i powrotu; przesunięcie samego NPC nie omija blokady. Odpowiedź zatrzymuje ponaglenia; nieaktywne spotkanie po jednej zaczepce ma ograniczony czas podążania i odpuszcza. Publiczne dymki są wyświetlane przez TextChatService po stronie klientów.
- CharacterRemoving anuluje rozmowę. Poprawiono dwa lokalne błędy NPCNavigation: release nie-Ownera nie awansuje kolejki, a niedojście nie zwraca bezwarunkowego arrived.

## Dowody aktualnej kontroli

- Selene: 0 errors / 0 warnings / 0 parse errors, exit 0. Pobranie świeżego API dump nie było dostępne; użyta została biblioteka cache.
- StyLua check zmienionych źródeł: exit 0.
- Rojo offline build: exit 0; `/private/tmp/Phase2-chat-motion-final.rbxlx`. Pełny projekt nie był live-syncowany do Workspace.
- Edit: wszystkie 6 zmienionych/dodanych skryptów w Studio było bajtowo zgodnych z plikami repo przed końcowym Play.
- Actual Play: prędkość marszu około 8 studów/s. Kolejne próbki lewej strony: hip -0.164 → +0.261 → +0.479 → -0.173 rad; knee 0.239 → 0 → 0 → 0.251 → 0.482 rad; shoulder zmienia się przeciwnie do hip. Po zatrzymaniu kąty zbiegają do zera.
- Actual Play: liczba wiadomości 3 → 4 (presenting → decision); po wyborze 5 → 6 → 7 (responding → ending_bad). Odpowiedź gracza i NPC są odrębnymi wierszami. Widok panelu został obejrzany w desktopowym Studio.
- Actual Play: close ze stanu decision, przy graczu pozostającym w pobliżu — panel nadal niewidoczny po 2 s. Pierwsze oczekiwanie na otwarcie miało limit 7 s i nie zaobserwowało jeszcze podejścia; w kolejnym odczycie panel był poprawnie otwarty.
- Studio po kontroli wróciło do Edit. Poprawki modelu Scamerino i geometria mapy nie były modyfikowane.

## Pozostałe granice

Kolejka FIFO nie jest jeszcze podłączona do skanowania managera. Pełna obsługa przeszkód i ponownego wyliczania trasy w NPCNavigation nadal wymaga poprawy i kontroli. Nie przeprowadzono tu kontroli Local Server z dwoma klientami ani telefonu. Gest/alarm pomocnika, pomoc i pełne cztery ścieżki należą do dalszej realizacji. Wcześniejszy raport blanket PASS dla planu 02-02 nadal nie jest wystarczającym dowodem zamknięcia planu.
